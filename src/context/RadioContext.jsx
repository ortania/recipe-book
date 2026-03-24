import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

const RadioContext = createContext(null);

export function RadioProvider({ children }) {
  const [showRadio, setShowRadio] = useState(false);
  const [radioMinimized, setRadioMinimized] = useState(false);
  const radioRef = useRef(null);

  const openRadio = useCallback(() => {
    setShowRadio(true);
    setRadioMinimized(false);
  }, []);

  const closeRadio = useCallback(() => {
    setShowRadio(false);
    setRadioMinimized(false);
  }, []);

  const minimizeRadio = useCallback(() => {
    setRadioMinimized(true);
  }, []);

  const expandRadio = useCallback(() => {
    setRadioMinimized(false);
  }, []);

  const toggleRadio = useCallback(() => {
    setShowRadio((prev) => {
      if (!prev) setRadioMinimized(false);
      return !prev;
    });
  }, []);

  return (
    <RadioContext.Provider
      value={{
        radioRef,
        showRadio,
        setShowRadio,
        radioMinimized,
        setRadioMinimized,
        openRadio,
        closeRadio,
        minimizeRadio,
        expandRadio,
        toggleRadio,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used inside RadioProvider");
  return ctx;
}
