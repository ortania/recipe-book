import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import toastClasses from "./Toast.module.css";

/** Default time (ms) before `onClose` runs when `duration` is not passed. */
export const DEFAULT_TOAST_DURATION_MS = 2500;

/**
 * Centered toast in the viewport (portaled to `document.body`).
 * When `duration` > 0, calls `onClose` after that many ms (e.g. then navigate away).
 *
 * @param {boolean} open
 * @param {() => void} [onClose]
 * @param {number} [duration] — ms; 0 or omit with manual dismiss only (no auto timer)
 * @param {'success'|'error'|'neutral'} [variant]
 * @param {React.ReactNode} children
 */
function Toast({
  open,
  onClose,
  duration = DEFAULT_TOAST_DURATION_MS,
  variant = "success",
  children,
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || duration <= 0) return;
    const id = window.setTimeout(() => {
      onCloseRef.current?.();
    }, duration);
    return () => window.clearTimeout(id);
  }, [open, duration]);

  if (!open || typeof document === "undefined") return null;

  const variantClass =
    variant === "error"
      ? toastClasses.error
      : variant === "neutral"
        ? toastClasses.neutral
        : toastClasses.success;

  return createPortal(
    <div
      className={toastClasses.viewport}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        role="status"
        className={`${toastClasses.toast} ${variantClass}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Toast;
