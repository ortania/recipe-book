import { createContext, useContext } from "react";

export const EditRecipeContext = createContext(null);
export const useEditRecipe = () => useContext(EditRecipeContext);
