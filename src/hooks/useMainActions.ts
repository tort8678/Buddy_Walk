import { CameraType } from "react-camera-pro";
import React, { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { useGeolocated } from "react-geolocated";
import { sendTextRequest } from "../api/openAi.ts";
import { RequestData, CustomCoords } from "../pages/main/types.ts";
import { createChatLog, addChatToChatLog } from "../api/chatLog.ts";
import { useDeviceOrientation } from "./useDeviceOrientation.ts";
import { createSpeechRecognitionPonyfill } from "web-speech-cognitive-services";
import { getToken } from "../api/token.ts";
import { playSound } from "react-sounds";

type SpeechRecognitionResultEvent = {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type MainSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart?: (() => void) | null;
  onend?: (() => void) | null;
  onerror?: ((event: { error: string }) => void) | null;
  onresult?: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

const EXAMPLE_OPENAI_RESPONSE =
  "Example response: The path ahead looks mostly clear. There may be a curb or raised edge nearby, so move forward slowly and keep your cane or handrail guidance ready.";

export function useMainActions() {
  const camera = useRef<CameraType>(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [openAIResponse, setOpenAIResponse] = useState<string>("");
  const [loading, setLoading] = useState(false); //for the loading bar
  const responseRef = useRef<HTMLDivElement>(null); //to make the page scroll down when submit is clicked
  const [userInput, setUserInput] = useState<string>(""); //-----------------------------
  const [audioUrl, setAudioUrl] = useState("");
  const [currentChatId, setCurrentChatId] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState("");
  const { coords } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    userDecisionTimeout: 5000,
    watchLocationPermissionChange: true,
  });
  const [currentOrientation, setCurrentOrientation] = useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  }>({ alpha: null, beta: null, gamma: null });
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<MainSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false); // Track if voice button is active
  const { orientation, requestAccess } = useDeviceOrientation();
  const timeoutRef = useRef<number>();
  const HOLD_DELAY = 600;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastError, setLastError] = useState<string>("");
  // const [showImage, setShowImage] = useState<boolean>(false)
  const headingRef = useRef<number>(0);

  useEffect(() => {
    (async function () {
      const azureToken = await getToken();
      if (azureToken && azureToken.token && azureToken.region) {
        const { SpeechRecognition } = createSpeechRecognitionPonyfill({
          credentials: {
            region: azureToken.region,
            authorizationToken: azureToken.token,
          },
        });
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };
        recognition.onend = () => {
          setIsListening(false);
        };
        recognition.onerror = (event) =>
          console.error("Speech recognition error:", event.error);
        recognition.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex]![0]!.transcript;
          setUserInput(transcript);
        };

        recognitionRef.current = recognition as MainSpeechRecognition;
      }
    })();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort?.();
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      try {
        playSound("ui/item_select"); // Play sound when starting listening
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    } else if (!isListening && recognitionRef.current) {
      try {
        playSound("ui/item_deselect"); // Play sound when stopping listening
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  }, [isListening]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      () => {},
      (error) => {
        console.log(error.message);
      },
    );
    requestAccess().then(() => {
      if (orientation)
        setCurrentOrientation({
          alpha: orientation.alpha,
          beta: orientation.beta,
          gamma: orientation.gamma,
        });
    });

    if (orientation) {
      setCurrentOrientation({
        alpha: orientation.alpha,
        beta: orientation.beta,
        gamma: orientation.gamma,
      });
    } else {
      setCurrentOrientation({ alpha: null, beta: null, gamma: null });
    }
    try {
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((result) => {
        if (result.state === "prompt")
          navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
              videoStreamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.playsInline = true;
                videoRef.current.muted = true;
              }
            })
            .catch(console.error);
        });
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
    try {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((result) => {
        if (result.state === "prompt") {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .catch(console.error);
        }
        });
    } catch (error) {
      console.error("Error accessing the mic:", error);
    }

    return () => {
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    };
    // Preserve the original one-time permission bootstrap behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleDeviceOrientation(
      e: DeviceOrientationEvent & { webkitCompassHeading?: number },
    ) {
      if (typeof e.webkitCompassHeading === "number") {
        headingRef.current = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        headingRef.current = e.alpha;
      }
    }
    window.addEventListener(
      "deviceorientation",
      handleDeviceOrientation,
      false,
    );
    return () => {
      window.removeEventListener(
        "deviceorientation",
        handleDeviceOrientation,
        false,
      );
    };
  }, []);

  useEffect(() => {
    (async function () {
      if (openAIResponse !== "") {
        // console.log(openAIResponse)
        speak(openAIResponse);
        setImage(null);
        setVideoBlob(null);
        try {
          if (currentChatId === "") {
            // Use localStorage to get the name if it exists, otherwise do not include the name
            // upload the image to firebase
            // get the url back from firebase
            // save the url in imageURL rather than the base64 image to save space
            const res3 = localStorage.getItem("name")
              ? await createChatLog({
                  user: localStorage.getItem("name") as string,
                  messages: [
                    {
                      input: userInput,
                      output: openAIResponse + lastError,
                      imageURL: image as string,
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
                      imageURL: image as string,
                      location: {
                        lat: coords?.latitude as number,
                        lon: coords?.longitude as number,
                      },
                    },
                  ],
                });
            setLastError("");
            console.log("chatLog", res3);
            if (res3) {
              setCurrentChatId(res3.data._id);
              setCurrentMessageId(
                res3.data.messages[res3.data.messages.length - 1]._id,
              );
            }
          } else {
            const res3 = await addChatToChatLog({
              id: currentChatId,
              chat: {
                input: userInput,
                output: openAIResponse + lastError,
                imageURL: image as string,
                location: {
                  lat: coords?.latitude as number,
                  lon: coords?.longitude as number,
                },
              },
            });
            setLastError("");
            // console.log('chatLog', res3)
            if (res3) {
              setCurrentMessageId(
                res3.data.messages[res3.data.messages.length - 1]._id,
              );
            }
          }
        } catch (error) {
          console.error("Error creating chat log:", error);
        }
        setUserInput("");
        // console.log(currentMessageId)
      }
    })();
    // This effect is intentionally keyed to new assistant responses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAIResponse]);
  // ----------------------------------------------------------------------------------------------------------------------

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
          const videoBlob = new Blob(chunks, { type: "video/mp4" });
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
          const videoBlob = new Blob(chunks, { type: "video/mp4" });
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

  // Stops the video stream
  const stopVideoStream = () => {
    // videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  // -------------------------------------------------------------------------------------------------------------------

  const handleRetake = () => {
    setVideoBlob(null);
    setImage(null);
    URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setOpenAIResponse("");
  };
  // -------------------------------------------------------------------------------------------------------------------

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

    return new Promise<string[]>((resolve) => {
      videoElement.addEventListener("timeupdate", () => {
        if (videoElement.currentTime < videoElement.duration) {
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg"));
          videoElement.currentTime += frameInterval;
        } else {
          resolve(frames);
        }
      });
    });
  };
  // -------------------------------------------------------------------------------------------------------------------
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
        //console.log('Extracted frames:', frames);
      }

      // Create the CustomCoords object
      const customCoords: CustomCoords | null = coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: headingRef.current,
            speed: coords.speed,
            orientation: orientation
              ? {
                  alpha: orientation.alpha !== null ? orientation.alpha : null,
                  beta: orientation.beta !== null ? orientation.beta : null,
                  gamma: orientation.gamma !== null ? orientation.gamma : null,
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
      // image to backend for firebase
      if (res) {
        //console.log('Received response from OpenAI:', res);
        setOpenAIResponse(res.output);
        // setUserInput('')
        //navigator.vibrate([100,100])
      } else {
        setOpenAIResponse(EXAMPLE_OPENAI_RESPONSE);
      }
    } catch (e) {
      console.error("Error sending request to OpenAI:", e);
      setLastError(e as string);
      setOpenAIResponse(EXAMPLE_OPENAI_RESPONSE);
    } finally {
      setLoading(false);
      speechSynthesis.cancel(); // Stop TTS when loading ends
    }
  }
  // -------------------------------------------------------------------------------------------------------------------
  //tts function for speaking
  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      utterance.rate = 1; // Set the speech rate (optional)
    } else {
      console.error("Speech synthesis not supported in this browser.");
    }
  }
  // -------------------------------------------------------------------------------------------------------------------
  //speech to text- Speech recognition
  const startListening = () => {
    if (!isListening) {
      if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }
      if (recognitionRef.current) recognitionRef.current.start();
    } else if (recognitionRef.current) recognitionRef.current.stop();
  };

  const stopListening = () => {
    if (
      recognitionRef.current &&
      typeof recognitionRef.current.stop === "function"
    )
      recognitionRef.current.stop();
    setIsListening(false);
    // console.log(useSound('ui/item_deselect')); // Play sound when stopping listening
  };
  // -------------------------------------------------------------------------------------------------------------------
  const handleCapture = (target: EventTarget & HTMLInputElement) => {
    if (target.files) {
      if (target.files.length !== 0) {
        const file = target.files[0];

        if (file.type.startsWith("video")) {
          setUserInput("Describe the video"); // Update prompt for video upload
          //Blob URL for uploaded video
          const videoBlob = new Blob([file], { type: file.type });
          // const videoUrl = URL.createObjectURL(videoBlob);
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

  function tapToListen() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  return {
    camera,
    videoRef,
    fileInputRef,
    responseRef,

    image,
    videoBlob,
    openAIResponse,
    loading,
    userInput,
    audioUrl,
    cameraMode,
    isRecording,
    isListening,
    isMobile,
    currentChatId,
    currentMessageId,
    currentOrientation,

    setImage,
    setVideoBlob,
    setOpenAIResponse,
    setUserInput,
    setCameraMode,

    handleCapture,
    handlePointerDown,
    handlePointerUp,
    handleVideoRecording,
    handleRetake,
    sendRequestOpenAI,
    tapToListen,
    speak,
  };
}

export type MainActions = ReturnType<typeof useMainActions>;
