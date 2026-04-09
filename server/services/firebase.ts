import admin from "firebase-admin";
import path from "path";
import sharp from "sharp";
import mongoose from "mongoose";

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

const serviceAccountPath = path.resolve(
  __dirname,
  "..",
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "secrets/firebase-service-account.json",
);

if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName,
  });
}

const bucket = admin.storage().bucket(bucketName);

export class FirebaseService {
  static async uploadImage(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    id: string;
  }): Promise<{ url: string; remotePath: string; id: string }> {
    const { buffer, mimeType, id } = params;

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(mimeType))
      throw new Error(`Unsupported file type: ${mimeType}`);

    const compressed = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // const imageId = id ?? new mongoose.Types.ObjectId().toString();
    const imageId = id;
    console.log("[firebase service] imageId =", imageId);
    const remotePath = `uploads/images/${imageId}.webp`;

    const file = bucket.file(remotePath);
    await file.save(compressed, {
      contentType: "image/webp",
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${remotePath}`;
    return { url: publicUrl, remotePath, id: imageId };
  }
}

// // upload image to firebase first, then create the chatlog
// // create certificates https

// // initializes firebase admin, validates then compresses
// // uploads images to firebase storage, generated signed URLs
// // returns metadata to the controller
// import admin from "firebase-admin"; // lets backend authenticate with the service account
// import path from "path";
// import sharp from "sharp"; // resize/compress/convert images before uploading
// import mongoose from "mongoose"; // to generate urls that align with the object id

// const bucketName = process.env.FIREBASE_STORAGE_BUCKET; // .env

// // load service account JSON
// const serviceAccountPath = path.resolve(
//   __dirname,
//   "..", // from services/ to server/
//   process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
//     "secrets/firebase-service-account.json",
// );

// // initialize firebase admin once
// if (!admin.apps.length) {
//   const serviceAccount = require(serviceAccountPath);

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     storageBucket: bucketName,
//   });
// }

// // do this once, creates a connection to the cloud folder
// const bucket = admin.storage().bucket(bucketName);

// // uploads an image buffer to firebase storage.
// // returns the storage path + signed URL
// export class FirebaseService {
//   static async uploadImage(params: {
//     // only pass bytes, file name, mime type
//     buffer: Buffer;
//     originalName: string;
//     mimeType: string;

//     id?: string;
//   }): Promise<{ url: string; remotePath: string; id: string }> {
//     const { buffer, originalName, mimeType, id } = params;

//     // only allow certain types
//     const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
//     if (!allowed.has(mimeType)) {
//       throw new Error(`Unsupported file type: ${mimeType}`);
//     }

//     // compress/convert to webp to reduce size/cost
//     const compressed = await sharp(buffer)
//       .rotate() // fixes iphone orientation issues
//       .resize({ width: 1600, withoutEnlargement: true })
//       .webp({ quality: 80 })
//       .toBuffer(); // return processed bytes

//     // defines where the file is stored in the bucket. uses date.now()
//     // avoids file name collisions
//     // const remotePath = `uploads/images/${Date.now()}-${sanitizeFilename(originalName)}.webp`;
//     // defines where the file is stored in the bucket. uses the object id name
//     // avoids file name collisions
//     const imageId = id ?? new mongoose.Types.ObjectId().toString();
//     const remotePath = `uploads/images/${imageId}.webp`;

//     // upload to firebase storage
//     const file = bucket.file(remotePath);
//     await file.save(compressed, {
//       contentType: "image/webp",
//       resumable: false,
//       metadata: { cacheControl: "public, max-age=31536000" },
//     });

//     // generate publicly readable url
//     await file.makePublic();

//     // public url stored in MongoDB
//     const publicUrl = `https://storage.googleapis.com/${bucketName}/${remotePath}`;

//     // return data to the controller
//     // curl receives: path (where the file is), signed url, file type and size
//     return { url: publicUrl, remotePath, id: imageId };
//   }

//   // cleanup when records are deleted
//   static async deleteByPath(filePath: string): Promise<void> {
//     await bucket.file(filePath).delete({ ignoreNotFound: true });
//   }
// }

// // prevents non standard characters
// function sanitizeFilename(name: string) {
//   return name.replace(/[^a-zA-Z0-9._-]/g, "_");
// }

// export class FirebaseService {
//   static async uploadImage(params: {
//     // only pass bytes, file name, mime type
//     buffer: Buffer;
//     originalName: string;
//     mimeType: string;
//   }): Promise<string> {
//     const { buffer, originalName, mimeType } = params;

//     // only allow certain types
//     const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
//     if (!allowed.has(mimeType)) {
//       throw new Error(`Unsupported file type: ${mimeType}`);
//     }

//     // compress/convert to webp to reduce size/cost
//     const compressed = await sharp(buffer)
//       .rotate() // fixes iphone orientation issues
//       .resize({ width: 1600, withoutEnlargement: true })
//       .webp({ quality: 80 })
//       .toBuffer(); // return processed bytes

//     // defines where the file is stored in the bucket. uses date.now()
//     // avoids file name collisions
//     // const remotePath = `uploads/images/${Date.now()}-${sanitizeFilename(originalName)}.webp`;
//     // defines where the file is stored in the bucket. uses the object id name
//     // avoids file name collisions
//     const imageId = new mongoose.Types.ObjectId().toString();
//     const remotePath = `uploads/images/${imageId}.webp`;

//     // upload to firebase storage
//     const file = bucket.file(remotePath);
//     await file.save(compressed, {
//       contentType: "image/webp",
//       resumable: false,
//       metadata: { cacheControl: "public, max-age=31536000" },
//     });

//     // generate publicly readable url
//     await file.makePublic();

//     // public url stored in MongoDB
//     const publicUrl = `https://storage.googleapis.com/${bucketName}/${remotePath}`;

//     // return data to the controller
//     // curl receives: path (where the file is), signed url, file type and size
//     return publicUrl;
//   }

//   // cleanup when records are deleted
//   static async deleteByPath(filePath: string): Promise<void> {
//     await bucket.file(filePath).delete({ ignoreNotFound: true });
//   }
// }
