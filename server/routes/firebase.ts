// defines URL, attaches middleware (multer), delegates to controller
import express from "express"; // router
import multer from "multer";
import { FirebaseController } from "../controllers/firebase"; // contains uploadImage, handles request/response and calls the service

const route = express.Router();
const firebaseController = new FirebaseController();

// memory storage to upload the buffer directly to firebase storage
const upload = multer({
  storage: multer.memoryStorage(), // don't save the file to disk, file goes into ram
  limits: { fileSize: 5 * 1024 * 1024 }, // 5mb limit. change as needed
});

// calls uploadImage from the controller
route.post(
  "/uploadImage", // POST request to uploadImage, do the following
  upload.single("file"), // uploads ONE file at a time. use curl
  firebaseController.uploadImage, // controller method
);

export default route;

// import { FirebaseController } from "../controllers/firebase";
// import express from "express";
// const route = express.Router();

// const firebaseController = new FirebaseController();
// route.post("/uploadImage", firebaseController.uploadImage);
// export default route;
