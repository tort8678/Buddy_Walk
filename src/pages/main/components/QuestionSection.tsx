// gray section

import { Box, Button } from "@mui/material";
import {
  AccessibleTypography,
  AccessibleTextField,
  GraySection,
} from "../style";

type QuestionSectionProps = {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  isListening: boolean;
  startListening: (e: React.PointerEvent) => void;
  stopListening: (e: React.PointerEvent) => void;
};

export default function QuestionSection({
  userInput,
  setUserInput,
  isListening,
  startListening,
  stopListening,
}: QuestionSectionProps) {
  return (
    <GraySection>
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
      />

      <Button
        onPointerDown={startListening}
        onPointerUp={stopListening}
        onPointerCancel={stopListening}
        onPointerLeave={stopListening}
        onPointerOut={stopListening}
        aria-label="Hold to Ask a Question"
        style={{
          padding: "12px 28px",
          borderRadius: "40px",
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
          width: "90%",
          marginTop: "5px",
          marginBottom: "16px",
          border: "none",
          minWidth: "50%",
        }}
      >
        {isListening ? "Listening..." : "Hold to Ask a Question"}
      </Button>
    </GraySection>
  );
}
