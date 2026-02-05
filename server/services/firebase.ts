// initializes firebase admin, validates then compresses
// uploads images to firebase storage, generated signed URLs
// returns metadata to the controller
import admin from "firebase-admin"; // lets backend authenticate with the service account
import path from "path";
import sharp from "sharp"; // resize/compress/convert images before uploading

const bucketName = process.env.FIREBASE_STORAGE_BUCKET; // .env

// load service account JSON
const serviceAccountPath = path.resolve(
  __dirname,
  "..", // from services/ to server/
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "secrets/firebase-service-account.json",
);

// initialize firebase admin once
if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName,
  });
}

// do this once, creates a connection to the cloud folder
const bucket = admin.storage().bucket(bucketName);

// uploads an image buffer to firebase storage.
// returns the storage path + signed URL
export class FirebaseService {
  static async uploadImage(params: {
    // only pass bytes, file name, mime type
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<{
    path: string;
    signedUrl: string;
    contentType: string;
    bytes: number;
  }> {
    const { buffer, originalName, mimeType } = params;

    // only allow certain types
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // compress/convert to webp to reduce size/cost
    const compressed = await sharp(buffer)
      .rotate() // fixes iphone orientation issues
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(); // return processed bytes

    // defines where the file is stored in the bucket
    // avoids file name collisions
    const remotePath = `uploads/images/${Date.now()}-${sanitizeFilename(originalName)}.webp`;

    // upload to firebase storage
    const file = bucket.file(remotePath);
    await file.save(compressed, {
      contentType: "image/webp",
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    // generated signed URL for viewing (expires in 1 hour)
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // return data to the controller
    // curl receives: path (where the file is), signed url, file type and size
    return {
      path: remotePath,
      signedUrl,
      contentType: "image/webp",
      bytes: compressed.length,
    };
  }

  // cleanup when records are deleted
  static async deleteByPath(filePath: string): Promise<void> {
    await bucket.file(filePath).delete({ ignoreNotFound: true });
  }
}

// prevents non standard characters
function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// export class FirebaseService {
//   static async uploadImage() {}
// }
