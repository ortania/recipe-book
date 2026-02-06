import { Composition } from "remotion";
import { CookbookPromo } from "./components/CookbookPromo/index.js";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CookbookPromo"
        component={CookbookPromo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
