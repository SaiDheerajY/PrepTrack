import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

// 1. Check if the environment variable exists (Best for Render/Cloud)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("📍 Initializing Firebase via Environment Variable");
  } catch (err) {
    console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT env var as JSON");
  }
}

// 2. Fallback to local file (Best for local development)
if (!serviceAccount) {
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    console.log("📍 Initializing Firebase via serviceAccountKey.json");
  }
}

if (!serviceAccount) {
  throw new Error(
    "❌ Firebase credentials NOT FOUND. Set FIREBASE_SERVICE_ACCOUNT env var or add backend/serviceAccountKey.json"
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase Admin initialized");

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
