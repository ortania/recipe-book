import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../firebase/config";

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

    try { unlockAudio(); } catch {}

    if (!silent) {
      try {
        const isHebrew = label && /[\u0590-\u05FF]/.test(label);
        const text = isHebrew
          ? `טיימר הופעל ל-${minutes} דקות${label ? `, ${label}` : ""}`
          : `Timer started for ${minutes} minutes${label ? `, ${label}` : ""}`;
        speakViaCloud(text);
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

let sharedAudioCtx = null;
let _ttsAudio = null;

function getAudioContext() {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function unlockAudio() {
  const ctx = getAudioContext();
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}

  if (!_ttsAudio) {
    _ttsAudio = new Audio();
    _ttsAudio.setAttribute("playsinline", "");
  }
  try {
    _ttsAudio.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    const p = _ttsAudio.play();
    if (p) p.then(() => { _ttsAudio.pause(); _ttsAudio.currentTime = 0; _ttsAudio.src = ""; }).catch(() => {});
  } catch {}
}

async function playAlarmBeep() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
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
  } catch {
    speakNative("beep beep beep");
  }
}

function speakNative(text) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    const isHebrew = /[\u0590-\u05FF]/.test(text);
    u.lang = isHebrew ? "he-IL" : "en-US";
    u.rate = 1;
    u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

async function speakViaCloud(text) {
  let spoken = false;
  try {
    const headers = { "Content-Type": "application/json" };
    try {
      const user = auth.currentUser;
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
    } catch {}
    const res = await fetch(
      import.meta.env.VITE_CLOUD_TTS_URL,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: "nova",
          response_format: "mp3",
        }),
      },
    );
    if (!res.ok) { speakNative(text); return; }
    const buf = await res.arrayBuffer();

    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }
    try {
      const audioBuffer = await ctx.decodeAudioData(buf.slice(0));
      await new Promise((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = resolve;
        source.start(0);
      });
      spoken = true;
      return;
    } catch {}

    try {
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = _ttsAudio || new Audio();
      audio.setAttribute("playsinline", "");
      audio.src = url;
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play();
      spoken = true;
    } catch {}
  } catch {}

  if (!spoken) speakNative(text);
}

function announceFinished(label) {
  playAlarmBeep();

  try {
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  } catch {}

  setTimeout(() => {
    const isHebrew = label && /[\u0590-\u05FF]/.test(label);
    const text = label
      ? isHebrew ? `טיימר הסתיים: ${label}` : `Timer finished: ${label}`
      : "Timer finished";
    speakViaCloud(text);
  }, 2000);
}

export default TimerContext;
