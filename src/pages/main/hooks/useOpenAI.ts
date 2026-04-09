//  send the user’s prompt/media to the backend and receives a response
//  extracts frames from videos, stores frames in state, sends to backend/OpenAI

import { useState } from "react";
import { sendTextRequest } from "../../../api/openAi";
import type { RequestData, CustomCoords } from "../types.ts";

type OrientationLike = {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
} | null;

type CoordsLike = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  speed: number | null;
} | null;

// type CustomCoords = {
//   latitude: number;
//   longitude: number;
//   accuracy: number | null;
//   altitude: number | null;
//   altitudeAccuracy: number | null;
//   heading: number;
//   speed: number | null;
//   orientation: {
//     alpha: number | null;
//     beta: number | null;
//     gamma: number | null;
//   } | null;
// } | null;

// type RequestData = {
//   text: string;
//   image: (string | null)[];
//   coords: CustomCoords;
// };

type UseOpenAIParams = {
  userInput: string;
  image: string | null;
  videoBlob: Blob | null;
  coords: CoordsLike;
  orientation: OrientationLike;
  headingRef: React.MutableRefObject<number>;
  setOpenAIResponse: React.Dispatch<React.SetStateAction<string>>;
  setLastError: React.Dispatch<React.SetStateAction<string>>;
  speak: (text: string) => void;
  setFrameImages: React.Dispatch<React.SetStateAction<string[]>>;
};

export function useOpenAI({
  userInput,
  image,
  videoBlob,
  coords,
  orientation,
  headingRef,
  setOpenAIResponse,
  setLastError,
  speak,
  setFrameImages,
}: UseOpenAIParams) {
  const [loading, setLoading] = useState(false);

  const extractFrames = async (videoBlob: Blob): Promise<string[]> => {
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoElement = document.createElement("video");
    videoElement.src = videoUrl;
    videoElement.setAttribute("playsinline", ""); // iOS inline hint :contentReference[oaicite:1]{index=1}
    videoElement.setAttribute("webkit-playsinline", "true"); // older WebKit
    await videoElement.play();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }
    const frameInterval = 1; // Capture one frame per second
    const frames: string[] = [];

    // returns an array of image frames
    return new Promise<string[]>((resolve) => {
      videoElement.addEventListener("timeupdate", () => {
        // only extract frames if we aren't at the end of the video
        if (videoElement.currentTime < videoElement.duration) {
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height); // draw video frame onto a canvas
          frames.push(canvas.toDataURL("image/jpeg")); // convert frame to image
          videoElement.currentTime += frameInterval; // move forward
        } else {
          resolve(frames); // return frames
        }
      });
    });
  };

  async function sendRequestOpenAI() {
    try {
      setLoading(true); //  loading starts
      speechSynthesis.cancel(); // Stop TTS when loading starts
      speak("loading response"); // Play TTS message
      // responseRef.current?.scrollIntoView({ behavior: 'smooth' }); // page scrolls down when loading starts

      let frames: string[] = [];

      // If videoBlob exists, extract all frames
      if (videoBlob) {
        frames = await extractFrames(videoBlob);
        setFrameImages(frames);
        console.log("frames length:", frames.length);
        //console.log('Extracted frames:', frames);

        // let frameImageURLs: string[] = [];
      } else {
        setFrameImages([]);
      }

      // Create the CustomCoords object
      const customCoords: CustomCoords | null = coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? 0,
            altitude: coords.altitude ?? 0,
            altitudeAccuracy: coords.altitudeAccuracy ?? 0,
            heading: headingRef.current,
            speed: coords.speed ?? 0,
            orientation: orientation
              ? {
                  alpha: orientation.alpha ?? 0,
                  beta: orientation.beta ?? 0,
                  gamma: orientation.gamma ?? 0,
                  //   alpha: orientation.alpha !== null ? orientation.alpha : null,
                  //   beta: orientation.beta !== null ? orientation.beta : null,
                  //   gamma: orientation.gamma !== null ? orientation.gamma : null,
                }
              : null,
          }
        : null;

      //prepare the request data, including all extracted frames (if available)
      const data: RequestData = {
        text: userInput,
        image: frames.length > 0 ? frames : [image], //sends all frames, or fallback to a single image
        // image: frames.length > 0 ? frames[0] : image, //only takes the first extracted frame or fallback to default image
        coords: customCoords, // Use the CustomCoords object here
      };

      //console.log('Sending request data to backend:', data);
      const res = await sendTextRequest(data);
      if (res) {
        //console.log('Received response from OpenAI:', res);
        setOpenAIResponse(res.output);
        // setUserInput(""); don't use this here
        //navigator.vibrate([100,100])
      }
      return [];
    } catch (e) {
      console.error("Error sending request to OpenAI:", e);
      setLastError(e as string);
      setOpenAIResponse(
        "An error occurred while processing your request. Please try again.",
      );
      return [];
    } finally {
      setLoading(false);
      speechSynthesis.cancel(); // Stop TTS when loading ends
    }
  }

  return {
    loading,
    sendRequestOpenAI,
  };
}
