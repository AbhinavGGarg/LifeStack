import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function readUsers() {
  await ensureStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");

  return Array.isArray(parsed) ? parsed : [];
}

export async function writeUsers(users) {
  await ensureStore();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const users = await readUsers();
  return users.find((user) => user.email.toLowerCase() === normalizedEmail) || null;
}

export async function findUserById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id) || null;
}

export async function createUser({ email, passwordHash, profile }) {
  const users = await readUsers();

  const user = {
    id: crypto.randomUUID(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    profile: {
      name: profile.name,
      grade: profile.grade,
      interests: profile.interests,
      goals: profile.goals,
    },
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);

  return user;
}
