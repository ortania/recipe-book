import { createContext, useContext } from "react";
export const RecipeDetailsContext = createContext(null);
export const useRecipeDetails = () => useContext(RecipeDetailsContext);
