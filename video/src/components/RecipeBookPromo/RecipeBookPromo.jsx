import {
  AbsoluteFill,
  Series,
  Audio,
  interpolate,
  useCurrentFrame,
} from "remotion";
import backgroundMusic from "../../assets/background-music.mp3";
import { IntroScene } from "../scenes/IntroScene/index.js";
import { MarketingScene } from "../scenes/MarketingScene/index.js";
import { SceneIntroSlide } from "../scenes/SceneIntroSlide/index.js";
import { AuthScene } from "../scenes/AuthScene/index.js";
import { CategoryScene } from "../scenes/CategoryScene/index.js";
import { RecipeDetailsScene } from "../scenes/RecipeDetailsScene/index.js";
import { RecipeManagementScene } from "../scenes/RecipeManagementScene/index.js";
import { CookingModeScene } from "../scenes/CookingModeScene/index.js";
import { FavoritesScene } from "../scenes/FavoritesScene/index.js";
import { SearchScene } from "../scenes/SearchScene/index.js";
import { FeaturesScene } from "../scenes/FeaturesScene/index.js";
import { TechStackScene } from "../scenes/TechStackScene/index.js";
import { OutroScene } from "../scenes/OutroScene/index.js";

// Flow: Intro → Marketing → [Intro slide → Demo] × N → TechStack → Outro
// Intro slides: 150 frames each (~5s) for breathing room
// Total: 340 + 600 + (150+380) + (150+440) + (150+450) + (150+420) + (150+410) + (150+350) + (150+350) + (150+350) + 320 + 380 = 6670 frames ≈ 222s @ 30fps
export const RecipeBookPromo = () => {
  const frame = useCurrentFrame();
  // Fade music in over first 2s, fade out over last 3s
  const musicVolume = interpolate(
    frame,
    [0, 60, 6570, 6670],
    [0, 0.25, 0.25, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#f5f7fa" }}>
      <Audio src={backgroundMusic} volume={musicVolume} loop />
      <Series>
        {/* 1. Brand intro */}
        <Series.Sequence durationInFrames={340}>
          <IntroScene />
        </Series.Sequence>

        {/* 2. Marketing pitch - WHY use Recipe Book? */}
        <Series.Sequence durationInFrames={600}>
          <MarketingScene />
        </Series.Sequence>

        {/* 3a. Intro: Secure Login */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="🔐"
            title="Secure Login"
            subtitle="Sign in with Google or email to access your personal recipe collection"
            features={[
              { icon: "🔑", text: "Google Sign-In" },
              { icon: "📧", text: "Email & Password" },
            ]}
          />
        </Series.Sequence>
        {/* 3b. Auth demo */}
        <Series.Sequence durationInFrames={380}>
          <AuthScene />
        </Series.Sequence>

        {/* 4a. Intro: Categories & Recipes */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="📚"
            title="Organize Your Recipes"
            subtitle="Browse, categorize, search, filter and sort your entire recipe collection"
            features={[
              { icon: "📋", text: "Categories" },
              { icon: "🔍", text: "Search" },
              { icon: "🔄", text: "Filter & Sort" },
            ]}
          />
        </Series.Sequence>
        {/* 4b. Categories demo */}
        <Series.Sequence durationInFrames={440}>
          <CategoryScene />
        </Series.Sequence>

        {/* 5a. Intro: Recipe Details */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="📖"
            title="Full Recipe View"
            subtitle="See every detail — ingredients, instructions, notes, ratings, and more"
            features={[
              { icon: "✅", text: "Checkable Steps" },
              { icon: "📝", text: "Notes" },
              { icon: "⭐", text: "Ratings" },
            ]}
          />
        </Series.Sequence>
        {/* 5b. Recipe details demo */}
        <Series.Sequence durationInFrames={450}>
          <RecipeDetailsScene />
        </Series.Sequence>

        {/* 6a. Intro: Add & Edit Recipes */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="✏️"
            title="Add & Edit Recipes"
            subtitle="Create new recipes or import them from any website with a single URL"
            features={[
              { icon: "➕", text: "Add New" },
              { icon: "🌐", text: "Import from URL" },
              { icon: "📸", text: "Photo Upload" },
            ]}
          />
        </Series.Sequence>
        {/* 6b. Recipe management demo */}
        <Series.Sequence durationInFrames={420}>
          <RecipeManagementScene />
        </Series.Sequence>

        {/* 7a. Intro: Cooking Mode */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="👨‍🍳"
            title="Hands-Free Cooking"
            subtitle="Step-by-step cooking mode with voice commands and timers"
            features={[
              { icon: "🎤", text: "Voice Control" },
              { icon: "⏱️", text: "Built-in Timer" },
              { icon: "👆", text: "Large Buttons" },
            ]}
          />
        </Series.Sequence>
        {/* 7b. Cooking mode demo */}
        <Series.Sequence durationInFrames={410}>
          <CookingModeScene />
        </Series.Sequence>

        {/* 8a. Intro: Favorites */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="⭐"
            title="Your Favorites"
            subtitle="Mark your best recipes and access them instantly"
            features={[
              { icon: "💛", text: "One-Tap Favorite" },
              { icon: "📌", text: "Quick Access" },
            ]}
          />
        </Series.Sequence>
        {/* 8b. Favorites demo */}
        <Series.Sequence durationInFrames={350}>
          <FavoritesScene />
        </Series.Sequence>

        {/* 9a. Intro: AI Chat */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="🤖"
            title="AI Recipe Assistant"
            subtitle="Ask questions about cooking, get recipe suggestions, and more"
            features={[
              { icon: "💬", text: "Natural Language" },
              { icon: "🧠", text: "Smart Answers" },
            ]}
          />
        </Series.Sequence>
        {/* 9b. AI Chat demo */}
        <Series.Sequence durationInFrames={350}>
          <SearchScene />
        </Series.Sequence>

        {/* 10a. Intro: Conversion Tables */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntroSlide
            icon="📊"
            title="Conversion Tables"
            subtitle="Quickly convert between measurement units while cooking"
            features={[
              { icon: "⚖️", text: "Weight" },
              { icon: "🥄", text: "Volume" },
              { icon: "🌡️", text: "Temperature" },
            ]}
          />
        </Series.Sequence>
        {/* 10b. Conversion tables demo */}
        <Series.Sequence durationInFrames={350}>
          <FeaturesScene />
        </Series.Sequence>

        {/* 11. Tech stack */}
        <Series.Sequence durationInFrames={320}>
          <TechStackScene />
        </Series.Sequence>

        {/* 12. Outro CTA */}
        <Series.Sequence durationInFrames={380}>
          <OutroScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
