// upload an image to firebase storage
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const fs = require("fs");
const admin = require("firebase-admin");

const serviceAccountPath = path.resolve(
  __dirname,
  "..",
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH, // see .env
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, //  see .env
  });
}

async function uploadImage() {
  const localImagePath = path.resolve(__dirname, "assets/landscape.jpg");

  if (!fs.existsSync(localImagePath)) {
    throw new Error(`Local image not found: ${localImagePath}`);
  }

  const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

  // Store it somewhere sensible in the bucket
  const ext = path.extname(localImagePath) || ".jpg";
  const remotePath = `test/images/${Date.now()}${ext}`;

  const buffer = fs.readFileSync(localImagePath);

  const file = bucket.file(remotePath);
  await file.save(buffer, {
    contentType: "image/jpeg", // update if png etc.
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  console.log("Image upload successful!");
  console.log("Remote path:", remotePath);

  // generate a signed URL to open in browser (1 hour limit)
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  console.log("Signed URL (1 hour):", signedUrl);
}

uploadImage().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});

// Working version uploads a .txt file to firebase storage
// require("dotenv").config({
//   path: require("path").resolve(__dirname, "../../.env"),
// });

// const admin = require("firebase-admin");
// const path = require("path");

// // Debug: confirm envs are loaded
// console.log("FIREBASE_STORAGE_BUCKET =", process.env.FIREBASE_STORAGE_BUCKET);
// console.log(
//   "FIREBASE_SERVICE_ACCOUNT_PATH =",
//   process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
// );

// const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
//   ? path.resolve(__dirname, "..", process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
//   : path.resolve(__dirname, "../secrets/firebase-service-account.json");

// console.log("Using service account file:", serviceAccountPath);

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(require(serviceAccountPath)),
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   });
// }

// async function testUpload() {
//   console.log("Using bucket:", process.env.FIREBASE_STORAGE_BUCKET);
//   console.log("Using service account file:", serviceAccountPath);

//   const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
//   const file = bucket.file("test/firebase-test.txt");

//   await file.save("Firebase is working!", { contentType: "text/plain" });

//   console.log("Upload successful:", file.name);
// }

// testUpload().catch((err) => {
//   console.error("Upload failed:", err);
//   process.exit(1);
// });
