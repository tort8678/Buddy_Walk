import { ChatLogController } from "../controllers/chatLog";
import express from "express";
const route = express.Router();
const chatLogController = new ChatLogController();

route.post("/createChatLog", chatLogController.createChatLog);
route.post("/newChat", chatLogController.updateChatLog);
route.post("/flagMessage", chatLogController.flagMessage);
route.post("/updateMessageImageURL", chatLogController.updateMessageImageURL);
route.post(
  "/updateMessageImageURLFrames",
  chatLogController.updateMessageImageURLFrames,
);
export default route;
