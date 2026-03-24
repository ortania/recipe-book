import { RecipeBookIcon } from "../../components/icons/RecipeBookIcon";
import { SaveBookIcon } from "../../components/icons/SaveBookIcon";
import {
  SearchIcon,
  CookIcon,
  ChatIcon,
  NutritionIcon,
  ShoppingIcon,
  ShareIcon,
} from "./OnboardingIcons";

const ONBOARDING_SCREENS = [
  {
    key: "welcome",
    icon: <RecipeBookIcon />,
    titleKey: "welcomeTitle",
    subtitleKey: "welcomeSubtitle",
  },
  {
    key: "save",
    icon: <SaveBookIcon />,
    titleKey: "saveTitle",
    subtitleKey: "saveSubtitle",
    tipLabel: "howToStart",
    tipKey: "saveTip",
  },
  {
    key: "search",
    icon: <SearchIcon />,
    titleKey: "searchTitle",
    subtitleKey: "searchSubtitle",
    tipLabel: "howToUse",
    tipKey: "searchTip",
  },
  {
    key: "cook",
    icon: <CookIcon />,
    titleKey: "cookTitle",
    subtitleKey: "cookSubtitle",
    tipLabel: "howToActivate",
    tipKey: "cookTip",
  },
  {
    key: "chat",
    icon: <ChatIcon />,
    titleKey: "chatTitle",
    subtitleKey: "chatSubtitle",
    tipLabel: "howToActivate",
    tipKey: "chatTip",
  },
  {
    key: "nutrition",
    icon: <NutritionIcon />,
    titleKey: "nutritionTitle",
    subtitleKey: "nutritionSubtitle",
    tipLabel: "howToActivate",
    tipKey: "nutritionTip",
  },
  {
    key: "plan",
    icon: <ShoppingIcon />,
    titleKey: "planTitle",
    subtitleKey: "planSubtitle",
    tipLabel: "howToActivate",
    tipKey: "planTip",
  },
  {
    key: "share",
    icon: <ShareIcon />,
    titleKey: "shareTitle",
    subtitleKey: "shareSubtitle",
    tipLabel: "howToActivate",
    tipKey: "shareTip",
  },
];

export default ONBOARDING_SCREENS;
