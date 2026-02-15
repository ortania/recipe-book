import { useState, useRef, useEffect } from "react";
import { PiMicrophoneThin, PiMicrophoneSlashThin } from "react-icons/pi";
import { FaMicrophone } from "react-icons/fa6";
import { FaMicrophoneSlash } from "react-icons/fa";
import { sendCookingChatMessage } from "../../services/openai";
import { getOpenAIKey } from "../../firebase/apiKeyService";
import { useLanguage } from "../../context";
import classes from "./cooking-voice-chat.module.css";

const SPEECH_LANG_MAP = {
  he: "he-IL",
  en: "en-US",
  ru: "ru-RU",
  de: "de-DE",
  mixed: "he-IL",
};

const HE_ONES = [
  "",
  "אחת",
  "שתיים",
  "שלוש",
  "ארבע",
  "חמש",
  "שש",
  "שבע",
  "שמונה",
  "תשע",
];
const HE_TENS = [
  "",
  "עשר",
  "עשרים",
  "שלושים",
  "ארבעים",
  "חמישים",
  "שישים",
  "שבעים",
  "שמונים",
  "תשעים",
];
const HE_TEENS = [
  "עשר",
  "אחת עשרה",
  "שתים עשרה",
  "שלוש עשרה",
  "ארבע עשרה",
  "חמש עשרה",
  "שש עשרה",
  "שבע עשרה",
  "שמונה עשרה",
  "תשע עשרה",
];

function numberToHebrew(n) {
  if (n === 0) return "אפס";
  if (n < 0) return "מינוס " + numberToHebrew(-n);
  const num = Math.round(n);
  if (num >= 1000) return String(num);
  let result = "";
  if (num >= 100) {
    const h = Math.floor(num / 100);
    result += h === 1 ? "מאה" : h === 2 ? "מאתיים" : HE_ONES[h] + " מאות";
    const rem = num % 100;
    if (rem > 0) result += " " + numberToHebrew(rem);
    return result;
  }
  if (num >= 20) {
    result = HE_TENS[Math.floor(num / 10)];
    const rem = num % 10;
    if (rem > 0) result += " ו" + HE_ONES[rem];
    return result;
  }
  if (num >= 10) return HE_TEENS[num - 10];
  return HE_ONES[num];
}

function digitsToHebrew(text) {
  return text.replace(/\d+(\.\d+)?/g, (match) => {
    const num = parseFloat(match);
    if (match.includes(".")) {
      const [whole, frac] = match.split(".");
      return (
        numberToHebrew(parseInt(whole)) +
        " נקודה " +
        numberToHebrew(parseInt(frac))
      );
    }
    return numberToHebrew(num);
  });
}

