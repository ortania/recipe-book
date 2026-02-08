import { useState, useRef, useCallback, useEffect } from "react";
import { PiMicrophoneThin, PiMicrophoneSlashThin } from "react-icons/pi";
import { sendCookingChatMessage } from "../../services/openai";
import classes from "./cooking-voice-chat.module.css";

function CookingVoiceChat({
  recipe,
  ingredients,
  instructions,
  currentStep,
  servings,
  onNextStep,
  onPrevStep,
  onGotoStep,
  onStartTimer,
  onStopTimer,
  isTimerRunning,
}) {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [lastResponse, setLastResponse] = useState("");

  const recognitionRef = useRef(null);
  const isActiveRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Refs for latest prop values so processVoiceInput always reads current state
  const currentStepRef = useRef(currentStep);
  const servingsRef = useRef(servings);
  const ingredientsRef = useRef(ingredients);
  const instructionsRef = useRef(instructions);
  const isTimerRunningRef = useRef(isTimerRunning);

  // Keep refs in sync with props
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  useEffect(() => {
    servingsRef.current = servings;
  }, [servings]);
  useEffect(() => {
    ingredientsRef.current = ingredients;
  }, [ingredients]);
  useEffect(() => {
    instructionsRef.current = instructions;
  }, [instructions]);
  useEffect(() => {
    isTimerRunningRef.current = isTimerRunning;
  }, [isTimerRunning]);

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "he-IL";
      utterance.rate = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const handleAction = useCallback(
    (action) => {
      if (!action) return;
      switch (action.type) {
        case "next":
          onNextStep();
          break;
        case "prev":
          onPrevStep();
          break;
        case "goto":
          if (action.step && action.step > 0) {
            onGotoStep(action.step - 1);
          }
          break;
        case "timer":
          if (action.minutes && action.minutes > 0) {
            onStartTimer(action.minutes);
          }
          break;
        case "stop_timer":
          onStopTimer();
          break;
        default:
          break;
      }
    },
    [onNextStep, onPrevStep, onGotoStep, onStartTimer, onStopTimer],
  );

  const stopRecognitionTemporarily = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        // already stopped
      }
      recognitionRef.current = null;
    }
  }, []);

  const processVoiceInput = useCallback(
    async (text) => {
      isProcessingRef.current = true;
      setIsProcessing(true);
      setStatusText("חושב...");

      // Stop recognition completely before processing
      stopRecognitionTemporarily();

      try {
        const recipeData = {
          recipeName: recipe.name,
          ingredients: ingredientsRef.current,
          instructions: instructionsRef.current,
          activeTab: "instructions",
          currentStep: currentStepRef.current,
          servings: servingsRef.current,
          isTimerRunning: isTimerRunningRef.current,
        };

        const response = await sendCookingChatMessage(text, recipeData);
        const responseText = response.text || "לא הצלחתי להבין";

        setLastResponse(responseText);
        setStatusText("מדבר...");

        if (response.action) {
          handleAction(response.action);
        }

        await speak(responseText);
      } catch (error) {
        console.error("Voice chat error:", error);
        setLastResponse("שגיאה בתקשורת");
        await speak("סליחה, הייתה שגיאה");
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
        setStatusText("");
        // Restart listening after a delay so mic doesn't pick up TTS tail
        if (isActiveRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && !isProcessingRef.current) {
              startListeningInternal();
            }
          }, 800);
        }
      }
    },
    [recipe.name, handleAction, speak, stopRecognitionTemporarily],
  );

  const startListeningInternal = useCallback(() => {
    if (isProcessingRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("זיהוי קולי לא נתמך בדפדפן זה");
      return;
    }

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        /* ignore */
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "he-IL";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatusText("מקשיב...");
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      if (!event.results[last].isFinal) return;

      const text = event.results[last][0].transcript.trim();
      const confidence = event.results[last][0].confidence;

      console.log("🎤 Voice chat heard:", text, "confidence:", confidence);

      if (confidence < 0.4 || !text) {
        setStatusText("לא הבנתי, נסה שוב");
        return;
      }

      // Stop recognition before processing to avoid picking up TTS
      try {
        recognition.onend = null;
        recognition.stop();
      } catch (e) {
        /* ignore */
      }
      recognitionRef.current = null;

      setStatusText(`"${text}"`);
      processVoiceInput(text);
    };

    recognition.onend = () => {
      // Continuous mode ended unexpectedly - restart if still active
      if (isActiveRef.current && !isProcessingRef.current) {
        console.log("Recognition ended unexpectedly, restarting...");
        setTimeout(() => {
          if (isActiveRef.current && !isProcessingRef.current) {
            startListeningInternal();
          }
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      console.error("Voice chat recognition error:", event.error);
      if (event.error === "not-allowed") {
        alert("יש לאפשר גישה למיקרופון");
        setIsActive(false);
        isActiveRef.current = false;
        return;
      }
      if (event.error === "no-speech") {
        // In continuous mode this can happen - just keep going
        return;
      }
      // For aborted errors during intentional stop, do nothing
      if (event.error === "aborted") return;
      // For other errors, onend will handle restart
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      // Retry after a delay
      setTimeout(() => {
        if (isActiveRef.current && !isProcessingRef.current) {
          startListeningInternal();
        }
      }, 1000);
    }
  }, [processVoiceInput]);

  const stopListening = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Stop recognition:", e);
      }
      recognitionRef.current = null;
    }
    setStatusText("");
    setLastResponse("");
  }, []);

  const toggleVoiceChat = useCallback(() => {
    if (isActive) {
      isActiveRef.current = false;
      isProcessingRef.current = false;
      setIsActive(false);
      stopListening();
    } else {
      isActiveRef.current = true;
      setIsActive(true);
      startListeningInternal();
    }
  }, [isActive, startListeningInternal, stopListening]);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className={classes.voiceChatContainer}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleVoiceChat();
        }}
        className={`${classes.voiceChatButton} ${isActive ? classes.active : ""} ${isSpeaking ? classes.speaking : ""}`}
      >
        <span className={classes.buttonIcon}>
          {isActive ? <PiMicrophoneThin /> : <PiMicrophoneSlashThin />}
        </span>
        <span className={classes.buttonLabel}>
          {isActive ? "Stop Chat" : "Voice Chat"}
        </span>
      </button>

      {isActive && (
        <div
          className={classes.statusArea}
          onClick={(e) => e.stopPropagation()}
        >
          {isProcessing && (
            <div className={classes.processingIndicator}>
              <span className={classes.dot}></span>
              <span className={classes.dot}></span>
              <span className={classes.dot}></span>
            </div>
          )}
          {statusText && <div className={classes.statusText}>{statusText}</div>}
          {lastResponse && !isProcessing && (
            <div className={classes.responseText}>{lastResponse}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default CookingVoiceChat;
