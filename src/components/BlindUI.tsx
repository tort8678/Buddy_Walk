import { Camera } from "react-camera-pro";
import {
  Box,
  Stack,
  Switch,
  FormControlLabel,
  CircularProgress,
  Button,
} from "@mui/material";
import { MainActions } from "../hooks/useMainActions";
import {
  AccessibleButton,
  AccessibleTypography,
  AccessibleTextField,
  BlueSection,
  GraySection,
  GreenSection,
} from "../pages/main/style.ts";
import ReportMessage from "./ReportMessage.tsx";
import CallAccessARideButton from "./call.tsx";

export default function BlindUI({
  camera,
  fileInputRef,
  responseRef,
  image,
  videoBlob,
  openAIResponse,
  loading,
  userInput,
  cameraMode,
  isRecording,
  isListening,
  isMobile,
  currentChatId,
  currentMessageId,
  setImage,
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
}: MainActions) {
  return (
    <Stack
      component="main"
      role="main"
      sx={{
        display: "flex", //flex container
        flexDirection: "column",
        justifyContent: "center", //centered horizontally
        alignItems: "center", //centered vertically
        paddingLeft: isMobile ? "8px" : "32px",
        paddingRight: isMobile ? "8px" : "32px",
        backgroundColor: "black",
        color: "white",
        overflowX: "hidden",
        overflowY: "scroll",
        minHeight: "100vh", // Fill the entire viewport height.
        // paddingBottom: '100px',
      }}
    >
      {/* {showImage &&
            <Box  height="100vh" width="100vw" color="black">
                <img src={image as string} style={{width: "100%"}} />
                <AccessibleButton onClick={()=>setShowImage(false)}>
                    Close Photo Preview
                </AccessibleButton>
                
            </Box>
            } */}

      {/* Blue Section: Take Photo */}
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
                  onClick={() => fileInputRef?.current?.click()}
                >
                  {cameraMode === "video" ? "UPLOAD VIDEO" : "UPLOAD IMAGE"}
                </AccessibleButton>
                <input
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  type="file"
                  capture="environment"
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
                  onPointerCancel={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerOut={handlePointerUp}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                      setUserInput("Describe the image");
                    }
                  }}
                  disabled={isRecording}
                  aria-label="Tap for Picture, Hold for Video. Press Enter or Space to upload a photo."
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

      {/* --------------------------------------------------------------------------------------------------------- */}

      {/* Gray Section: Asking the Question */}
      <GraySection>
        {/* Question input field */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <AccessibleTypography>Enter A Question Below</AccessibleTypography>
        </Box>
        <AccessibleTextField
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          sx={{
            bgcolor: "white",
            marginY: 2,
            maxWidth: "550px",
            borderRadius: "12px",
            width: "90%",
          }}
          aria-label="Type Out Your Question Here"
          // InputProps={{
          //     endAdornment: (
          //         <InputAdornment position="end">
          //             <IconButton
          //                 aria-label="clear text"
          //                 onClick={() => setUserInput("")}
          //                 edge="end"
          //                 sx={{ visibility: userInput ? "visible" : "hidden" }}
          //             >
          //                 <ClearIcon />
          //             </IconButton>
          //         </InputAdornment>
          //     ),
          // }}
        />
        {/* speech to text button below */}
        <Button
          // onPointerDown={(e) => startListening(e)}
          // // onPointerDown={()=> SpeechRecognition.startListening}
          // onPointerUp={(e) => stopListening(e)}
          // // onPointerUp={() => {SpeechRecognition.stopListening(); console.log(transcript)}}
          // // onTouchStart={startListening}
          // // onTouchEnd={stopListening}
          // onPointerCancel={stopListening} // Ensure it stops if finger is moved
          // onPointerLeave={stopListening} // Stop if pointer leaves the button
          aria-label="Tap to Ask a Question"
          // onPointerOut={stopListening} // Stop if pointer is moved out
          onClick={() => tapToListen()}
          // onPointerCancel={() => SpeechRecognition.stopListening()}
          style={{
            padding: "12px 28px", // shorter height and wider for tap comfort
            borderRadius: "40px", // rounder edges
            cursor: "pointer",
            color: "black",
            fontSize: "1.2rem",
            fontWeight: "800",
            letterSpacing: "0.05em",
            backgroundColor: "white",
            boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "90%", // allows it to size based on content
            marginTop: "5px",
            marginBottom: "16px",
            border: "none",
            minWidth: "50%", // minimum width for better touch target
          }}
        >
          {isListening ? "Listening..." : "Tap to Ask a Question"}
        </Button>
      </GraySection>

      {/* Green Section: Displaying the Response */}
      <GreenSection>
        {/* Submit button */}
        <AccessibleButton
          onClick={() => sendRequestOpenAI()}
          aria-label="Submit Question"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "90%", // full width
            maxWidth: "600px", // responsive cap
            height: "80px", // shorter than 120px but still chunky
            padding: "20px",
            fontSize: "2rem",
            marginTop: "2rem",
            marginBottom: ".5rem",
            backgroundColor: "white",
            color: "black",
            borderRadius: "20px",
            textAlign: "center",
            cursor: "pointer",
            fontWeight: "bold",
            letterSpacing: "0.1em",
            boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
            "&:hover": {
              backgroundColor: "#e0e0e0",
            },
            "&:active": {
              backgroundColor: "#d0d0d0",
            },
          }}
        >
          Submit
        </AccessibleButton>

        <div ref={responseRef} style={{ marginTop: "16px" }}>
          {" "}
          {/* to start the scroll down */}
          {loading ? ( //loading circle
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                margin: "20px",
              }}
            >
              <CircularProgress
                size={80}
                thickness={6} //increased thickness for better visibility
                sx={{
                  margin: "20px",
                  color: "#f8f8ff",
                }}
              />
              <AccessibleTypography
                sx={{ color: "#f8f8ff", marginTop: "10px" }}
              >
                Loading response...
              </AccessibleTypography>
            </Box>
          ) : (
            <Box
              aria-live="polite"
              role="status"
              sx={{
                marginTop: 2,
                maxWidth: "600px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {openAIResponse != "" && (
                <AccessibleButton
                  onClick={() => {
                    if (speechSynthesis.speaking)
                      speechSynthesis.cancel(); // Stop TTS if it's currently speaking
                    else speak(openAIResponse); // Play TTS message
                  }}
                  aria-label="Play or Pause text-to-speech"
                  sx={{
                    padding: "12px 28px", // shorter height and wider for tap comfort
                    borderRadius: "40px", // rounder edges
                    cursor: "pointer",
                    color: "black",
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    letterSpacing: "0.05em",
                    backgroundColor: "white",
                    boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "fit-content", // allows it to size based on content
                    marginTop: "5px",
                    marginBottom: "16px",
                    border: "none",
                  }}
                >
                  <span
                    role="img"
                    aria-label="Speaker Emoji"
                    style={{ marginRight: "8px" }}
                  >
                    🔊
                  </span>
                  Play/Pause Response
                </AccessibleButton>
              )}
              <AccessibleTypography>{openAIResponse}</AccessibleTypography>
              {openAIResponse != "" && (
                <AccessibleButton
                  onClick={() => {
                    navigator.clipboard.writeText(openAIResponse);
                    speak("Response copied");
                  }}
                  aria-label="Copy response to clipboard"
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
          {/* code below adds the drag/seek audio bar */}
          {/* {audioUrl && <audio id="ttsAudio" src={audioUrl} autoPlay style={{display:"none"}}/>}  */}
          {/* --------------------------------------------------------------------------------------------- */}
          {/*TTS Button with Play/Pause option*/}
        </div>
      </GreenSection>
      {/* Sticky Call Button */}
      <CallAccessARideButton />
      {/* Toggle switch for camera mode visible on desktop */}
      {!isMobile && (
        <FormControlLabel
          control={
            <Switch
              checked={cameraMode === "video"}
              onChange={() =>
                setCameraMode(cameraMode === "photo" ? "video" : "photo")
              }
            />
          }
          label={cameraMode === "photo" ? "Switch to Video" : "Switch to Photo"}
          aria-label="Toggle camera mode"
          sx={{ width: "100%", maxWidth: "600px", marginTop: "16px" }}
        />
      )}
    </Stack>
  );
}
