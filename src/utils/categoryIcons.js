import {
  MdRestaurant,
  MdCake,
  MdIcecream,
  MdLocalCafe,
  MdLocalPizza,
  MdOutlineRamenDining,
  MdOutlineBakeryDining,
  MdOutlineSetMeal,
  MdOutlineSoupKitchen,
  MdOutlineBrunchDining,
  MdOutlineLocalFireDepartment,
  MdOutlineEggAlt,
  MdOutlineFlatware,
  MdOutlineKebabDining,
  MdOutlineLunchDining,
  MdOutlineEmojiFoodBeverage,
  MdOutlineBlender,
  MdOutlineLocalDining,
} from "react-icons/md";
import {
  GiCupcake,
  GiCookingPot,
  GiFruitBowl,
  GiChopsticks,
  GiWheat,
  GiAvocado,
  GiMeat,
  GiCookie,
  GiNoodles,
  GiSushis,
} from "react-icons/gi";
import {
  LuSalad,
  LuLeaf,
  LuFlame,
  LuClock,
  LuStar,
  LuHeart,
  LuSnowflake,
  LuSun,
} from "react-icons/lu";
import { PiBowlFood, PiCoffee } from "react-icons/pi";
import { TbGrill } from "react-icons/tb";

export const CATEGORY_ICONS = [
  { id: "restaurant", icon: MdRestaurant },
  { id: "flatware", icon: MdOutlineFlatware },
  { id: "bakery", icon: MdOutlineBakeryDining },
  { id: "cake", icon: MdCake },
  { id: "cupcake", icon: GiCupcake },
  { id: "cookie", icon: GiCookie },
  { id: "icecream", icon: MdIcecream },
  { id: "salad", icon: LuSalad },
  { id: "soup", icon: MdOutlineSoupKitchen },
  { id: "pizza", icon: MdLocalPizza },
  { id: "ramen", icon: MdOutlineRamenDining },
  { id: "noodles", icon: GiNoodles },
  { id: "sushi", icon: GiSushis },
  { id: "setMeal", icon: MdOutlineSetMeal },
  { id: "kebab", icon: MdOutlineKebabDining },
  { id: "lunch", icon: MdOutlineLunchDining },
  { id: "brunch", icon: MdOutlineBrunchDining },
  { id: "egg", icon: MdOutlineEggAlt },
  { id: "grill", icon: TbGrill },
  { id: "meat", icon: GiMeat },
  { id: "cookingPot", icon: GiCookingPot },
  { id: "blender", icon: MdOutlineBlender },
  { id: "bowlFood", icon: PiBowlFood },
  { id: "fruitBowl", icon: GiFruitBowl },
  { id: "avocado", icon: GiAvocado },
  { id: "leaf", icon: LuLeaf },
  { id: "wheat", icon: GiWheat },
  { id: "chopsticks", icon: GiChopsticks },
  { id: "cafe", icon: MdLocalCafe },
  { id: "coffee", icon: PiCoffee },
  { id: "tea", icon: MdOutlineEmojiFoodBeverage },
  { id: "fire", icon: MdOutlineLocalFireDepartment },
  { id: "flame", icon: LuFlame },
  { id: "clock", icon: LuClock },
  { id: "heart", icon: LuHeart },
  { id: "star", icon: LuStar },
  { id: "snowflake", icon: LuSnowflake },
  { id: "sun", icon: LuSun },
  { id: "dining", icon: MdOutlineLocalDining },
];

export const DEFAULT_ICON_ID = "restaurant";

export function getCategoryIcon(iconId) {
  const found = CATEGORY_ICONS.find((i) => i.id === iconId);
  return found ? found.icon : CATEGORY_ICONS[0].icon;
}
