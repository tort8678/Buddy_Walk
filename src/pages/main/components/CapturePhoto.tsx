// blue section

import { Box, Button } from "@mui/material";
import { Camera, CameraType } from "react-camera-pro";
import { AccessibleButton, AccessibleTypography, BlueSection } from "../style";

type CapturePhotoProps = {
  image: string | null;
  videoBlob: Blob | null;
  isMobile: boolean;
  cameraMode: "photo" | "video";
  isRecording: boolean;
  camera: React.MutableRefObject<CameraType | null>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  uploadInputRef: React.MutableRefObject<HTMLInputElement | null>;
  handleCapture: (target: EventTarget & HTMLInputElement) => void;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  handleVideoRecording: () => Promise<void>;
  handleRetake: () => void;
  setImage: React.Dispatch<React.SetStateAction<string | null>>;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
};

export default function CapturePhoto({
  image,
  videoBlob,
  isMobile,
  cameraMode,
  isRecording,
  camera,
  fileInputRef,
  uploadInputRef,
  handleCapture,
  handlePointerDown,
  handlePointerUp,
  handleVideoRecording,
  handleRetake,
  setImage,
  setUserInput,
}: CapturePhotoProps) {
  return (
    <BlueSection>
      {!(videoBlob?.size && videoBlob?.size > 0) && !image && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%", // give it real layout size
            height: "100%", // or whatever aspect you need
            opacity: 0, // fully transparent
            pointerEvents: "none",
          }}
        >
          <Camera
            aspectRatio={4 / 3}
            facingMode={"environment"}
            ref={camera}
            aria-label="Camera viewfinder"
            errorMessages={{}}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleCapture(e.target)}
            style={{ display: "none" }}
          />
        </div>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AccessibleTypography
          sx={{ alignSelf: "center", marginBottom: "1rem", fontSize: "2rem" }}
        >
          {(videoBlob?.size && videoBlob?.size > 0) || image ? (
            videoBlob?.size && videoBlob?.size > 0 ? (
              "Video Captured"
            ) : (
              "Image Captured"
            )
          ) : (
            <>
              {"Tap for Photo"} <br /> {"Hold for Video"}
            </>
          )}
        </AccessibleTypography>
      </Box>
      {/* Condition for displaying either camera or video view depending on whether the image or videoBlob exists */}
      {!image && (!videoBlob || videoBlob.size == 0) ? (
        <>
          {/* Upload file button for desktop */}
          {!isMobile && (
            <>
              <AccessibleButton
                onClick={() => uploadInputRef.current?.click()}
                sx={{
                  width: "100%",
                  maxWidth: "600px",
                  marginTop: "16px",
                  marginBottom: "16px",
                  "&:hover": { backgroundColor: "#303030" },
                  "&:focus": {
                    outline: "3px solid #FFA500",
                    outlineOffset: "2px",
                  },
                }}
                aria-label={
                  image || videoBlob ? "Reupload file" : "Upload file"
                }
              >
                {cameraMode === "video" ? "UPLOAD VIDEO" : "UPLOAD IMAGE"}
              </AccessibleButton>

              <input
                ref={uploadInputRef}
                accept={cameraMode === "video" ? "video/*" : "image/*"}
                type="file"
                onChange={(e) => handleCapture(e.target)}
                style={{ display: "none" }}
              />
            </>
          )}

          {/* ----------------------------------------------------------------------------------------------------------- */}
          {/* take picture/video buttons for mobile */}
          {isMobile && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px", // space between buttons
                flexWrap: "wrap",
              }}
            >
              {/* Start/Stop Video Button */}
              <Button
                component="label"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "20px",
                  fontSize: "2rem",
                  marginBottom: "2rem",
                  backgroundColor: "white",
                  color: "black",
                  borderRadius: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  height: "8rem",
                  width: "90%",
                  boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
                  "&:hover": {
                    backgroundColor: "#e0e0e0",
                  },
                  "&:active": {
                    backgroundColor: "#d0d0d0",
                  },
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp} // Ensure it stops if finger is moved
                onPointerLeave={handlePointerUp} // Stop if pointer leaves the button
                onPointerOut={handlePointerUp} // Stop if pointer is moved out
                disabled={isRecording} // Disable button while recording
                aria-label="Tap for Picture, Hold for Video"
              >
                {isRecording ? "STOP VIDEO" : "CAMERA BUTTON"}
              </Button>
            </Box>
          )}
          {/* ----------------------------------------------------------------------------------------------------------- */}
          {/* Take photo button (desktop)  */}
          {!isMobile && cameraMode === "photo" && (
            <AccessibleButton
              onClick={() => {
                const capturedImage = camera.current?.takePhoto() as string;
                if (capturedImage) {
                  setImage(capturedImage);
                  setUserInput("Describe the image");
                } else {
                  console.error("Failed to capture image.");
                }
              }}
              aria-label="Take photo"
              sx={{
                width: "100%",
                maxWidth: "600px",
                marginTop: "16px",
                marginBottom: "16px",
                "&:hover": { backgroundColor: "#303030" },
                "&:focus": {
                  outline: "3px solid #FFA500",
                  outlineOffset: "2px",
                },
              }}
            >
              Take photo
            </AccessibleButton>
          )}
          {/* ----------------------------------------------------------------------------------------------------------- */}
          {/* Start/Stop Video button (desktop) */}
          {!isMobile && cameraMode === "video" && (
            <AccessibleButton
              onClick={handleVideoRecording}
              aria-label={isRecording ? "Stop video" : "Start video"}
              sx={{
                width: "100%",
                maxWidth: "600px",
                marginTop: "16px",
                marginBottom: "16px",
                "&:hover": {
                  backgroundColor: "#e0e0e0",
                },
                "&:active": {
                  backgroundColor: "#d0d0d0",
                },
              }}
            >
              {isRecording ? "Stop Video" : "Start Video"}
            </AccessibleButton>
          )}
        </>
      ) : (
        <>
          {/* <p>Buddy Walk</p> this text is a conditon that helps the video render */}
          {/* Video Preview */}

          <Box sx={{ width: "100%", maxWidth: "600px", textAlign: "center" }}>
            {/* `<AccessibleButton
                                sx={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    marginTop: '16px',
                                    marginBottom: '16px',
                                    '&:hover': { backgroundColor: '#303030', },
                                    '&:focus': {
                                        outline: '3px solid #FFA500',
                                        outlineOffset: '2px',
                                    },
                                }}
                                aria-label="View Captured Photo"
                                onClick={()=>setShowImage(true)}
                            >
                                View Captured Photo
                            </AccessibleButton>` */}
            <AccessibleButton
              onPointerUp={handleRetake}
              aria-label="Retake photo or video"
              sx={{
                width: "100%",
                maxWidth: "600px",
                marginTop: "16px",
                marginBottom: "16px",
                "&:hover": { backgroundColor: "#303030" },
                "&:focus": {
                  outline: "3px solid #FFA500",
                  outlineOffset: "2px",
                },
              }}
            >
              Retake Photo
            </AccessibleButton>
          </Box>
        </>
      )}
    </BlueSection>
  );
}
