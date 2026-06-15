import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Container, Typography } from "@mui/material";
import { AccessibleButton } from "../main/style.ts";
import React from "react";
import { useNavigate } from "react-router-dom";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
    },
    text: {
      primary: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Poppins, Arial, sans-serif",
  },
});

const SelectUI: React.FC = () => {
  const navigate = useNavigate();

  const chooseMode = (mode: "blind" | "low-vision") => {
    localStorage.setItem("accessMode", mode);
    navigate("/main");
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "black",
          color: "white",
          textAlign: "center",
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            py: { xs: 1, sm: 2 },
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              px: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: "2.8rem",
                lineHeight: 1.2,
                marginTop: "2vh",
              }}
              aria-label="Please Select Blind or Low Vision"
            >
              Do you identify as blind or low vision? Please select one option.
            </Typography>
          </Box>
          <Container>
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
              aria-label="Blind"
              onClick={() => chooseMode("blind")}
            >
              Blind
            </AccessibleButton>
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
              aria-label="Low Vision"
              onClick={() => chooseMode("low-vision")}
            >
              Low Vision
            </AccessibleButton>
          </Container>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default SelectUI;
