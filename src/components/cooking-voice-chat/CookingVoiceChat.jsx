import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { sendCookingChatMessage } from "../../services/openai";
import { useLanguage, useRadio } from "../../context";
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
  radioRef,
}) {
  const { language } = useLanguage();
  const { showRadio, openRadio, minimizeRadio } = useRadio();
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
  const intentionalStopRef = useRef(false);
  const ttsEndTimeRef = useRef(0);
  const stepOffsetRef = useRef(0);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioSourceRef = useRef(null);

  // Reset step offset when React state catches up
  useEffect(() => {
    stepOffsetRef.current = 0;
  }, [currentStep]);

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
    radioRef,
    showRadio,
    openRadio,
    minimizeRadio,
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

  // ---- Helper: speak text aloud using OpenAI TTS via Cloud Function ----
  async function speakText(text) {
    if (!text) return;
    setIsSpeaking(true);
    // Cancel any browser SpeechSynthesis (e.g. timer announcements) to avoid overlap
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    // Duck radio while speaking
    $.current.radioRef?.current?.duckVolume();
    try {
      const response = await fetch(
        "https://us-central1-recipe-book-82d57.cloudfunctions.net/openaiTts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: "nova",
            response_format: "mp3",
          }),
        },
      );
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
    // Restore radio volume after speaking
    $.current.radioRef?.current?.restoreVolume();
    ttsEndTimeRef.current = Date.now();
    setIsSpeaking(false);
  }

  // ---- Helper: kill current recognition ----
  function killRecognition() {
    if (recognitionRef.current) {
      intentionalStopRef.current = true;
      try {
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
      const isHe = p.lang === "he" || p.lang === "mixed";
      const effectiveStep = p.currentStep + stepOffsetRef.current;
      const steps = p.instructions || [];
      const lower = text.toLowerCase().replace(/\s+/g, " ").trim();

      // ===== CLIENT-SIDE: Timer & Music (keyword-based, 100% reliable) =====
      // Regex patterns use Hebrew roots to catch all verb conjugations
      const hasTimer = /טיימר|טימר|תיימר|תימר|timer/.test(lower);
      const hasMinutes = /דקה|דקות|minute/.test(lower);
      const hasStop = /עצר|עצור|תעצר|תעצור|בטל|תבטל|כבה|תכב|הפסק|תפסיק|stop/.test(lower);
      const hasRadio = /רדיו|מוסיקה|מוזיקה|radio|music/.test(lower);
      const hasVolUp = /הגבר|תגביר|גביר|louder/.test(lower);
      const hasVolDown = /הנמך|תנמיך|נמיך|נמוך|quieter/.test(lower);
      const hasPlay = /תפעיל|הפעיל|הפעל|להפעיל|play/.test(lower);
      const hasMute = /תשתיק|השתק|שתיקה|שתוק|mute/.test(lower);

      // Any mention of timer keywords OR minutes (דקה/דקות) = timer command
      const isTimerCommand = hasTimer || hasMinutes;

      console.log(
        `🎤 "${lower}" | timer=${hasTimer} mins=${hasMinutes} stop=${hasStop} isTimer=${isTimerCommand}`,
      );

      let localResult = null;

      // TIMER: stop
      if (isTimerCommand && hasStop) {
        p.onStopTimer?.();
        localResult = isHe ? "עוצרת את כל הטיימרים" : "All timers stopped";
      }
      // TIMER: start
      else if (isTimerCommand && !hasStop) {
        const heNums = [
          ["חצי", 0.5],
          ["אחת", 1],
          ["שתיים", 2],
          ["שתי", 2],
          ["שניים", 2],
          ["שלוש", 3],
          ["ארבע", 4],
          ["חמש עשרה", 15],
          ["חמש", 5],
          ["שש", 6],
          ["שבע", 7],
          ["שמונה", 8],
          ["תשע", 9],
          ["עשרים", 20],
          ["שלושים", 30],
          ["עשר", 10],
        ];
        let mins = 0;
        const digitMatch = lower.match(/(\d+)/);
        if (digitMatch) mins = parseInt(digitMatch[1]);
        if (!mins) {
          for (const [word, val] of heNums) {
            if (lower.includes(word)) {
              mins = val;
              break;
            }
          }
        }
        if (!mins && hasMinutes) mins = 1;
        if (mins > 0) {
          // silent: true → suppress SpeechSynthesis in TimerContext (we have our own TTS)
          p.onStartTimer?.(mins, { silent: true });
          localResult = isHe
            ? `מפעילה טיימר ל-${mins} דקות`
            : `Timer set for ${mins} minutes`;
        } else {
          localResult = isHe
            ? "לכמה דקות להפעיל טיימר?"
            : "How many minutes for the timer?";
        }
      }
      // VOLUME
      else if (hasVolUp) {
        p.radioRef?.current?.volumeUp();
        localResult = isHe ? "מגבירה" : "Louder";
      } else if (hasVolDown) {
        p.radioRef?.current?.volumeDown();
        localResult = isHe ? "מנמיכה" : "Quieter";
      }
      // MUTE / RADIO
      else if (hasMute) {
        p.radioRef?.current?.pause();
        localResult = isHe ? "משתיקה" : "Muted";
      } else if (hasStop && hasRadio) {
        p.radioRef?.current?.pause();
        localResult = isHe ? "עוצרת רדיו" : "Radio stopped";
      } else if (hasRadio) {
        if (!p.showRadio) {
          p.openRadio();
          p.minimizeRadio();
        }
        p.radioRef?.current?.play();
        localResult = isHe ? "מפעילה רדיו" : "Playing radio";
      }

      if (localResult) {
        setLastResponse(localResult);
        setStatusText("מדבר...");
        await speakText(localResult);
        return;
      }

      // ===== AI: Steps, ingredients, cooking questions =====
      const recipeData = {
        recipeName: p.recipe.name,
        ingredients: p.ingredients,
        instructions: p.instructions,
        activeTab: p.activeTab || "instructions",
        currentStep: effectiveStep,
        servings: p.servings,
        isTimerRunning: p.isTimerRunning,
      };

      const response = await sendCookingChatMessage(text, recipeData, p.lang);
      let responseText = response.text || "לא הצלחתי להבין";

      if (response.action) {
        const act = response.action;
        if (act.type === "next") {
          p.onNextStep?.();
          stepOffsetRef.current++;
          const nextIdx = effectiveStep + 1;
          if (nextIdx < steps.length) {
            responseText = isHe
              ? `שלב ${nextIdx + 1}: ${steps[nextIdx]}`
              : `Step ${nextIdx + 1}: ${steps[nextIdx]}`;
          }
        } else if (act.type === "prev") {
          p.onPrevStep?.();
          if (stepOffsetRef.current > 0) stepOffsetRef.current--;
          const prevIdx = effectiveStep - 1;
          if (prevIdx >= 0) {
            responseText = isHe
              ? `שלב ${prevIdx + 1}: ${steps[prevIdx]}`
              : `Step ${prevIdx + 1}: ${steps[prevIdx]}`;
          }
        } else if (act.type === "goto" && act.step > 0) {
          const idx = act.step - 1;
          p.onGotoStep?.(idx);
          stepOffsetRef.current = 0;
          if (idx >= 0 && idx < steps.length) {
            responseText = isHe
              ? `שלב ${act.step}: ${steps[idx]}`
              : `Step ${act.step}: ${steps[idx]}`;
          }
        } else if (act.type === "read_step") {
          responseText = isHe
            ? `שלב ${effectiveStep + 1}: ${steps[effectiveStep] || ""}`
            : `Step ${effectiveStep + 1}: ${steps[effectiveStep] || ""}`;
        }
      }

      setLastResponse(responseText);
      setStatusText("מדבר...");
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
        const elapsed = Date.now() - ttsEndTimeRef.current;
        const delay = Math.max(800, 1200 - elapsed);
        setTimeout(() => {
          if (isActiveRef.current && !isProcessingRef.current) {
            listenRef.current?.();
          }
        }, delay);
      }
    }
  };

  // ---- Start listening for speech ----
  // Uses continuous mode to avoid repeated start-beeps and audio-focus grabs on mobile
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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = $.current.speechLang;
    recognition.maxAlternatives = 1;

    let debounceTimer = null;
    let processedUpTo = -1;

    recognition.onstart = () => {
      intentionalStopRef.current = false;
      setStatusText("מקשיב...");
    };

    recognition.onresult = (event) => {
      if (isProcessingRef.current) return;
      if (Date.now() - ttsEndTimeRef.current < 1500) return;

      const lastIdx = event.results.length - 1;
      // Display text: use last segment only (avoids visual duplication)
      const displayText = event.results[lastIdx][0].transcript.trim();
      if (!displayText || displayText.length < 2) return;

      // Processing text: build from all unprocessed segments, dedup overlapping
      let segments = [];
      for (let i = processedUpTo + 1; i < event.results.length; i++) {
        segments.push(event.results[i][0].transcript.trim());
      }
      // Dedup: if a later segment starts with the same text as an earlier one, keep the longer
      let fullText = segments[0] || "";
      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.startsWith(fullText)) {
          fullText = seg;
        } else if (!fullText.includes(seg)) {
          fullText = fullText + " " + seg;
        }
      }
      fullText = fullText.replace(/\s+/g, " ").trim();

      if (debounceTimer) clearTimeout(debounceTimer);

      const isFinal = event.results[lastIdx].isFinal;
      if (isFinal) {
        setStatusText(`"${displayText}"`);
        debounceTimer = setTimeout(() => {
          if (isProcessingRef.current) return;
          processedUpTo = lastIdx;
          killRecognition();
          processRef.current?.(fullText);
        }, 500);
      } else {
        setStatusText(`"${displayText}"...`);
        debounceTimer = setTimeout(() => {
          if (isProcessingRef.current) return;
          if (fullText.length >= 2 && isActiveRef.current) {
            processedUpTo = lastIdx;
            killRecognition();
            setStatusText(`"${displayText}"`);
            processRef.current?.(fullText);
          }
        }, 3000);
      }
    };

    recognition.onend = () => {
      if (intentionalStopRef.current) {
        intentionalStopRef.current = false;
        return;
      }
      if (isActiveRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (isActiveRef.current && !isProcessingRef.current) {
            listenRef.current?.();
          }
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        alert("יש לאפשר גישה למיקרופון");
        setIsActive(false);
        isActiveRef.current = false;
        return;
      }
      if (event.error === "no-speech" || event.error === "aborted") return;
    };

    recognitionRef.current = recognition;
    intentionalStopRef.current = false;
    try {
      recognition.start();
    } catch (e) {
      recognitionRef.current = null;
      setTimeout(() => {
        if (isActiveRef.current && !isProcessingRef.current) {
          listenRef.current?.();
        }
      }, 1500);
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
      $.current.radioRef?.current?.unmuteForMic();
    } else {
      isActiveRef.current = true;
      setIsActive(true);
      ensureAudioContext();
      $.current.radioRef?.current?.softDuckVolume();
      listenRef.current?.();
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      window.speechSynthesis?.cancel();
      killRecognition();
      $.current.radioRef?.current?.unmuteForMic();
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
        {isActive ? <Mic size={20} /> : <MicOff size={20} />}
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