function CookingVoiceChat({
  recipe,
  ingredients,
  instructions,
  currentStep,
  servings,
  activeTab,
  onNextStep,
  onPrevStep,
  onGotoStep,
  onStartTimer,
  onStopTimer,
  onSwitchTab,
  isTimerRunning,
}) {
  const { language } = useLanguage();
  const lang = language || "he";
  const speechLang = SPEECH_LANG_MAP[lang] || "he-IL";

  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [lastResponse, setLastResponse] = useState("");

  const recognitionRef = useRef(null);
  const isActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioSourceRef = useRef(null);

  // Single ref holding ALL current values - updated synchronously every render
  const $ = useRef({});
  $.current = {
    recipe,
    ingredients,
    instructions,
    currentStep,
    servings,
    activeTab,
    isTimerRunning,
    lang,
    speechLang,
    onNextStep,
    onPrevStep,
    onGotoStep,
    onStartTimer,
    onStopTimer,
    onSwitchTab,
  };

  // ---- Helper: ensure AudioContext is created & resumed (call on user gesture) ----
  function ensureAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }

  // ---- Helper: speak text aloud using OpenAI TTS ----
  async function speakText(text) {
    if (!text) return;
    const apiKey = await getOpenAIKey();
    if (!apiKey) return;
    setIsSpeaking(true);
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: "nova",
          response_format: "mp3",
        }),
      });
      if (!response.ok || !isActiveRef.current) {
        setIsSpeaking(false);
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!isActiveRef.current) {
        setIsSpeaking(false);
        return;
      }

      const ctx = audioCtxRef.current;
      if (ctx) {
        try {
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          await new Promise((resolve) => {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            audioSourceRef.current = source;
            source.onended = () => {
              audioSourceRef.current = null;
              resolve();
            };
            source.start(0);
          });
        } catch (decodeErr) {
          console.error(
            "🔊 AudioContext decode failed, falling back:",
            decodeErr,
          );
          // Fallback to Audio element with blob URL
          const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
          const blobUrl = URL.createObjectURL(blob);
          await new Promise((resolve) => {
            const audio = new Audio(blobUrl);
            audioRef.current = audio;
            audio.onended = () => {
              audioRef.current = null;
              URL.revokeObjectURL(blobUrl);
              resolve();
            };
            audio.onerror = () => {
              audioRef.current = null;
              URL.revokeObjectURL(blobUrl);
              resolve();
            };
            audio.play().catch(() => {
              audioRef.current = null;
              URL.revokeObjectURL(blobUrl);
              resolve();
            });
          });
        }
      } else {
        // No AudioContext, use Audio element
        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const blobUrl = URL.createObjectURL(blob);
        await new Promise((resolve) => {
          const audio = new Audio(blobUrl);
          audioRef.current = audio;
          audio.onended = () => {
            audioRef.current = null;
            URL.revokeObjectURL(blobUrl);
            resolve();
          };
          audio.onerror = () => {
            audioRef.current = null;
            URL.revokeObjectURL(blobUrl);
            resolve();
          };
          audio.play().catch((err) => {
            console.error("🔊 Audio play failed:", err);
            audioRef.current = null;
            URL.revokeObjectURL(blobUrl);
            resolve();
          });
        });
      }
    } catch (e) {
      console.error("OpenAI TTS error:", e);
    }
    setIsSpeaking(false);
  }

  // ---- Helper: execute an action from AI response ----
  function doAction(action) {
    if (!action) return;
    const p = $.current;
    switch (action.type) {
      case "next":
        p.onNextStep?.();
        break;
      case "prev":
        p.onPrevStep?.();
        break;
      case "goto":
        if (action.step > 0) p.onGotoStep?.(action.step - 1);
        break;
      case "timer":
        if (action.minutes > 0) p.onStartTimer?.(action.minutes);
        break;
      case "stop_timer":
        p.onStopTimer?.();
        break;
      case "switch_tab":
        if (action.tab) p.onSwitchTab?.(action.tab);
        break;
      default:
        break;
    }
  }

  // ---- Helper: kill current recognition ----
  function killRecognition() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
  }

  // ---- Process voice input via OpenAI ----
  // Stored in a ref so startListening's onresult always calls the latest version
  const processRef = useRef(null);
  processRef.current = async function processInput(text) {
    isProcessingRef.current = true;
    setIsProcessing(true);
    setStatusText("חושב...");
    killRecognition();

    try {
      const p = $.current;
      const recipeData = {
        recipeName: p.recipe.name,
        ingredients: p.ingredients,
        instructions: p.instructions,
        activeTab: p.activeTab || "instructions",
        currentStep: p.currentStep,
        servings: p.servings,
        isTimerRunning: p.isTimerRunning,
      };

      const response = await sendCookingChatMessage(text, recipeData, p.lang);
      const responseText = response.text || "לא הצלחתי להבין";

      setLastResponse(responseText);
      setStatusText("מדבר...");
      if (response.action) doAction(response.action);
      await speakText(responseText);
    } catch (error) {
      console.error("Voice chat error:", error);
      setLastResponse("שגיאה בתקשורת");
      await speakText("סליחה, הייתה שגיאה");
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
      setStatusText("");
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current && !isProcessingRef.current) {
            listenRef.current?.();
          }
        }, 1500);
      }
    }
  };

  // ---- Start listening for speech ----
  // Stored in a ref so processInput's restart always calls the latest version
  const listenRef = useRef(null);
  listenRef.current = function startListening() {
    if (isProcessingRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("זיהוי קולי לא נתמך בדפדפן זה");
      return;
    }

    killRecognition();

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = $.current.speechLang;
    recognition.maxAlternatives = 1;

    let lastText = "";
    let debounceTimer = null;
    let processed = false;

    recognition.onstart = () => {
      console.log("🎤 Recognition started");
      setStatusText("מקשיב...");
    };

    recognition.onresult = (event) => {
      if (processed) return;
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.trim();
      if (!text) return;

      // If final, process immediately
      if (event.results[last].isFinal) {
        processed = true;
        if (debounceTimer) clearTimeout(debounceTimer);
        try {
          recognition.onend = null;
          recognition.stop();
        } catch (e) {
          /* */
        }
        recognitionRef.current = null;
        setStatusText(`"${text}"`);
        processRef.current?.(text);
        return;
      }

      // Interim: show text and debounce - process after 1.5s of no new results
      lastText = text;
      setStatusText(`"${text}"...`);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (processed) return;
        processed = true;
        if (lastText && isActiveRef.current && !isProcessingRef.current) {
          try {
            recognition.onend = null;
            recognition.stop();
          } catch (e) {
            /* */
          }
          recognitionRef.current = null;
          setStatusText(`"${lastText}"`);
          processRef.current?.(lastText);
        }
      }, 1500);
    };

    recognition.onend = () => {
      if (isActiveRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (isActiveRef.current && !isProcessingRef.current) {
            listenRef.current?.();
          }
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      console.error("🎤 Voice chat error:", event.error);
      if (event.error === "not-allowed") {
        alert("יש לאפשר גישה למיקרופון");
        setIsActive(false);
        isActiveRef.current = false;
        return;
      }
      if (event.error === "no-speech") {
        console.log("🎤 No speech detected, will restart");
        return;
      }
      if (event.error === "aborted") return;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      console.log("🎤 Recognition.start() called successfully");
    } catch (e) {
      console.error("🎤 Failed to start recognition:", e);
      recognitionRef.current = null;
      setTimeout(() => {
        if (isActiveRef.current && !isProcessingRef.current) {
          listenRef.current?.();
        }
      }, 500);
    }
  };

  // ---- Toggle voice chat on/off ----
  function toggleVoiceChat() {
    if (isActiveRef.current) {
      isActiveRef.current = false;
      isProcessingRef.current = false;
      setIsActive(false);
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          /* */
        }
        audioSourceRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      killRecognition();
      setStatusText("");
      setLastResponse("");
    } else {
      isActiveRef.current = true;
      setIsActive(true);
      ensureAudioContext();
      listenRef.current?.();
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      window.speechSynthesis?.cancel();
      killRecognition();
    };
  }, []);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleVoiceChat();
        }}
        className={`${classes.voiceChatIcon} ${isActive ? classes.active : ""} ${isSpeaking ? classes.speaking : ""}`}
        title={isActive ? "עצור צ'אט קולי" : "צ'אט קולי"}
      >
        {isActive ? <FaMicrophone /> : <FaMicrophoneSlash />}
        {/* {isActive ? <PiMicrophoneThin /> : <PiMicrophoneSlashThin />} */}
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
    </>
  );
}

export default CookingVoiceChat;
