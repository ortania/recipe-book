import {
  FaMicrophone,
  FaLink,
  FaCopy,
  FaFire,
  FaFolderOpen,
  FaUtensils,
} from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { TbScale } from "react-icons/tb";

const FEATURES = [
  {
    key: "smartChat",
    desc: "smartChatDesc",
    icon: FaMicrophone,
    color: "#0066cc",
  },
  {
    key: "cookingMode",
    desc: "cookingModeDesc",
    icon: FaUtensils,
    color: "#c62828",
  },
  {
    key: "importMethods",
    desc: "importMethodsDesc",
    icon: FaLink,
    color: "#7c3aed",
  },
  { key: "nutrition", desc: "nutritionDesc", icon: FaFire, color: "#e65100" },
  {
    key: "copyRecipes",
    desc: "copyRecipesDesc",
    icon: FaCopy,
    color: "#2e7d32",
  },
  {
    key: "organize",
    desc: "organizeDesc",
    icon: FaFolderOpen,
    color: "#0277bd",
  },
  {
    key: "searchFilter",
    desc: "searchFilterDesc",
    icon: FaSearch,
    color: "#6366f1",
  },
  {
    key: "servingsCalc",
    desc: "servingsCalcDesc",
    icon: TbScale,
    color: "#0891b2",
  },
  {
    key: "mealPlanner",
    desc: "mealPlannerDesc",
    icon: FaUtensils,
    color: "#f59e0b",
  },
];

export default FEATURES;
