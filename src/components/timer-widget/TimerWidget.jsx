import { useState, useRef, useCallback } from "react";
import {
  Timer,
  X,
  ChevronUp,
  ChevronDown,
  Square,
  GripHorizontal,
} from "lucide-react";
import { useTimers } from "../../context/TimerContext";
import { useLanguage } from "../../context";
import classes from "./timer-widget.module.css";

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function TimerWidget() {
  const { timers, stopTimer, removeTimer, clearFinished } = useTimers();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const widgetRef = useRef(null);
  const dragState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });
  const [pos, setPos] = useState(null);

  const onPointerDown = useCallback((e) => {
    if (e.target.closest("button")) return;
    const el = widgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({
      x: dragState.current.origX + dx,
      y: dragState.current.origY + dy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current.dragging = false;
  }, []);

  if (timers.length === 0) return null;

  const running = timers.filter((t) => t.running);
  const finished = timers.filter((t) => !t.running && t.remaining <= 0);
  const stopped = timers.filter((t) => !t.running && t.remaining > 0);

  const topTimer = running[0] || finished[0] || stopped[0];

  const posStyle = pos
    ? {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        bottom: "auto",
        transform: "none",
      }
    : {};

  return (
    <div
      ref={widgetRef}
      className={classes.widget}
      style={posStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className={classes.header}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <GripHorizontal size={14} className={classes.dragHandle} />
        <div className={classes.headerLeft}>
          <Timer size={16} />
          <span className={classes.headerLabel}>
            {topTimer.label || t("recipes", "timer")}
          </span>
          <span
            className={`${classes.headerTime} ${
              topTimer.remaining <= 0 && !topTimer.running
                ? classes.finished
                : ""
            }`}
          >
            {topTimer.remaining <= 0 && !topTimer.running
              ? t("recipes", "timerDone")
              : formatTime(topTimer.remaining)}
          </span>
          {timers.length > 1 && (
            <span className={classes.badge}>+{timers.length - 1}</span>
          )}
        </div>
        {topTimer.running ? (
          <button
            className={classes.stopBtn}
            onClick={(e) => {
              e.stopPropagation();
              stopTimer(topTimer.id);
            }}
            title={t("recipes", "stopTimer")}
          >
            <Square size={12} fill="currentColor" />
          </button>
        ) : (
          <span></span>
        )}
        <button className={classes.expandBtn}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className={classes.list}>
          {timers.map((timer) => (
            <div
              key={timer.id}
              className={`${classes.item} ${
                timer.remaining <= 0 && !timer.running ? classes.itemDone : ""
              }`}
            >
              <div className={classes.itemInfo}>
                <span className={classes.itemLabel}>
                  {timer.label || t("recipes", "timer")}
                </span>
                <span
                  className={`${classes.itemTime} ${
                    timer.remaining <= 0 && !timer.running
                      ? classes.finished
                      : ""
                  }`}
                >
                  {timer.remaining <= 0 && !timer.running
                    ? t("recipes", "timerDone")
                    : formatTime(timer.remaining)}
                </span>
              </div>
              <div className={classes.itemActions}>
                {timer.running ? (
                  <button
                    className={classes.stopBtn}
                    onClick={() => stopTimer(timer.id)}
                    title={t("recipes", "stopTimer")}
                  >
                    <Square size={12} fill="currentColor" />
                  </button>
                ) : (
                  <span></span>
                )}
                <button
                  className={classes.removeBtn}
                  onClick={() => removeTimer(timer.id)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
          {finished.length > 0 && (
            <button className={classes.clearBtn} onClick={clearFinished}>
              {t("recipes", "clearFinished")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
