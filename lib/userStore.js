import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getFirestoreDb, hasFirebaseAdminConfig } from "@/lib/firebaseAdmin";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const USERS_COLLECTION = "users";

function assertStorageConfigured() {
  if (!hasFirebaseAdminConfig() && process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing Firebase Admin configuration in production. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }
}

async function ensureLocalStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
}

async function readLocalUsers() {
  await ensureLocalStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");

  return Array.isArray(parsed) ? parsed : [];
}

async function writeLocalUsers(users) {
  await ensureLocalStore();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function toUserFromDoc(doc) {
  if (!doc?.exists) {
    return null;
  }

  const data = doc.data() || {};
  return {
    id: data.id || doc.id,
    email: data.email,
    passwordHash: data.passwordHash,
    profile: {
      name: data?.profile?.name || "",
      grade: data?.profile?.grade || "",
      interests: Array.isArray(data?.profile?.interests)
        ? data.profile.interests
        : [],
      goals: data?.profile?.goals || "",
      gpa:
        typeof data?.profile?.gpa === "number" && Number.isFinite(data.profile.gpa)
          ? data.profile.gpa
          : null,
      activityHours:
        typeof data?.profile?.activityHours === "number" &&
        Number.isFinite(data.profile.activityHours)
          ? data.profile.activityHours
          : null,
      extracurriculars: Array.isArray(data?.profile?.extracurriculars)
        ? data.profile.extracurriculars.map((item) => String(item).trim()).filter(Boolean)
        : [],
      intendedMajor: data?.profile?.intendedMajor || "",
      targetRole: data?.profile?.targetRole || "",
      onboardingComplete:
        typeof data?.profile?.onboardingComplete === "boolean"
          ? data.profile.onboardingComplete
          : true,
    },
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

function normalizeStoredUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    profile: {
      name: user?.profile?.name || "",
      grade: user?.profile?.grade || "",
      interests: Array.isArray(user?.profile?.interests)
        ? user.profile.interests
        : [],
      goals: user?.profile?.goals || "",
      gpa:
        typeof user?.profile?.gpa === "number" && Number.isFinite(user.profile.gpa)
          ? user.profile.gpa
          : null,
      activityHours:
        typeof user?.profile?.activityHours === "number" &&
        Number.isFinite(user.profile.activityHours)
          ? user.profile.activityHours
          : null,
      extracurriculars: Array.isArray(user?.profile?.extracurriculars)
        ? user.profile.extracurriculars.map((item) => String(item).trim()).filter(Boolean)
        : [],
      intendedMajor: user?.profile?.intendedMajor || "",
      targetRole: user?.profile?.targetRole || "",
      onboardingComplete:
        typeof user?.profile?.onboardingComplete === "boolean"
          ? user.profile.onboardingComplete
          : true,
    },
  };
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function findUserByEmail(email) {
  assertStorageConfigured();

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  if (hasFirebaseAdminConfig()) {
    const db = getFirestoreDb();
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where("emailLower", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return toUserFromDoc(snapshot.docs[0]);
  }

  const users = await readLocalUsers();
  return normalizeStoredUser(
    users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null
  );
}

export async function findUserById(id) {
  assertStorageConfigured();

  if (!id) {
    return null;
  }

  if (hasFirebaseAdminConfig()) {
    const db = getFirestoreDb();
    const doc = await db.collection(USERS_COLLECTION).doc(String(id)).get();
    return toUserFromDoc(doc);
  }

  const users = await readLocalUsers();
  return normalizeStoredUser(users.find((user) => user.id === id) || null);
}

export async function createUser({ email, passwordHash, profile }) {
  assertStorageConfigured();

  const normalizedEmail = normalizeEmail(email);
  const id = crypto.randomUUID();

  const user = {
    id,
    email: normalizedEmail,
    passwordHash,
    profile: {
      name: String(profile?.name || "").trim(),
      grade: String(profile?.grade || "").trim().toLowerCase(),
      interests: Array.isArray(profile?.interests)
        ? profile.interests.map((interest) => String(interest).trim().toLowerCase()).filter(Boolean)
        : [],
      goals: String(profile?.goals || "").trim(),
      gpa:
        typeof profile?.gpa === "number" && Number.isFinite(profile.gpa)
          ? profile.gpa
          : null,
      activityHours:
        typeof profile?.activityHours === "number" && Number.isFinite(profile.activityHours)
          ? profile.activityHours
          : null,
      extracurriculars: Array.isArray(profile?.extracurriculars)
        ? profile.extracurriculars.map((item) => String(item).trim()).filter(Boolean)
        : [],
      intendedMajor: String(profile?.intendedMajor || "").trim(),
      targetRole: String(profile?.targetRole || "").trim(),
      onboardingComplete:
        typeof profile?.onboardingComplete === "boolean"
          ? profile.onboardingComplete
          : false,
    },
    createdAt: new Date().toISOString(),
  };

  if (hasFirebaseAdminConfig()) {
    const db = getFirestoreDb();
    await db.collection(USERS_COLLECTION).doc(id).set({
      id: user.id,
      email: user.email,
      emailLower: user.email,
      passwordHash: user.passwordHash,
      profile: user.profile,
      createdAt: user.createdAt,
    });

    return user;
  }

  const users = await readLocalUsers();
  users.push(user);
  await writeLocalUsers(users);
  return user;
}

export async function updateUserProfile(userId, profileUpdates) {
  assertStorageConfigured();

  if (!userId) {
    return null;
  }

  const hasInterests = Object.prototype.hasOwnProperty.call(profileUpdates || {}, "interests");
  const hasGoals = Object.prototype.hasOwnProperty.call(profileUpdates || {}, "goals");
  const hasGpa = Object.prototype.hasOwnProperty.call(profileUpdates || {}, "gpa");
  const hasActivityHours = Object.prototype.hasOwnProperty.call(profileUpdates || {}, "activityHours");
  const hasExtracurriculars = Object.prototype.hasOwnProperty.call(
    profileUpdates || {},
    "extracurriculars"
  );
  const hasIntendedMajor = Object.prototype.hasOwnProperty.call(profileUpdates || {}, "intendedMajor");
  const hasTargetRole = Object.prototype.hasOwnProperty.call(profileUpdates || {}, "targetRole");
  const hasOnboardingComplete = Object.prototype.hasOwnProperty.call(
    profileUpdates || {},
    "onboardingComplete"
  );

  const normalizedProfile = {
    interests: hasInterests
      ? Array.isArray(profileUpdates?.interests)
        ? profileUpdates.interests
            .map((interest) => String(interest).trim().toLowerCase())
            .filter(Boolean)
        : []
      : undefined,
    goals: hasGoals ? String(profileUpdates?.goals || "").trim() : undefined,
    gpa: hasGpa
      ? typeof profileUpdates?.gpa === "number" && Number.isFinite(profileUpdates.gpa)
        ? profileUpdates.gpa
        : null
      : undefined,
    activityHours: hasActivityHours
      ? typeof profileUpdates?.activityHours === "number" &&
        Number.isFinite(profileUpdates.activityHours)
        ? profileUpdates.activityHours
        : null
      : undefined,
    extracurriculars: hasExtracurriculars
      ? Array.isArray(profileUpdates?.extracurriculars)
        ? profileUpdates.extracurriculars
            .map((item) => String(item).trim())
            .filter(Boolean)
        : []
      : undefined,
    intendedMajor: hasIntendedMajor
      ? String(profileUpdates?.intendedMajor || "").trim()
      : undefined,
    targetRole: hasTargetRole ? String(profileUpdates?.targetRole || "").trim() : undefined,
    onboardingComplete: hasOnboardingComplete
      ? typeof profileUpdates?.onboardingComplete === "boolean"
        ? profileUpdates.onboardingComplete
        : undefined
      : undefined,
  };

  if (hasFirebaseAdminConfig()) {
    const db = getFirestoreDb();
    const docRef = db.collection(USERS_COLLECTION).doc(String(userId));
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const existing = toUserFromDoc(doc);
    const nextProfile = {
      ...existing.profile,
      interests: hasInterests ? normalizedProfile.interests : existing.profile.interests,
      goals: hasGoals ? normalizedProfile.goals : existing.profile.goals,
      gpa: hasGpa ? normalizedProfile.gpa : existing.profile.gpa,
      activityHours: hasActivityHours
        ? normalizedProfile.activityHours
        : existing.profile.activityHours,
      extracurriculars: hasExtracurriculars
        ? normalizedProfile.extracurriculars
        : existing.profile.extracurriculars,
      intendedMajor: hasIntendedMajor
        ? normalizedProfile.intendedMajor
        : existing.profile.intendedMajor,
      targetRole: hasTargetRole ? normalizedProfile.targetRole : existing.profile.targetRole,
      onboardingComplete:
        normalizedProfile.onboardingComplete ?? existing.profile.onboardingComplete,
    };

    await docRef.update({
      profile: nextProfile,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await docRef.get();
    return toUserFromDoc(updatedDoc);
  }

  const users = await readLocalUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return null;
  }

  users[index] = {
    ...users[index],
    profile: {
      ...users[index].profile,
      interests: hasInterests
        ? normalizedProfile.interests
        : users[index].profile.interests,
      goals: hasGoals ? normalizedProfile.goals : users[index].profile.goals,
      gpa: hasGpa ? normalizedProfile.gpa : users[index].profile.gpa,
      activityHours: hasActivityHours
        ? normalizedProfile.activityHours
        : users[index].profile.activityHours,
      extracurriculars: hasExtracurriculars
        ? normalizedProfile.extracurriculars
        : users[index].profile.extracurriculars,
      intendedMajor: hasIntendedMajor
        ? normalizedProfile.intendedMajor
        : users[index].profile.intendedMajor,
      targetRole: hasTargetRole
        ? normalizedProfile.targetRole
        : users[index].profile.targetRole,
      onboardingComplete:
        normalizedProfile.onboardingComplete ?? users[index]?.profile?.onboardingComplete ?? true,
    },
  };

  await writeLocalUsers(users);
  return normalizeStoredUser(users[index]);
}

export async function deleteUserById(id) {
  assertStorageConfigured();

  if (!id) {
    return false;
  }

  if (hasFirebaseAdminConfig()) {
    const db = getFirestoreDb();
    const docRef = db.collection(USERS_COLLECTION).doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  const users = await readLocalUsers();
  const nextUsers = users.filter((user) => user.id !== id);

  if (nextUsers.length === users.length) {
    return false;
  }

  await writeLocalUsers(nextUsers);
  return true;
}
