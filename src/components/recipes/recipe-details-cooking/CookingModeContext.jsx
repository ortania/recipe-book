import { createContext, useContext } from "react";
export const CookingModeContext = createContext(null);
export const useCookingMode = () => useContext(CookingModeContext);
