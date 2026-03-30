import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const requiredFirebaseEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

export function hasFirebaseAdminConfig() {
  return requiredFirebaseEnv.every((key) => Boolean(process.env[key]));
}

function getFirebaseAdminApp() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error(
      "Missing Firebase Admin configuration. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export function getFirestoreDb() {
  const app = getFirebaseAdminApp();
  return getFirestore(app);
}
