const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function loadServiceAccount() {
  const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonFromEnv) {
    return JSON.parse(jsonFromEnv);
  }

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.resolve(__dirname, "serviceAccount.json");

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
  }

  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
}

const app = initializeApp({
  credential: cert(loadServiceAccount()),
});

const auth = getAuth(app);

module.exports = { app, auth };
