// green section

import { Box, CircularProgress } from "@mui/material";
import { AccessibleButton, AccessibleTypography, GreenSection } from "../style";
import ReportMessage from "../../../components/ReportMessage";

type ResponseSectionProps = {
  loading: boolean;
  openAIResponse: string;
  responseRef: React.RefObject<HTMLDivElement>;
  // sendRequestOpenAI: () => Promise<void>;
  sendRequestOpenAI: () => Promise<string[]>; // returns uploaded frame URLs
  speak: (text: string) => void;
  currentMessageId: string;
  currentChatId: string;
};

export default function ResponseSection({
  loading,
  openAIResponse,
  responseRef,
  sendRequestOpenAI,
  speak,
  currentMessageId,
  currentChatId,
}: ResponseSectionProps) {
  return (
    <GreenSection>
      {/* debugging purposes */}
      <AccessibleButton
        onClick={async () => {
          const urls = await sendRequestOpenAI();
          console.log("Returned URLs:", urls);
        }}
        // <AccessibleButton
        //   onClick={() => sendRequestOpenAI()}
        aria-label="Submit Question"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "90%",
          maxWidth: "600px",
          height: "80px",
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
        {loading ? (
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
              thickness={6}
              sx={{
                margin: "20px",
                color: "#f8f8ff",
              }}
            />
            <AccessibleTypography sx={{ color: "#f8f8ff", marginTop: "10px" }}>
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
            {openAIResponse !== "" && (
              <AccessibleButton
                onClick={() => {
                  if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                  } else {
                    speak(openAIResponse);
                  }
                }}
                aria-label="Play or Pause text-to-speech"
                sx={{
                  padding: "12px 28px",
                  borderRadius: "40px",
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
                  width: "fit-content",
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

            {openAIResponse !== "" && (
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
        {/* code below adds the drag/seek audio bar */}
        {/* {audioUrl && <audio id="ttsAudio" src={audioUrl} autoPlay style={{display:"none"}}/>}  */}
        {/* --------------------------------------------------------------------------------------------- */}
        {/*TTS Button with Play/Pause option*/}
      </div>
    </GreenSection>
  );
}
