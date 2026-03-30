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
    },
    createdAt: data.createdAt || new Date().toISOString(),
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
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
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
  return users.find((user) => user.id === id) || null;
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

  const normalizedProfile = {
    interests: Array.isArray(profileUpdates?.interests)
      ? profileUpdates.interests
          .map((interest) => String(interest).trim().toLowerCase())
          .filter(Boolean)
      : [],
    goals: String(profileUpdates?.goals || "").trim(),
    gpa:
      typeof profileUpdates?.gpa === "number" && Number.isFinite(profileUpdates.gpa)
        ? profileUpdates.gpa
        : null,
    activityHours:
      typeof profileUpdates?.activityHours === "number" &&
      Number.isFinite(profileUpdates.activityHours)
        ? profileUpdates.activityHours
        : null,
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
      interests: normalizedProfile.interests,
      goals: normalizedProfile.goals,
      gpa: normalizedProfile.gpa,
      activityHours: normalizedProfile.activityHours,
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
      interests: normalizedProfile.interests,
      goals: normalizedProfile.goals,
      gpa: normalizedProfile.gpa,
      activityHours: normalizedProfile.activityHours,
    },
  };

  await writeLocalUsers(users);
  return users[index];
}
