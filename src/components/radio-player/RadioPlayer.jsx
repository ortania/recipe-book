import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { IoPlay, IoPause, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { MdSkipNext, MdSkipPrevious, MdClose, MdDragIndicator } from "react-icons/md";
import { useLanguage } from "../../context";
import STATIONS from "./stations";
import classes from "./radio-player.module.css";

const VOLUME_STORAGE_KEY = "radioPlayerVolume";
const STATION_STORAGE_KEY = "radioPlayerStation";

let _globalAudio = null;
function getGlobalAudio() {
  if (!_globalAudio) {
    _globalAudio = new Audio();
    _globalAudio.preload = "none";
  }
  return _globalAudio;
}

function RadioPlayer({ open, onClose }, ref) {
  const { t, language } = useLanguage();
  const audioRef = useRef(getGlobalAudio());
  const fallbackHandlerRef = useRef(null);
  const wantPlayingRef = useRef(false);
  const micMutedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [stationIndex, setStationIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(STATION_STORAGE_KEY);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < STATIONS.length) return idx;
      }
    } catch {}
    return 0;
  });
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (saved !== null) return parseFloat(saved);
    } catch {}
    return 0.07;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const station = STATIONS[stationIndex];

  // --- drag state ---
  const panelRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onDragStart = useCallback((clientX, clientY) => {
    dragState.current.dragging = true;
    dragState.current.startX = clientX - pos.x;
    dragState.current.startY = clientY - pos.y;
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current.dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({
        x: clientX - dragState.current.startX,
        y: clientY - dragState.current.startY,
      });
    };
    const onEnd = () => { dragState.current.dragging = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  // Reset position when panel is closed/opened
  useEffect(() => {
    if (open) setPos({ x: 0, y: 0 });
  }, [open]);

  const removeFallbackHandler = useCallback(() => {
    if (fallbackHandlerRef.current) {
      try { getGlobalAudio().removeEventListener("error", fallbackHandlerRef.current); } catch {}
      fallbackHandlerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const audio = getGlobalAudio();
    audioRef.current = audio;

    const onPlaying = () => { setLoading(false); setError(false); };
    const onWaiting = () => setLoading(true);
    const onError = () => { setLoading(false); setError(true); setIsPlaying(false); wantPlayingRef.current = false; };

    let resumeTimer = null;
    const onPause = () => {
      if (wantPlayingRef.current && !micMutedRef.current && audio.src) {
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
          if (wantPlayingRef.current && !micMutedRef.current && audio.src) {
            audio.play().catch(() => {});
          }
        }, 400);
      }
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);
    audio.addEventListener("pause", onPause);

    return () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("pause", onPause);
      removeFallbackHandler();
      wantPlayingRef.current = false;
      audio.pause();
      audio.src = "";
    };
  }, [removeFallbackHandler]);

  useEffect(() => {
    if (audioRef.current && !micMutedRef.current) audioRef.current.volume = volume;
    try { localStorage.setItem(VOLUME_STORAGE_KEY, String(volume)); } catch {}
  }, [volume]);

  useEffect(() => {
    try { localStorage.setItem(STATION_STORAGE_KEY, String(stationIndex)); } catch {}
  }, [stationIndex]);

  const play = useCallback((idx) => {
    const audio = audioRef.current;
    if (!audio) return;
    removeFallbackHandler();

    const target = idx !== undefined ? STATIONS[idx] : STATIONS[stationIndex];
    audio.pause();
    audio.src = target.url;
    audio.load();
    setLoading(true);
    setError(false);

    const tryFallback = () => {
      if (target.fallbackUrl) {
        audio.src = target.fallbackUrl;
        audio.load();
        audio.play().catch(() => {
          setError(true);
          setLoading(false);
        });
      } else {
        setError(true);
        setLoading(false);
      }
    };

    audio.play().catch(tryFallback);

    const errorHandler = () => {
      fallbackHandlerRef.current = null;
      tryFallback();
    };
    fallbackHandlerRef.current = errorHandler;
    audio.addEventListener("error", errorHandler, { once: true });

    wantPlayingRef.current = true;
    setIsPlaying(true);
  }, [stationIndex, removeFallbackHandler]);

  const pause = useCallback(() => {
    wantPlayingRef.current = false;
    removeFallbackHandler();
    const audio = getGlobalAudio();
    audio.pause();
    setIsPlaying(false);
  }, [removeFallbackHandler]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const changeStation = useCallback((direction) => {
    const newIdx =
      direction === "next"
        ? (stationIndex + 1) % STATIONS.length
        : (stationIndex - 1 + STATIONS.length) % STATIONS.length;
    setStationIndex(newIdx);
    if (isPlaying) play(newIdx);
  }, [stationIndex, isPlaying, play]);

  const selectStation = useCallback((idx) => {
    setStationIndex(idx);
    play(idx);
  }, [play]);

  const duckVolume = useCallback(() => {
    getGlobalAudio().volume = volume * 0.08;
  }, [volume]);

  const softDuckVolume = useCallback(() => {
    getGlobalAudio().volume = volume * 0.2;
  }, [volume]);

  const restoreVolume = useCallback(() => {
    if (!micMutedRef.current) getGlobalAudio().volume = volume;
  }, [volume]);

  const muteForMic = useCallback(() => {
    micMutedRef.current = true;
    getGlobalAudio().volume = 0;
  }, []);

  const unmuteForMic = useCallback(() => {
    micMutedRef.current = false;
    getGlobalAudio().volume = volume;
  }, [volume]);

  const VOLUME_STEP = 0.03;
  const volumeUp = useCallback(() => {
    setVolume((v) => Math.min(1, +(v + VOLUME_STEP).toFixed(3)));
  }, []);

  const volumeDown = useCallback(() => {
    setVolume((v) => Math.max(0, +(v - VOLUME_STEP).toFixed(3)));
  }, []);

  const selectStationByName = useCallback((name) => {
    const lower = name.toLowerCase();
    const idx = STATIONS.findIndex((s) => {
      if (s.id === lower) return true;
      if (Object.values(s.name).some((n) => n.toLowerCase() === lower)) return true;
      if (s.aliases?.some((a) => a.toLowerCase() === lower || lower.includes(a.toLowerCase()))) return true;
      return false;
    });
    if (idx >= 0) {
      setStationIndex(idx);
      play(idx);
      return true;
    }
    return false;
  }, [play]);

  useImperativeHandle(ref, () => ({
    play: () => { if (!isPlaying) play(); },
    pause,
    togglePlay,
    isPlaying: () => isPlaying,
    duckVolume,
    softDuckVolume,
    restoreVolume,
    muteForMic,
    unmuteForMic,
    volumeUp,
    volumeDown,
    changeStation,
    selectStation,
    selectStationByName,
    getStations: () => STATIONS,
  }), [isPlaying, play, pause, togglePlay, duckVolume, softDuckVolume, restoreVolume, muteForMic, unmuteForMic, volumeUp, volumeDown, changeStation, selectStation, selectStationByName]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={classes.panel}
      style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` }}
    >
      <div
        className={classes.header}
        onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
        onTouchStart={(e) => { onDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
      >
        <MdDragIndicator className={classes.dragIcon} />
        <span className={classes.title}>{t("radio", "title")}</span>
        <button className={classes.closeBtn} onClick={onClose}>
          <MdClose />
        </button>
      </div>

      <div className={classes.stationList}>
        {STATIONS.map((s, i) => (
          <button
            key={s.id}
            className={`${classes.stationBtn} ${i === stationIndex ? classes.activeStation : ""}`}
            onClick={() => selectStation(i)}
          >
            <span className={classes.stationIcon}>{s.icon}</span>
            <span className={classes.stationName}>{s.name[language] || s.name.en}</span>
          </button>
        ))}
      </div>

      <div className={classes.controls}>
        <button className={classes.controlBtn} onClick={() => changeStation("prev")}>
          <MdSkipPrevious />
        </button>
        <button
          className={`${classes.playBtn} ${isPlaying ? classes.playing : ""}`}
          onClick={togglePlay}
          disabled={loading}
        >
          {loading ? (
            <span className={classes.spinner} />
          ) : isPlaying ? (
            <IoPause />
          ) : (
            <IoPlay />
          )}
        </button>
        <button className={classes.controlBtn} onClick={() => changeStation("next")}>
          <MdSkipNext />
        </button>
      </div>

      {error && (
        <div className={classes.error}>{t("radio", "error")}</div>
      )}

      <div className={classes.volumeRow}>
        <IoVolumeMute className={classes.volumeIcon} />
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.005"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className={classes.volumeSlider}
        />
        <IoVolumeHigh className={classes.volumeIcon} />
      </div>
      <div className={classes.duckingNote}>{t("radio", "duckingNote")}</div>
    </div>
  );
}

export default forwardRef(RadioPlayer);
