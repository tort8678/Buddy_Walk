import { ChatLogService } from "../services/chatLog";
import { Request, Response } from "express";
import { messageInterface, chatLogInterface } from "../database/models/chatLog";

const chatLogService = new ChatLogService();

export class ChatLogController {
  async createChatLog(req: Request, res: Response): Promise<void> {
    const body: chatLogInterface = req.body;
    await chatLogService.newChatLog({ req, res }, body);
  }

  async updateChatLog(req: Request, res: Response): Promise<void> {
    const body: { chat: messageInterface; id: string } = req.body;
    await chatLogService.addChat({ req, res }, body);
  }
  async flagMessage(req: Request, res: Response): Promise<void> {
    const body: { messageId: string; flagReason: string; chatlogId: string } =
      req.body;
    await chatLogService.flagMessage({ req, res }, body);
  }

  // for images
  async updateMessageImageURL(req: Request, res: Response): Promise<void> {
    const body: { chatlogId: string; messageId: string; imageURL: string } =
      req.body;
    await chatLogService.updateMessageImageURL({ req, res }, body);
  }

  // for ios video
  async updateMessageImageURLFrames(
    req: Request,
    res: Response,
  ): Promise<void> {
    const body: {
      chatlogId: string;
      messageId: string;
      imageURLFrames: string[];
    } = req.body;

    await chatLogService.updateMessageImageURLFrames({ req, res }, body);
  }
}
