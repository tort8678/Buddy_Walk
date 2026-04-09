import type { Request, Response } from "express";
import { FirebaseService } from "../services/firebase";

// controller object to be used in routes
export class FirebaseController {
  uploadImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No file uploaded. Use field name 'file'." });
      }

      const id = req.body.id;
      console.log("[firebase controller] req.body.id =", id);

      // calls the service. passes raw file data, original file name and file type. service will upload to firebase storage
      const uploaded = await FirebaseService.uploadImage({
        id,
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      return res.status(201).json(uploaded);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err?.message ?? "Upload failed" }); // 500 internal server error
    }
  };
}
