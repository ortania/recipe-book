import { createContext, useContext } from "react";
export const SearchOverlayContext = createContext(null);
export const useSearchOverlay = () => useContext(SearchOverlayContext);
