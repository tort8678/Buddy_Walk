import type { Request, Response } from "express"; // request: user sends, res: what is sent back
import { FirebaseService } from "../services/firebase";

// controller object to be used in routes
export class FirebaseController {
  // uploadImage runs when someone hits the route
  uploadImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        // if file doesn't exist, throw an error
        return res
          .status(400)
          .json({ error: "No file uploaded. Use field name 'file'." });
      }

      // calls the service. passes raw file data, original file name and file type. service will upload to firebase storage
      const result = await FirebaseService.uploadImage({
        buffer: req.file.buffer, // raw bytes sent to buffer
        originalName: req.file.originalname, // original filename sent to originalName
        mimeType: req.file.mimetype, // content type
      });

      // upload successful. send back result (201 = created)
      return res.status(201).json(result);
    } catch (err: any) {
      // if unsuccessful, send back error JSON
      console.error(err);
      return res.status(500).json({ error: err?.message ?? "Upload failed" }); // 500 internal server error
    }
  };
}

// import { Request, Response } from "express";
// import { FirebaseService } from "../services/firebase";

// export class FirebaseController {
//   async uploadImage(req: Request, res: Response) {
//     await FirebaseService.uploadImage();
//   }
// }
