// handles the capture button logic
import React from "react";

type UsePressToCaptureParams = {
  timeoutRef: React.MutableRefObject<number | undefined>;
  startVideoRecording: () => void;
  stopVideoRecording: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  image: string | null;
  speak: (text: string) => void;
};

export function usePressToCapture({
  timeoutRef,
  startVideoRecording,
  stopVideoRecording,
  fileInputRef,
  setUserInput,
  image,
  speak,
}: UsePressToCaptureParams) {
  const HOLD_DELAY = 600;

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    timeoutRef.current = window.setTimeout(() => {
      startVideoRecording();
      timeoutRef.current = undefined;
    }, HOLD_DELAY);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      // console.log(camera.current)
      try {
        // const capturedImage = camera.current?.takePhoto() as string;
        // if (capturedImage.length > 0) {
        //     // console.log("image captured ", capturedImage)
        //     setImage(capturedImage);
        //     speechSynthesis.cancel();
        //     speak("Image captured.")
        //     setUserInput('Describe the image');
        //     // navigator.vibrate(200)
        // }
        fileInputRef.current?.click();
        setUserInput("Describe the image");
        if (image) speak("Image Captured");
      } catch (error) {
        console.error("Failed to capture image. ", error);
        fileInputRef.current?.click();
        setUserInput("Describe the image");
        if (image) speak("Image Captured");
      }
      //console.log(orientation);
    } else {
      // otherwise we started recording → stop now
      stopVideoRecording();
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return {
    handlePointerDown,
    handlePointerUp,
  };
}
