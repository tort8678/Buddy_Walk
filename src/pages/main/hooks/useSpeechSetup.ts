// turns speech into text

import { useEffect, useRef, useState } from "react";
import { createSpeechRecognitionPonyfill } from "web-speech-cognitive-services";
import { getToken } from "../../../api/token";
import { playSound } from "react-sounds";

export function useSpeechSetup(
  setUserInput: React.Dispatch<React.SetStateAction<string>>,
) {
  const recognitionRef = useRef<SpeechRecognition | null | any>(null);
  const [isListening, setIsListening] = useState(false); // Track if voice button is active

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

        recognition.onerror = (event: any) =>
          console.error("Speech recognition error:", event.error);

        recognition.onresult = (event: any) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex]![0]!.transcript;
          setUserInput(transcript);
        };

        recognitionRef.current = recognition;
      }
    })();
  }, [setUserInput]);

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

  //speech to text- Speech recognition
  const startListening = (e: React.PointerEvent) => {
    if (!isListening) {
      e.currentTarget.setPointerCapture(e.pointerId);

      if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }
      recognitionRef.current?.start();
    } else recognitionRef.current?.stop();
  };

  const stopListening = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    recognitionRef.current?.stop();
    setIsListening(false);
    // console.log(useSound('ui/item_deselect')); // Play sound when stopping listening
  };

  return {
    recognitionRef,
    isListening,
    startListening,
    stopListening,
  };
}
