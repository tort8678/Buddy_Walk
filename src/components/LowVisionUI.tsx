import { Camera } from "react-camera-pro";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { MainActions } from "../hooks/useMainActions";
import {
  AccessibleButton,
  AccessibleTextField,
  AccessibleTypography,
} from "../pages/main/style.ts";
import ReportMessage from "./ReportMessage.tsx";
import CallAccessARideButton from "./call.tsx";

export default function LowVisionUI({
  camera,
  fileInputRef,
  responseRef,
  image,
  videoBlob,
  openAIResponse,
  loading,
  userInput,
  isRecording,
  isListening,
  isMobile,
  currentChatId,
  currentMessageId,
  setImage,
  setUserInput,
  handleCapture,
  handlePointerDown,
  handlePointerUp,
  handleVideoRecording,
  handleRetake,
  sendRequestOpenAI,
  tapToListen,
  speak,
}: MainActions) {
  const hasMedia = Boolean(image || (videoBlob?.size && videoBlob.size > 0));

  return (
    <Stack
      component="main"
      role="main"
      sx={{
        minHeight: "100vh",
        overflowX: "hidden",
        bgcolor: "black",
        color: "white",
        px: { xs: 2, sm: 4 },
        py: { xs: 2, sm: 4 },
        gap: 3,
      }}
    >
      {!hasMedia && (
        <Box
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <Camera
            aspectRatio={4 / 3}
            facingMode="environment"
            ref={camera}
            aria-label="Camera viewfinder"
            errorMessages={{}}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={(e) => handleCapture(e.target)}
            style={{ display: "none" }}
          />
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: "960px",
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) minmax(0, 1fr)",
          },
          gap: 3,
        }}
      >
        <Stack sx={{ gap: 2 }}>
          <Box
            sx={{
              border: "2px solid white",
              borderRadius: 2,
              p: 2,
              textAlign: "center",
              "& .MuiButton-root": {
                mx: "auto",
              },
            }}
          >
            <AccessibleTypography sx={{ fontSize: "1.5rem" }}>
              {hasMedia
                ? videoBlob?.size && videoBlob.size > 0
                  ? "Video Captured"
                  : "Image Captured"
                : "Add a photo or video"}
            </AccessibleTypography>

            {hasMedia ? (
              <AccessibleButton onPointerUp={handleRetake}>
                Retake
              </AccessibleButton>
            ) : (
              <>
                {!isMobile && (
                  <AccessibleButton
                    onClick={() => {
                      const capturedImage =
                        camera.current?.takePhoto() as string;
                      if (capturedImage) {
                        setImage(capturedImage);
                        setUserInput("Describe the image");
                      }
                    }}
                  >
                    Take Photo
                  </AccessibleButton>
                )}
                {!isMobile && (
                  <AccessibleButton onClick={handleVideoRecording}>
                    {isRecording ? "Stop Video" : "Start Video"}
                  </AccessibleButton>
                )}
                {isMobile && (
                  <Button
                    sx={{
                      width: "100%",
                      minHeight: "96px",
                      bgcolor: "white",
                      color: "black",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    disabled={isRecording}
                  >
                    {isRecording ? "Stop Video" : "Camera"}
                  </Button>
                )}
                <AccessibleButton onClick={() => fileInputRef.current?.click()}>
                  Upload File
                </AccessibleButton>
              </>
            )}
          </Box>

          <Box
            sx={{
              border: "2px solid white",
              borderRadius: 2,
              p: 2,
              textAlign: "center",
              "& .MuiButton-root": {
                mx: "auto",
              },
            }}
          >
            <AccessibleTypography sx={{ fontSize: "1.5rem" }}>
              Ask a question
            </AccessibleTypography>
            <AccessibleTextField
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              aria-label="Type your question"
              sx={{ width: "95%", bgcolor: "white", borderRadius: 2, my: 2 }}
            />
            <AccessibleButton onClick={tapToListen}>
              {isListening ? "Listening..." : "Speak Question"}
            </AccessibleButton>
            <AccessibleButton onClick={sendRequestOpenAI}>
              Submit
            </AccessibleButton>
          </Box>
        </Stack>

        <Box
          ref={responseRef}
          sx={{
            border: "2px solid white",
            borderRadius: 2,
            p: 2,
            minHeight: 320,
            textAlign: "center",
          }}
        >
          <AccessibleTypography sx={{ fontSize: "1.5rem" }}>
            Response
          </AccessibleTypography>
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
              <CircularProgress
                size={72}
                thickness={6}
                sx={{ color: "white" }}
              />
            </Box>
          ) : (
            <Box aria-live="polite" role="status">
              {openAIResponse && (
                <AccessibleButton
                  onClick={() => {
                    if (speechSynthesis.speaking) speechSynthesis.cancel();
                    else speak(openAIResponse);
                  }}
                >
                  Play/Pause Response
                </AccessibleButton>
              )}
              <AccessibleTypography>{openAIResponse}</AccessibleTypography>
              {openAIResponse && (
                <AccessibleButton
                  onClick={() => {
                    navigator.clipboard.writeText(openAIResponse);
                    speak("Response copied");
                  }}
                >
                  Copy Response
                </AccessibleButton>
              )}
              <ReportMessage
                openAIResponse={openAIResponse}
                currentMessageId={currentMessageId}
                currentChatId={currentChatId}
              />
            </Box>
          )}
        </Box>
      </Box>

      <CallAccessARideButton />
    </Stack>
  );
}
