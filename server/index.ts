import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import openAIRoute from "./routes/openAI";
import chatLogRoute from "./routes/chatLog";
import tokenRoute from "./routes/token";
import firebaseRoute from "./routes/firebase";
import mongoose from "mongoose";
import { databaseLink, config } from "./database";

dotenv.config();

(async function () {
  try {
    await mongoose.connect(config.link!, config.options);
    console.log("Connect to the MongoDB successfully!");
    console.log("DB LINK -> ", databaseLink);
  } catch (error) {
    console.log(new Error(`${error}`));
  }
  const app: Application = express();
  const port = process.env.PORT || 8000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  app.use(express.static(path.join(__dirname, "../dist")));

  app.use("/api", openAIRoute);
  app.use("/api/db", chatLogRoute);
  app.use("/api/token", tokenRoute);
  app.use("/api/firebase", firebaseRoute);

  app.listen(port, () => {
    console.log(`Server is live at http://localhost:${port}`);
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
})();
