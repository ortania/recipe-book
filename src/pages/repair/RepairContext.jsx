import { createContext, useContext } from "react";
export const RepairContext = createContext(null);
export const useRepair = () => useContext(RepairContext);
