// // useMediaCapture is used for "capture" tasks including:
// // taking/uploading images, starting/stopping recordings, hold to record function
import { Camera, CameraType } from "react-camera-pro";
import { useRef, useState, useEffect } from "react";

type UseMediaCaptureReturn = {
  camera: React.RefObject<CameraType | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  image: string | null;
  setImage: React.Dispatch<React.SetStateAction<string | null>>;
  videoBlob: Blob | null;
  setVideoBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  videoStreamRef: React.MutableRefObject<MediaStream | null>;
  timeoutRef: React.MutableRefObject<number | undefined>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadInputRef: React.RefObject<HTMLInputElement | null>; // fix accessible button upload button issue
  handleRetake: () => void;
  handleCapture: (target: EventTarget & HTMLInputElement) => void;
  stopVideoStream: () => void;
  startVideoRecording: () => void;
  stopVideoRecording: () => void;
  handleVideoRecording: () => Promise<void>;
};

export function useMediaCapture({
  setUserInput,
  speak,
}: {
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  speak: (text: string) => void;
}): UseMediaCaptureReturn {
  const camera = useRef<CameraType>(null);
  //   const isMobile = useMediaQuery("(max-width:600px)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null); // fix accessible button upload button issue

  // Stops the video stream
  const stopVideoStream = () => {
    // videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  // start recording
  function startVideoRecording() {
    setUserInput("Describe the video");
    try {
      if (videoStreamRef.current) {
        speechSynthesis.cancel(); // Stop TTS when loading ends
        speak("Capturing video");
        // Request rear camera access

        // console.log(videoStreamRef.current)
        const mimeType = MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            ? "video/webm;codecs=vp8"
            : "";
        const mediaRecorder = new MediaRecorder(videoStreamRef.current, {
          mimeType,
        });
        // "video/webm;mp4"
        // mp4 is needed for browser compatibility on mobile
        mediaRecorderRef.current = mediaRecorder;

        const chunks: Blob[] = [];

        // Push recorded video data
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        // Handle stop recording
        mediaRecorder.onstop = () => {
          let videoBlob = new Blob(chunks, { type: "video/mp4" });
          if (videoBlob && videoBlob.size > 0) speak("Video captured.");
          else speak("Video not captured. Please hold button for longer.");

          setVideoBlob(videoBlob);
          // console.log(navigator.vibrate(200))
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Auto-stop after 5 seconds
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            stopVideoStream();
          }
        }, 5000); // 5 seconds
      }
    } catch (error) {
      speak("Could not capture the video.");
      console.error("Error accessing the camera:", error);
    }
  }

  function stopVideoRecording() {
    try {
      speechSynthesis.cancel(); // Stop TTS when loading ends
      mediaRecorderRef.current?.stop();
      stopVideoStream();
      setIsRecording(false);
    } catch (error) {
      speak("Could not stop the video.");
      console.error("Error accessing the camera:", error);
    }
  }
  const handleVideoRecording = async () => {
    if (!isRecording) {
      setUserInput("Describe the video");
      try {
        speak("Capturing video");
        // Request rear camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Force rear camera
        });
        videoStreamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/mp4",
        });
        // "video/webm;mp4"
        // mp4 is needed for browser compatibility on mobile
        mediaRecorderRef.current = mediaRecorder;

        const chunks: Blob[] = [];

        // Push recorded video data
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        // Handle stop recording
        mediaRecorder.onstop = async () => {
          let videoBlob = new Blob(chunks, { type: "video/mp4" });
          // console.log("Blob type before:", videoBlob.type);

          // If on iOS Safari, convert WebM to MP4
          // if (isIOS()) {
          //   videoBlob = await convertWebMToMP4(videoBlob);
          // }

          setVideoBlob(videoBlob);
          // console.log("Blob type after:", videoBlob.type);
          // console.log("Video recorded:", URL.createObjectURL(videoBlob));
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Auto-stop after 5 seconds
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            stopVideoStream();
            speak("Video captured.");
          }
        }, 30000); // 30 seconds
      } catch (error) {
        speak("Could not capture the video.");
        console.error("Error accessing the camera:", error);
      }
    } else {
      // Stop manually if button is clicked again
      mediaRecorderRef.current?.stop();
      stopVideoStream();
      speak("Video captured.");
    }
  };

  const handleRetake = () => {
    setVideoBlob(null);
    setImage(null);
    // URL.revokeObjectURL(audioUrl);
    // setAudioUrl("");
    // setOpenAIResponse("");
  };

  const handleCapture = (target: EventTarget & HTMLInputElement) => {
    if (target.files) {
      if (target.files.length !== 0) {
        const file = target.files[0];

        if (file.type.startsWith("video")) {
          setUserInput("Describe the video"); // Update prompt for video upload
          //Blob URL for uploaded video
          const videoBlob = new Blob([file], { type: file.type });
          const videoUrl = URL.createObjectURL(videoBlob);
          //console.log("Video URL:", videoUrl);
          setVideoBlob(videoBlob); // uploaded video is stored in BLOB same as recorded video
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result as string;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const maxWidth = 640; // Max width for the image
              const scaleSize = maxWidth / img.width;
              canvas.width = maxWidth;
              canvas.height = img.height * scaleSize;

              const ctx = canvas.getContext("2d");
              ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

              // Convert the resized image to Base64
              const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // 0.7 = 70% quality
              console.log(compressedBase64); // Use the compressed base64 string
              setImage(compressedBase64);
            };
          };

          if (file) {
            reader.readAsDataURL(file);
          }
          // const newUrl = URL.createObjectURL(file);
          // console.log(newUrl);
        }
      }
    }
  };

  return {
    camera,
    videoRef,
    image,
    setImage,
    videoBlob,
    setVideoBlob,
    isRecording,
    setIsRecording,
    mediaRecorderRef,
    videoStreamRef,
    timeoutRef,
    fileInputRef,
    uploadInputRef,
    handleRetake,
    handleCapture,
    stopVideoStream,
    startVideoRecording,
    stopVideoRecording,
    handleVideoRecording,
  };
}
