// creates/updates chat logs in MongoDB
// uploads images and video frames to Firebase
// calculates images and frames correctly (image urls)
// sends image URLs and arrays to MongoDB
import React, { useEffect, useState } from "react";
import {
  createChatLog,
  addChatToChatLog,
  updateMessageImageURL,
  updateMessageImageURLFrames,
} from "../../../api/chatLog.ts";
import { uploadBase64ImageToFirebase } from "../../../api/firebaseUploadImg";

type CoordsLike = {
  latitude?: number;
  longitude?: number;
} | null;

type UseChatLogParams = {
  openAIResponse: string;
  userInput: string;
  image: string | null;
  coords: CoordsLike;
  setImage: React.Dispatch<React.SetStateAction<string | null>>;
  setVideoBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  frameImages: string[];
  setFrameImages: React.Dispatch<React.SetStateAction<string[]>>;
};

// generate unique IDs by affixing numbers/counters to the url
function buildImageId(chatId: string, index: number) {
  return `${chatId}_${String(index).padStart(4, "0")}`;
}

export function useChatLog({
  openAIResponse,
  userInput,
  image,
  coords,
  setImage,
  setVideoBlob,
  setUserInput,
  frameImages,
  setFrameImages,
}: UseChatLogParams) {
  const [currentChatId, setCurrentChatId] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState("");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    if (openAIResponse === "") return;

    (async function persistChatLog() {
      // store the current image before clearing state
      const capturedImage = image;

      setImage(null);
      setVideoBlob(null);

      try {
        // keep one messageId variable in scope for the whole effect
        let messageId = "";

        if (currentChatId === "") {
          let firebaseImagePath = capturedImage as string;

          // 1) create the Mongo message first with empty imageURL
          const res3 = localStorage.getItem("name")
            ? await createChatLog({
                user: localStorage.getItem("name") as string,
                messages: [
                  {
                    input: userInput,
                    output: openAIResponse + lastError,
                    imageURL: "",
                    location: {
                      lat: coords?.latitude as number,
                      lon: coords?.longitude as number,
                    },
                  },
                ],
              })
            : await createChatLog({
                messages: [
                  {
                    input: userInput,
                    output: openAIResponse + lastError,
                    imageURL: "",
                    location: {
                      lat: coords?.latitude as number,
                      lon: coords?.longitude as number,
                    },
                  },
                ],
              });

          const chatlogId = res3.data._id;
          const messageId =
            res3.data.messages[res3.data.messages.length - 1]._id;
          // ios video frame uploads. if frames exist, upload each frame to Firebase
          // store all frame URLs in MongoDB
          if (frameImages.length > 0) {
            const uploadedFrames = await Promise.all(
              frameImages.map((frame, i) =>
                uploadBase64ImageToFirebase(frame, buildImageId(chatlogId, i)),
              ),
            );

            const frameImageURLs = uploadedFrames.map((f) => f.url);
            console.log("frameImageURLs:", frameImageURLs);

            await updateMessageImageURLFrames({
              chatlogId,
              messageId,
              imageURLFrames: frameImageURLs,
            });
          }
          setCurrentChatId(chatlogId);
          setCurrentMessageId(messageId);

          if (res3) {
            const chatlogId = res3.data._id;

            // const imageId = buildImageId(chatlogId, 0);
            const imageId = buildImageId(
              chatlogId,
              frameImages.length > 0 ? frameImages.length : 0,
            );
            const messageId =
              res3.data.messages[res3.data.messages.length - 1]._id;

            setCurrentChatId(chatlogId);
            setCurrentMessageId(messageId);

            // 2) now upload using the Mongo-generated messageId
            try {
              if (
                capturedImage &&
                typeof capturedImage === "string" &&
                capturedImage.startsWith("data:image")
              ) {
                const uploaded = await uploadBase64ImageToFirebase(
                  capturedImage,
                  // messageId, nested ID
                  // chatlogId, // top level ID
                  imageId, // top level ID with framesg
                );
                firebaseImagePath = uploaded.url;
              } else {
                firebaseImagePath = capturedImage as string;
              }
            } catch (err) {
              console.error(
                "Firebase upload failed, falling back to base64:",
                err,
              );
              firebaseImagePath = capturedImage as string;
            }

            // following uses backend method updateMessageImageURL
            if (firebaseImagePath) {
              const updateRes = await updateMessageImageURL({
                // chatlogId: currentChatId,
                chatlogId,
                messageId,
                imageURL: firebaseImagePath,
              });

              //   await updateMessageImageURL({
              //     chatlogId,
              //     messageId,
              //     imageURL: firebaseImagePath,
              //   });
            }
          }
        } else {
          let firebaseImagePath = capturedImage as string;

          // 1) add the Mongo message first with empty imageURL
          const res3 = await addChatToChatLog({
            id: currentChatId,
            chat: {
              input: userInput,
              output: openAIResponse + lastError,
              imageURL: "",
              location: {
                lat: coords?.latitude as number,
                lon: coords?.longitude as number,
              },
            },
          });

          setLastError("");

          if (res3) {
            messageId = res3.data.messages[res3.data.messages.length - 1]._id;
            // const imageIndex = res3.data.messages.length - 1;
            // increment image uploads only, not questions by checking if messages have an imageURL string i.e. it skips "" or undefined
            const messages = res3?.data?.messages ?? [];

            // const imageIndex = messages.filter(
            //   (msg: { imageURL?: string }) =>
            //     typeof msg.imageURL === "string" && msg.imageURL.trim() !== "",
            // ).length; // counts valid images in a message

            // const imageId = buildImageId(currentChatId, imageIndex);

            // nextAssetIndex increments both videos and images properly i.e. by n frames or 1 for images
            const nextAssetIndex = messages.reduce(
              (
                count: number,
                msg: { imageURL?: string; imageURLFrames?: string[] },
              ) => {
                if (
                  Array.isArray(msg.imageURLFrames) &&
                  msg.imageURLFrames.length > 0
                ) {
                  return count + msg.imageURLFrames.length;
                }

                if (
                  typeof msg.imageURL === "string" &&
                  msg.imageURL.trim() !== ""
                ) {
                  return count + 1;
                }

                return count;
              },
              0,
            );

            const imageId = buildImageId(currentChatId, nextAssetIndex);
            setCurrentMessageId(messageId);

            // ios video frame uploads. if frames exist, upload each frame to Firebase
            // store all frame URLs in MongoDB
            if (frameImages.length > 0) {
              const uploadedFrames = await Promise.all(
                frameImages.map((frame, i) =>
                  uploadBase64ImageToFirebase(
                    frame,
                    // buildImageId(currentChatId, imageIndex + i),
                    buildImageId(currentChatId, nextAssetIndex + i),
                  ),
                ),
              );

              const frameImageURLs = uploadedFrames.map((f) => f.url);
              console.log("frameImageURLs:", frameImageURLs);

              await updateMessageImageURLFrames({
                chatlogId: currentChatId,
                messageId,
                imageURLFrames: frameImageURLs,
              });
            }

            // 2) now upload using the mongo generated messageId
            try {
              if (
                capturedImage &&
                typeof capturedImage === "string" &&
                capturedImage.startsWith("data:image")
              ) {
                console.log("[frontend] Uploading with id:", messageId);

                const uploaded = await uploadBase64ImageToFirebase(
                  capturedImage,
                  imageId, // top level ID with frames
                  // currentChatId, // top level ID
                  // messageId, nested ID
                );
                console.log("uploaded:", uploaded);
                firebaseImagePath = uploaded.url;
              } else {
                firebaseImagePath = capturedImage as string;
              }
            } catch (err) {
              console.error(
                "Firebase upload failed, falling back to base64:",
                err,
              );
              firebaseImagePath = capturedImage as string;
            }

            // update the saved message with the uploaded image URL
            if (firebaseImagePath) {
              await updateMessageImageURL({
                chatlogId: currentChatId,
                messageId,
                imageURL: firebaseImagePath,
              });
            }
          }

          setUserInput("");
        }
        setFrameImages([]);
      } catch (error) {
        console.error("Error creating chat log:", error);
        setFrameImages([]);
      }
    })();
  }, [openAIResponse]);

  return {
    currentChatId,
    currentMessageId,
    lastError,
    setLastError,
  };
}
