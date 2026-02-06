import { Composition } from "remotion";
import { RecipeBookPromo } from "./components/RecipeBookPromo/index.js";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="RecipeBookPromo"
        component={RecipeBookPromo}
        durationInFrames={6670}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
