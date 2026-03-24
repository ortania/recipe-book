import { createContext, useContext } from "react";
export const RecipesViewContext = createContext(null);
export const useRecipesView = () => useContext(RecipesViewContext);
