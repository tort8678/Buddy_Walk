export function dataUrlToBlob(dataUrl: string) {
  //   const [header = "", base64 = ""] = dataUrl.split(",");
  const parts = dataUrl.split(",");

  const header = parts[0] || "";
  const base64 = parts[1] || "";
  const match = header.match(/data:(.*);base64/);
  const mime = match ? match[1] : "application/octet-stream";

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export type FirebaseUploadResult = {
  url: string;
  remotePath: string;
  id: string;
};

export async function uploadBase64ImageToFirebase(
  base64Image: string,
  messageId: string,
): Promise<FirebaseUploadResult> {
  const blob = dataUrlToBlob(base64Image);

  const extFromMime =
    blob.type === "image/png"
      ? "png"
      : blob.type === "image/webp"
        ? "webp"
        : "jpg";

  const form = new FormData();
  form.append("file", blob, `upload.${extFromMime}`);
  form.append("id", messageId);

  const res = await fetch("/api/firebase/uploadImage", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Firebase upload failed (${res.status})`);
  }

  const uploaded = (await res.json()) as FirebaseUploadResult;
  return uploaded;

  //   return (await res.json()) as FirebaseUploadResult;
}

// export function  dataUrlToBlob(dataUrl: string) {
//   const parts = dataUrl.split(",");
//   const header = parts[0] || ""; // split header and data
//   const base64 = parts[1] || "";
//   const match = header.match(/data:(.*);base64/); // get the MIME type e.g. jpeg
//   const mime = match ? match[1] : "application/octet-stream";

//   const binary = atob(base64); // turns base64 text into a binary string
//   const bytes = new Uint8Array(binary.length); // build a byte array
//   for (let i = 0; i < binary.length; i++) {
//     bytes[i] = binary.charCodeAt(i);
//   }
//   return new Blob([bytes], { type: mime }); // create a Blob that acts like an image file in memory
// }

// export type FirebaseUploadResult = {
//   url: string;
//   remotePath: string;
//   id: string;
// };

// // Uploads the current base64 image to your backend endpoint:
// // POST http://localhost:8000/api/firebase/uploadImage  (multer field name "file")
// export async function uploadBase64ImageToFirebase(
//   base64Image: string,
//   messageId: string,
// ) {
//   const blob = dataUrlToBlob(base64Image); // binary data for upload

//   // choose a filename extension
//   const extFromMime =
//     blob.type === "image/png"
//       ? "png"
//       : blob.type === "image/webp"
//         ? "webp"
//         : "jpg";

//   // file must match the upload.single("file") in my backend route
//   const form = new FormData();
//   form.append("file", blob, `upload.${extFromMime}`);

//   // send the id to the backend so we can name it upload/images/<id>.webp
//   form.append("id", messageId);

//   // send the file
//   const res = await fetch("api/firebase/uploadImage", {
//     method: "POST",
//     body: form,
//   });

//   // const res = await fetch("http://localhost:8000/api/firebase/uploadImage", {
//   //   method: "POST",
//   //   body: form,
//   // });

//   // error handling
//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(text || `Firebase upload failed (${res.status})`);
//   }

//   const url = (await res.json()) as FirebaseUploadResult;
//   return url;

// backend returns: path (where it lives in firebase storage), signedUrl (temporary access URL), contentType, bytes
// const json = await res.json();
// return json as {
//   path: string;
//   signedUrl: string;
//   contentType: string;
//   bytes: number;
// };
// }

// export function dataUrlToBlob(dataUrl: string) {
//   const parts = dataUrl.split(",");
//   const header = parts[0] || ""; // split header and data
//   const base64 = parts[1] || "";
//   const match = header.match(/data:(.*);base64/); // get the MIME type e.g. jpeg
//   const mime = match ? match[1] : "application/octet-stream";

//   const binary = atob(base64); // turns base64 text into a binary string
//   const bytes = new Uint8Array(binary.length); // build a byte array
//   for (let i = 0; i < binary.length; i++) {
//     bytes[i] = binary.charCodeAt(i);
//   }
//   return new Blob([bytes], { type: mime }); // create a Blob that acts like an image file in memory
// }

// // Uploads the current base64 image to your backend endpoint:
// // POST http://localhost:8000/api/firebase/uploadImage  (multer field name "file")
// export async function uploadBase64ImageToFirebase(base64Image: string) {
//   const blob = dataUrlToBlob(base64Image); // binary data for upload

//   // choose a filename extension
//   const extFromMime =
//     blob.type === "image/png"
//       ? "png"
//       : blob.type === "image/webp"
//         ? "webp"
//         : "jpg";

//   // file must match the upload.single("file") in my backend route
//   const form = new FormData();
//   form.append("file", blob, `upload.${extFromMime}`);

//   // send the file
//   const res = await fetch("api/firebase/uploadImage", {
//     method: "POST",
//     body: form,
//   });

//   // const res = await fetch("http://localhost:8000/api/firebase/uploadImage", {
//   //   method: "POST",
//   //   body: form,
//   // });

//   // error handling
//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(text || `Firebase upload failed (${res.status})`);
//   }

//   const url = (await res.json()) as string;
//   return url;

//   // backend returns: path (where it lives in firebase storage), signedUrl (temporary access URL), contentType, bytes
//   // const json = await res.json();
//   // return json as {
//   //   path: string;
//   //   signedUrl: string;
//   //   contentType: string;
//   //   bytes: number;
//   // };
// }
