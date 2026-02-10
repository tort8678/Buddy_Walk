import axios from "axios";

const baseRequest = axios.create({ baseURL: "/api" });
export type LocationInterface = { lat: number; lon: number };
export interface messageInterface {
  input: string;
  output: string;
  imageURL: string;
  location: LocationInterface;
  flag?: boolean;
  flag_reason?: string;
}

export interface chatLogInterface {
  messages: messageInterface[];
  user?: string;
}
export async function createChatLog(body: chatLogInterface) {
  try {
    const result = await baseRequest.post("/db/createChatLog", body);
    // console.log(result)
    if (result) return result.data;
  } catch (e) {
    console.log(e);
  }
}
export async function addChatToChatLog(body: {
  id: string;
  chat: messageInterface;
}) {
  try {
    const result = await baseRequest.post("/db/newChat", body);
    // console.log(result)
    if (result) return result.data;
  } catch (e) {
    console.log(e);
  }
}
export async function flagMessage(body: {
  flagReason?: string;
  messageId: string;
  chatlogId: string;
}) {
  try {
    const result = await baseRequest.post("/db/flagMessage", body);
    // console.log(result)
    if (result) return result.data;
  } catch (e) {
    console.log(e);
  }
}
