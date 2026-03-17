/**
 * Sets CORS on Firebase Storage bucket using Firebase CLI credentials.
 * Run: node set-cors.js
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const BUCKET = "recipe-book-82d57.firebasestorage.app";
const CORS_CONFIG = [
  {
    origin: ["*"],
    method: ["GET"],
    maxAgeSeconds: 3600,
  },
];

// Firebase CLI OAuth client (public values from Firebase CLI source)
const CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

function readRefreshToken() {
  const configPath = path.join(
    process.env.USERPROFILE || process.env.HOME,
    ".config",
    "configstore",
    "firebase-tools.json",
  );
  if (!fs.existsSync(configPath)) {
    throw new Error("Firebase CLI config not found at " + configPath);
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const token =
    config.tokens?.refresh_token || config.user?.tokens?.refresh_token;
  if (!token) throw new Error("No refresh token found in Firebase CLI config");
  return token;
}

function exchangeToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString();

    const req = https.request(
      {
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error("Token exchange failed: " + data));
            return;
          }
          resolve(JSON.parse(data).access_token);
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function setCors(accessToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ cors: CORS_CONFIG });

    const req = https.request(
      {
        hostname: "storage.googleapis.com",
        path: `/storage/v1/b/${BUCKET}?fields=cors`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(
              new Error("CORS update failed (" + res.statusCode + "): " + data),
            );
            return;
          }
          resolve(JSON.parse(data));
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("Reading Firebase CLI credentials...");
  const refreshToken = readRefreshToken();

  console.log("Exchanging for access token...");
  const accessToken = await exchangeToken(refreshToken);

  console.log(`Setting CORS on bucket: ${BUCKET}...`);
  const result = await setCors(accessToken);

  console.log("CORS configured successfully:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
