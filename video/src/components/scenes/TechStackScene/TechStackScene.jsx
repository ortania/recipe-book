import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const techStack = [
  { name: "React 18", emoji: "⚛️", color: "#61dafb", desc: "UI Framework" },
  { name: "Vite", emoji: "⚡", color: "#646cff", desc: "Build Tool" },
  { name: "Firebase", emoji: "🔥", color: "#ffca28", desc: "Backend & Auth" },
  { name: "React Router", emoji: "🧭", color: "#ca4245", desc: "Navigation" },
  { name: "MUI", emoji: "🎨", color: "#007fff", desc: "UI Components" },
  {
    name: "CSS Modules",
    emoji: "💅",
    color: "#e91e63",
    desc: "Scoped Styling",
  },
  { name: "React Icons", emoji: "🎯", color: "#e91e63", desc: "Icon Library" },
  {
    name: "Context API",
    emoji: "🔄",
    color: "#4caf50",
    desc: "State Management",
  },
  { name: "OpenAI", emoji: "🤖", color: "#10a37f", desc: "AI Chat Assistant" },
];

export const TechStackScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animated particles for motion graphic feel
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    x: (i * 131 + 80) % 1920,
    y: (i * 97 + 40) % 1080,
    size: 2 + (i % 3),
    speed: 0.006 + (i % 4) * 0.002,
    delay: i * 4,
  }));

  const titleOpacity = interpolate(frame, [5, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [5, 30], [-20, 0], {
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(frame, [290, 320], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      {/* Motion graphic particles */}
      {particles.map((p, i) => {
        const pOp = interpolate(frame, [p.delay, p.delay + 20], [0, 0.3], {
          extrapolateRight: "clamp",
        });
        const pY = p.y + Math.sin(frame * p.speed + i) * 15;
        return (
          <div
            key={`p${i}`}
            style={{
              position: "absolute",
              left: p.x,
              top: pY,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(102,126,234,0.5)",
              opacity: pOp,
            }}
          />
        );
      })}

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 70,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 50,
            fontWeight: 800,
            color: "white",
            fontFamily: "'Raleway', system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Built With
        </div>
        <div
          style={{
            width: interpolate(frame, [25, 50], [0, 200], {
              extrapolateRight: "clamp",
            }),
            height: 3,
            background:
              "linear-gradient(90deg, transparent, #667eea, transparent)",
          }}
        />
      </div>

      {/* Tech grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 24,
          marginTop: 80,
          maxWidth: 1200,
        }}
      >
        {techStack.map((tech, i) => {
          const delay = 20 + i * 8;
          const itemScale = spring({
            frame: frame - delay,
            fps,
            from: 0,
            to: 1,
            config: { damping: 12, stiffness: 80 },
          });

          const itemOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const floatY = Math.sin(frame * 0.04 + i * 1.2) * 4;

          return (
            <div
              key={i}
              style={{
                width: 340,
                padding: "22px 26px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${tech.color}40`,
                transform: `scale(${itemScale}) translateY(${floatY}px)`,
                opacity: itemOpacity,
                display: "flex",
                alignItems: "center",
                gap: 18,
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${tech.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  flexShrink: 0,
                }}
              >
                {tech.emoji}
              </div>
              <div>
                <div
                  style={{
                    color: "white",
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: "'Raleway', system-ui, sans-serif",
                  }}
                >
                  {tech.name}
                </div>
                <div
                  style={{
                    color: tech.color,
                    fontSize: 15,
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  {tech.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
