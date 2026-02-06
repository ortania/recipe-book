import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const benefits = [
  {
    icon: "📱",
    title: "All Your Recipes in One Place",
    desc: "Organize, search, and access your entire recipe collection from anywhere",
    color: "#667eea",
  },
  {
    icon: "🔍",
    title: "Smart Search & Filtering",
    desc: "Find recipes by name, ingredients, prep time, or difficulty in seconds",
    color: "#4ECDC4",
  },
  {
    icon: "🌐",
    title: "Import from Any Website",
    desc: "Paste a URL and instantly import recipes from your favorite food blogs",
    color: "#FF6B6B",
  },
  {
    icon: "👨‍🍳",
    title: "Hands-Free Cooking Mode",
    desc: "Step-by-step voice-controlled cooking with built-in timers",
    color: "#45B7D1",
  },
  {
    icon: "📊",
    title: "Categories & Organization",
    desc: "Color-coded categories, favorites, and custom sorting options",
    color: "#96CEB4",
  },
  {
    icon: "🤖",
    title: "AI Recipe Assistant",
    desc: "Ask questions about cooking techniques and get instant answers",
    color: "#FFEAA7",
  },
];

export const MarketingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleScale = spring({
    frame: frame - 10,
    fps,
    from: 0.7,
    to: 1,
    config: { damping: 12, stiffness: 40 },
  });
  const titleOp = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subtitleOp = interpolate(frame, [40, 65], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [40, 65], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Gradient background rotation
  const gradAngle = interpolate(frame, [0, 500], [135, 225]);

  // Floating particles
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    x: (i * 137 + 80) % 1920,
    y: (i * 97 + 50) % 1080,
    size: 3 + (i % 4) * 2,
    speed: 0.01 + (i % 5) * 0.004,
    delay: i * 4,
  }));

  // Exit
  const exitOpacity = interpolate(frame, [570, 600], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradAngle}deg, #0f0c29 0%, #302b63 40%, #24243e 100%)`,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => {
        const pOp = interpolate(
          frame,
          [p.delay, p.delay + 20],
          [0, 0.4 + (i % 3) * 0.15],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const pY = p.y + Math.sin((frame + i * 20) * p.speed) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: pY,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.3)",
              opacity: pOp,
            }}
          />
        );
      })}

      {/* Decorative gradient circles */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -100,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "0 80px",
        }}
      >
        {/* Main title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            fontFamily: "'Raleway', system-ui, sans-serif",
            transform: `scale(${titleScale})`,
            opacity: titleOp,
            lineHeight: 1.2,
            marginBottom: 16,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          Why{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Recipe Book
          </span>
          ?
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            fontFamily: "'Raleway', system-ui, sans-serif",
            fontWeight: 300,
            maxWidth: 900,
            lineHeight: 1.5,
            opacity: subtitleOp,
            transform: `translateY(${subtitleY}px)`,
            marginBottom: 60,
          }}
        >
          Everything you need to manage, discover, and cook your favorite
          recipes
        </div>

        {/* Benefits grid - 3x2 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            justifyContent: "center",
            maxWidth: 1400,
          }}
        >
          {benefits.map((b, i) => {
            const cardDelay = 70 + i * 30;
            const cardScale = spring({
              frame: frame - cardDelay,
              fps,
              from: 0.7,
              to: 1,
              config: { damping: 12, stiffness: 50 },
            });
            const cardOp = interpolate(
              frame,
              [cardDelay, cardDelay + 25],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const cardY = interpolate(
              frame,
              [cardDelay, cardDelay + 25],
              [40, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            // Checkmark appears after card
            const checkOp = interpolate(
              frame,
              [cardDelay + 40, cardDelay + 55],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const checkScale = spring({
              frame: frame - (cardDelay + 40),
              fps,
              from: 0,
              to: 1,
              config: { damping: 10, stiffness: 80 },
            });

            return (
              <div
                key={i}
                style={{
                  width: 420,
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 20,
                  padding: "32px 28px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transform: `scale(${cardScale}) translateY(${cardY}px)`,
                  opacity: cardOp,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  position: "relative",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 48,
                    minWidth: 64,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${b.color}22`,
                    borderRadius: 16,
                  }}
                >
                  {b.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "white",
                      fontFamily: "'Raleway', system-ui, sans-serif",
                      marginBottom: 8,
                    }}
                  >
                    {b.title}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "'Raleway', system-ui, sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    {b.desc}
                  </div>
                </div>
                {/* Checkmark */}
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: b.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: checkOp,
                    transform: `scale(${checkScale})`,
                  }}
                >
                  <span
                    style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                  >
                    ✓
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA text */}
        {frame >= 320 && (
          <div
            style={{
              marginTop: 50,
              fontSize: 32,
              fontWeight: 600,
              color: "white",
              fontFamily: "'Raleway', system-ui, sans-serif",
              textAlign: "center",
              opacity: interpolate(frame, [320, 350], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${interpolate(frame, [320, 350], [20, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}px)`,
            }}
          >
            Let's see it in action →
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
