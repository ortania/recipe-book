import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const TimerContext = createContext();

export const useTimers = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimers must be used within a TimerProvider");
  }
  return context;
};

let nextId = 1;

export const TimerProvider = ({ children }) => {
  const [timers, setTimers] = useState([]);
  const intervalsRef = useRef({});
  const pendingAnnouncements = useRef([]);

  const tick = useCallback(() => {
    setTimers((prev) => {
      const now = Date.now();
      let changed = false;
      const updated = prev.map((t) => {
        if (!t.running) return t;
        const remaining = Math.max(0, Math.round((t.endTime - now) / 1000));
        if (remaining !== t.remaining) {
          changed = true;
          if (remaining <= 0) {
            pendingAnnouncements.current.push(t.label);
            return { ...t, remaining: 0, running: false };
          }
          return { ...t, remaining };
        }
        return t;
      });
      return changed ? updated : prev;
    });

    if (pendingAnnouncements.current.length > 0) {
      const labels = [...pendingAnnouncements.current];
      pendingAnnouncements.current = [];
      labels.forEach((label) => announceFinished(label));
    }
  }, []);

  const hasAnyRunning = timers.some((t) => t.running);

  useEffect(() => {
    if (!hasAnyRunning) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasAnyRunning, tick]);

  const addTimer = useCallback((minutes, label = "", { silent = false } = {}) => {
    const id = nextId++;
    const totalSeconds = minutes * 60;
    const endTime = Date.now() + totalSeconds * 1000;
    setTimers((prev) => [
      ...prev,
      { id, label, remaining: totalSeconds, endTime, running: true },
    ]);

    if (!silent) {
      try {
        const isHebrew = label && /[\u0590-\u05FF]/.test(label);
        const text = isHebrew
          ? `טיימר הופעל ל-${minutes} דקות${label ? `, ${label}` : ""}`
          : `Timer started for ${minutes} minutes${label ? `, ${label}` : ""}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isHebrew ? "he-IL" : "en-US";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }

    return id;
  }, []);

  const stopTimer = useCallback((id) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, running: false } : t)),
    );
  }, []);

  const removeTimer = useCallback((id) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const stopAll = useCallback(() => {
    setTimers((prev) => prev.map((t) => ({ ...t, running: false })));
  }, []);

  const clearFinished = useCallback(() => {
    setTimers((prev) => prev.filter((t) => t.running || t.remaining > 0));
  }, []);

  const activeTimers = timers.filter((t) => t.running);
  const hasRunning = activeTimers.length > 0;

  return (
    <TimerContext.Provider
      value={{
        timers,
        activeTimers,
        hasRunning,
        addTimer,
        stopTimer,
        removeTimer,
        stopAll,
        clearFinished,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

function playAlarmBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (startTime, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      playTone(now + i * 0.35, 880, 0.2);
    }
    setTimeout(() => ctx.close(), 3000);
  } catch {}
}

async function speakViaCloud(text) {
  try {
    const res = await fetch(
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
    if (!res.ok) return;
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch {}
}

function announceFinished(label) {
  playAlarmBeep();

  try {
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  } catch {}

  // Speak after beeps finish (~2s for 5 beeps)
  setTimeout(() => {
    const isHebrew = label && /[\u0590-\u05FF]/.test(label);
    const text = label
      ? isHebrew ? `טיימר הסתיים: ${label}` : `Timer finished: ${label}`
      : "Timer finished";
    speakViaCloud(text);
  }, 2000);
}

export default TimerContext;
