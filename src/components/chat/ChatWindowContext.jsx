import { createContext, useContext } from "react";
export const ChatWindowContext = createContext(null);
export const useChatWindow = () => useContext(ChatWindowContext);
