import { createContext, useContext } from "react";

export const WizardContext = createContext(null);

export const useWizard = () => useContext(WizardContext);
