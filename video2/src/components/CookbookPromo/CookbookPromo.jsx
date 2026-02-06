import {
  AbsoluteFill,
  Series,
  Img,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import backgroundMusic from "../../assets/background-music2.mp3";
import { recipes, categories } from "../../data/recipes.js";

const F = "'Raleway', system-ui, sans-serif";

// ─── Shared style helpers ───
const frostedGlass = (opacity = 0.12, blur = 30) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  border: "1px solid rgba(255,255,255,0.18)",
});

const goldAccent = "#c9a96e";
const warmBg = "#1a1612";
const sandLight = "#f5efe6";
const charcoal = "#2d2a26";

// ─── Scene 1: Hero Reveal ───
const HeroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = interpolate(frame, [0, 300], [1.05, 1], {
    extrapolateRight: "clamp",
  });
  const overlayOp = interpolate(frame, [0, 40], [1, 0.55], {
    extrapolateRight: "clamp",
  });

  // Logo
  const logoScale = spring({
    frame: frame - 30,
    fps,
    from: 0.5,
    to: 1,
    config: { damping: 12, stiffness: 40 },
  });
  const logoOp = interpolate(frame, [30, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tagline
  const tagOp = interpolate(frame, [60, 85], [0, 1], {
    extrapolateRight: "clamp",
  });
  const tagY = interpolate(frame, [60, 85], [40, 0], {
    extrapolateRight: "clamp",
  });

  // Decorative line
  const lineW = interpolate(frame, [80, 130], [0, 400], {
    extrapolateRight: "clamp",
  });

  // Floating cards cascade
  const cards = recipes.slice(0, 5);

  // Exit
  const exitOp = interpolate(frame, [260, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)",
          left: -200,
          top: -200,
          transform: `scale(${bgScale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.1) 0%, transparent 70%)",
          right: -100,
          bottom: -100,
          transform: `scale(${bgScale})`,
        }}
      />

      {/* Floating recipe cards in background */}
      {cards.map((r, i) => {
        const delay = 50 + i * 25;
        const cScale = spring({
          frame: frame - delay,
          fps,
          from: 0.6,
          to: 1,
          config: { damping: 14, stiffness: 35 },
        });
        const cOp = interpolate(frame, [delay, delay + 30], [0, 0.7], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const floatY = Math.sin(frame * 0.015 + i * 1.2) * 12;
        const floatX = Math.cos(frame * 0.01 + i * 0.8) * 8;
        const rot = interpolate(
          frame,
          [delay, delay + 200],
          [-5 + i * 3, -2 + i * 2],
          { extrapolateRight: "clamp" },
        );
        const positions = [
          { left: 80, top: 150 },
          { left: 1450, top: 100 },
          { left: 1300, top: 550 },
          { left: 150, top: 600 },
          { left: 750, top: 680 },
        ];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...positions[i],
              width: 300,
              height: 370,
              borderRadius: 20,
              overflow: "hidden",
              opacity: cOp,
              transform: `scale(${cScale}) translateY(${floatY}px) translateX(${floatX}px) rotate(${rot}deg)`,
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              ...frostedGlass(0.08, 20),
            }}
          >
            <Img
              src={r.image}
              style={{ width: "100%", height: 220, objectFit: "cover" }}
            />
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(26,22,18,0.85)",
              }}
            >
              <div
                style={{
                  color: sandLight,
                  fontSize: 18,
                  fontFamily: F,
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  color: goldAccent,
                  fontSize: 14,
                  fontFamily: F,
                  marginTop: 4,
                }}
              >
                {r.time} • {r.difficulty}
              </div>
            </div>
          </div>
        );
      })}

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Frosted glass panel */}
        <div
          style={{
            ...frostedGlass(0.08, 40),
            borderRadius: 32,
            padding: "60px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: logoOp,
            transform: `scale(${logoScale})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: 130,
                fontFamily: F,
                fontWeight: 300,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.02em",
              }}
            >
              Cook
            </span>
            <span
              style={{
                fontSize: 130,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              book
            </span>
          </div>
          <div
            style={{
              width: lineW,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${goldAccent}, transparent)`,
            }}
          />
          <p
            style={{
              fontSize: 36,
              fontFamily: F,
              fontWeight: 300,
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.6,
              margin: 0,
              opacity: tagOp,
              transform: `translateY(${tagY}px)`,
            }}
          >
            Your Modern Recipe Management System
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Floating Cards Showcase ───
const FloatingCardsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera pan effect
  const camX = interpolate(frame, [0, 300], [50, -50], {
    extrapolateRight: "clamp",
  });
  const camY = interpolate(frame, [0, 300], [20, -20], {
    extrapolateRight: "clamp",
  });

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient light */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 60%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Title */}
      {(() => {
        const tOp = interpolate(frame, [10, 35], [0, 1], {
          extrapolateRight: "clamp",
        });
        const tY = interpolate(frame, [10, 35], [30, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 60,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 20,
              opacity: tOp,
              transform: `translateY(${tY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Discover
            </span>
            <h2
              style={{
                fontSize: 64,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
                margin: "8px 0 0",
                letterSpacing: "-0.02em",
              }}
            >
              Your Recipe Collection
            </h2>
          </div>
        );
      })()}

      {/* 3D perspective card grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          perspective: 1200,
          perspectiveOrigin: "50% 50%",
          transform: `translate(${camX}px, ${camY}px)`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 320px)",
            gap: 32,
            transformStyle: "preserve-3d",
            transform: "rotateX(12deg) rotateY(-8deg) rotateZ(2deg)",
          }}
        >
          {recipes.map((r, i) => {
            const delay = 30 + i * 18;
            const cScale = spring({
              frame: frame - delay,
              fps,
              from: 0.7,
              to: 1,
              config: { damping: 12, stiffness: 50 },
            });
            const cOp = interpolate(frame, [delay, delay + 25], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const floatZ = Math.sin(frame * 0.02 + i * 0.9) * 15;
            const floatY = Math.sin(frame * 0.018 + i * 1.1) * 8;

            return (
              <div
                key={i}
                style={{
                  width: 320,
                  borderRadius: 20,
                  overflow: "hidden",
                  opacity: cOp,
                  transform: `scale(${cScale}) translateZ(${floatZ}px) translateY(${floatY}px)`,
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                  background: "rgba(45,42,38,0.9)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 220,
                    overflow: "hidden",
                  }}
                >
                  <Img
                    src={r.image}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 60,
                      background:
                        "linear-gradient(transparent, rgba(26,22,18,0.9))",
                    }}
                  />
                  {/* Favorite star */}
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      ...frostedGlass(0.2, 10),
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 16,
                      color: i % 3 === 0 ? "#ffc107" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    ★
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div
                    style={{
                      color: sandLight,
                      fontSize: 19,
                      fontFamily: F,
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {r.name}
                  </div>
                  <div style={{ display: "flex", gap: 3, margin: "6px 0" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 15,
                          color:
                            s <= r.rating ? "#ffc107" : "rgba(255,255,255,0.2)",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 15,
                        fontFamily: F,
                      }}
                    >
                      {r.time}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: F,
                        fontWeight: 600,
                        color: goldAccent,
                        padding: "4px 12px",
                        borderRadius: 12,
                        ...frostedGlass(0.1, 5),
                      }}
                    >
                      {r.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: App UI Showcase (frosted glass mockup) ───
const AppShowcaseScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mockupScale = spring({
    frame: frame - 15,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const mockupOp = interpolate(frame, [15, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Sidebar slide
  const sidebarX = interpolate(frame, [20, 50], [-250, 0], {
    extrapolateRight: "clamp",
  });

  // Category panel slide
  const catPanelX = interpolate(frame, [40, 70], [-200, 0], {
    extrapolateRight: "clamp",
  });

  // Recipe cards stagger
  const cardDelays = [80, 95, 110, 125, 140, 155];

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sidebarLinks = [
    { icon: "📂", label: "Categories", active: true },
    { icon: "⭐", label: "Favorites", active: false },
    { icon: "📊", label: "Conversions", active: false },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${warmBg} 0%, #2a2520 100%)`,
        opacity: exitOp,
        overflow: "hidden",
      }}
    >
      {/* Ambient orbs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)",
          right: -100,
          top: -100,
        }}
      />

      {/* Label */}
      {(() => {
        const lOp = interpolate(frame, [5, 25], [0, 1], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 30,
              opacity: lOp,
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              App Interface
            </span>
          </div>
        );
      })()}

      {/* App mockup container */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${mockupScale})`,
          opacity: mockupOp,
          width: 1700,
          height: 950,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          display: "flex",
          background: "#f2f2f2",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 230,
            background: "#f2f2f2",
            borderRight: "1px solid #d1d1d1",
            display: "flex",
            flexDirection: "column",
            padding: "24px 18px",
            transform: `translateX(${sidebarX}px)`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              padding: "0 0 20px 8px",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontFamily: F,
                fontWeight: 400,
                color: "#aaa",
              }}
            >
              Cook
            </span>
            <span
              style={{
                fontSize: 28,
                fontFamily: F,
                fontWeight: 700,
                color: "#4a90d9",
              }}
            >
              book
            </span>
          </div>
          {sidebarLinks.map((link, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 6,
                margin: "2px 4px",
                fontSize: 16,
                fontFamily: F,
                background: link.active ? "#e8eaed" : "transparent",
                fontWeight: link.active ? 600 : 400,
                color: link.active ? "#202124" : "#555",
              }}
            >
              <span style={{ fontSize: 15 }}>{link.icon}</span>
              {link.label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              fontSize: 13,
              fontFamily: F,
              color: "#888",
            }}
          >
            <span style={{ fontSize: 14 }}>💬</span> Chat Log
          </div>
        </div>

        {/* Category panel */}
        <div
          style={{
            width: 240,
            background: "#f2f2f2",
            borderRight: "1px solid #d1d1d1",
            padding: "16px 12px",
            transform: `translateX(${catPanelX}px)`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontFamily: F,
              fontWeight: 700,
              color: "#333",
              padding: "6px 10px 14px",
            }}
          >
            Category Management
          </div>
          {categories.map((cat, i) => {
            const catOp = interpolate(frame, [50 + i * 8, 65 + i * 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderLeft: `4px solid ${cat.color}`,
                  margin: "4px 0",
                  fontSize: 15,
                  fontFamily: F,
                  color: "#333",
                  opacity: catOp,
                  background: i === 0 ? "rgba(0,0,0,0.04)" : "transparent",
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                {cat.name}
              </div>
            );
          })}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 0,
                background: "#e8eaed",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 24px",
                  fontSize: 15,
                  fontFamily: F,
                  fontWeight: 400,
                  color: "#666",
                }}
              >
                Chat
              </div>
              <div
                style={{
                  padding: "8px 24px",
                  fontSize: 15,
                  fontFamily: F,
                  fontWeight: 600,
                  color: "#fff",
                  background: "#333",
                  borderRadius: 20,
                }}
              >
                Recipes
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1.5px solid #333",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                ☆
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1.5px solid #333",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 16,
                }}
              >
                +
              </div>
            </div>
          </div>

          {/* Recipe grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 18,
            }}
          >
            {recipes.slice(0, 6).map((r, i) => {
              const cOp = interpolate(
                frame,
                [cardDelays[i], cardDelays[i] + 20],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              const cScale = spring({
                frame: frame - cardDelays[i],
                fps,
                from: 0.85,
                to: 1,
                config: { damping: 12, stiffness: 60 },
              });
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    opacity: cOp,
                    transform: `scale(${cScale})`,
                  }}
                >
                  <div
                    style={{
                      height: 170,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <Img
                      src={r.image}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        fontSize: 16,
                        color: i === 0 || i === 2 ? "#ffc107" : "#ccc",
                      }}
                    >
                      ★
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontFamily: F,
                        fontWeight: 600,
                        color: "#333",
                        lineHeight: 1.3,
                      }}
                    >
                      {r.name}
                    </div>
                    <div style={{ display: "flex", gap: 2, margin: "3px 0" }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: 13,
                            color: s <= r.rating ? "#ffc107" : "#ddd",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 14, fontFamily: F, color: "#888" }}>
                      {r.time} • {r.difficulty}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Features Showcase ───
const FeaturesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    {
      icon: "🔍",
      title: "Smart Search",
      desc: "Find any recipe instantly by name, ingredient, or tag",
      color: "#e8d5b7",
    },
    {
      icon: "🌐",
      title: "Import from URL",
      desc: "Paste any recipe URL and we'll parse it automatically",
      color: "#d4c4a8",
    },
    {
      icon: "👨‍🍳",
      title: "Cooking Mode",
      desc: "Hands-free step-by-step with voice commands",
      color: "#c9b896",
    },
    {
      icon: "🤖",
      title: "AI Assistant",
      desc: "Ask questions, get suggestions, and discover new recipes",
      color: "#bfad85",
    },
    {
      icon: "⭐",
      title: "Favorites",
      desc: "Save your best recipes for quick access anytime",
      color: "#b5a274",
    },
    {
      icon: "📊",
      title: "Conversions",
      desc: "Convert between measurement units while cooking",
      color: "#ab9763",
    },
  ];

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 65%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Title */}
      {(() => {
        const tOp = interpolate(frame, [5, 30], [0, 1], {
          extrapolateRight: "clamp",
        });
        const tY = interpolate(frame, [5, 30], [25, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 70,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 10,
              opacity: tOp,
              transform: `translateY(${tY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Powerful Features
            </span>
            <h2
              style={{
                fontSize: 60,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
                margin: "8px 0 0",
                letterSpacing: "-0.02em",
              }}
            >
              Everything You Need
            </h2>
          </div>
        );
      })()}

      {/* Feature cards in 3x2 grid */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -46%)",
          display: "grid",
          gridTemplateColumns: "repeat(3, 400px)",
          gap: 28,
          perspective: 800,
        }}
      >
        {features.map((feat, i) => {
          const delay = 35 + i * 20;
          const cScale = spring({
            frame: frame - delay,
            fps,
            from: 0.7,
            to: 1,
            config: { damping: 12, stiffness: 50 },
          });
          const cOp = interpolate(frame, [delay, delay + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const floatY = Math.sin(frame * 0.02 + i * 1.3) * 5;

          return (
            <div
              key={i}
              style={{
                padding: "36px 32px",
                borderRadius: 20,
                opacity: cOp,
                transform: `scale(${cScale}) translateY(${floatY}px)`,
                ...frostedGlass(0.06, 25),
                boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 32,
                  background: `rgba(201,169,110,0.12)`,
                  border: `1px solid rgba(201,169,110,0.2)`,
                }}
              >
                {feat.icon}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontFamily: F,
                  fontWeight: 700,
                  color: sandLight,
                }}
              >
                {feat.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: F,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.5,
                }}
              >
                {feat.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Floating Ingredients + Phone Mockup ───
const IngredientsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ingredients3D = [
    { emoji: "🍅", x: 200, y: 180, size: 90, speed: 0.015, phase: 0 },
    { emoji: "🧄", x: 1650, y: 250, size: 75, speed: 0.018, phase: 1.2 },
    { emoji: "🌿", x: 300, y: 750, size: 80, speed: 0.012, phase: 2.4 },
    { emoji: "🧀", x: 1500, y: 700, size: 85, speed: 0.016, phase: 0.8 },
    { emoji: "🍋", x: 150, y: 450, size: 70, speed: 0.02, phase: 1.6 },
    { emoji: "🫒", x: 1700, y: 500, size: 65, speed: 0.014, phase: 3.0 },
    { emoji: "🌶️", x: 400, y: 100, size: 75, speed: 0.017, phase: 2.0 },
    { emoji: "🥑", x: 1400, y: 150, size: 80, speed: 0.013, phase: 0.4 },
    { emoji: "🍄", x: 250, y: 600, size: 70, speed: 0.019, phase: 1.0 },
    { emoji: "🧅", x: 1600, y: 850, size: 75, speed: 0.015, phase: 2.8 },
  ];

  // Center phone mockup
  const phoneScale = spring({
    frame: frame - 20,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const phoneOp = interpolate(frame, [20, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 60%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Floating 3D ingredients */}
      {ingredients3D.map((ing, i) => {
        const delay = 10 + i * 8;
        const iOp = interpolate(frame, [delay, delay + 25], [0, 0.85], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const floatY = Math.sin(frame * ing.speed + ing.phase) * 25;
        const floatX = Math.cos(frame * ing.speed * 0.7 + ing.phase) * 15;
        const rot = Math.sin(frame * 0.01 + ing.phase) * 15;
        const scale = 1 + Math.sin(frame * 0.015 + ing.phase * 2) * 0.08;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ing.x,
              top: ing.y,
              fontSize: ing.size,
              opacity: iOp,
              transform: `translate(${floatX}px, ${floatY}px) rotate(${rot}deg) scale(${scale})`,
              filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.3))",
              zIndex: 5,
            }}
          >
            {ing.emoji}
          </div>
        );
      })}

      {/* Center: Recipe detail card mockup */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${phoneScale})`,
          opacity: phoneOp,
          width: 650,
          borderRadius: 24,
          overflow: "hidden",
          zIndex: 10,
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
          background: "#fff",
        }}
      >
        {/* Recipe image */}
        <div style={{ height: 340, overflow: "hidden", position: "relative" }}>
          <Img
            src={recipes[0].image}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 20,
              color: "#fff",
              fontSize: 34,
              fontFamily: F,
              fontWeight: 700,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            Chocolate Lava Cake
          </div>
        </div>
        {/* Recipe info */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} style={{ fontSize: 24, color: "#ffc107" }}>
                ★
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 18,
                fontFamily: F,
                color: "#666",
              }}
            >
              <span>⏱️</span> 45 min
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 18,
                fontFamily: F,
                color: "#666",
              }}
            >
              <span>📊</span> Medium
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 18,
                fontFamily: F,
                color: "#666",
              }}
            >
              <span>🍽️</span> 4 servings
            </div>
          </div>
          {/* Ingredients preview */}
          <div
            style={{
              fontSize: 22,
              fontFamily: F,
              fontWeight: 700,
              color: "#333",
              marginBottom: 10,
            }}
          >
            Ingredients
          </div>
          {[
            "200g dark chocolate",
            "3 large eggs",
            "1 cup sugar",
            "2 tbsp butter",
          ].map((ing, i) => {
            const iOp = interpolate(frame, [80 + i * 15, 95 + i * 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid #f0f0f0",
                  opacity: iOp,
                  fontSize: 18,
                  fontFamily: F,
                  color: "#555",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: goldAccent,
                  }}
                />
                {ing}
              </div>
            );
          })}
        </div>
      </div>

      {/* Label */}
      {(() => {
        const lOp = interpolate(frame, [5, 25], [0, 1], {
          extrapolateRight: "clamp",
        });
        const lY = interpolate(frame, [5, 25], [20, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 20,
              opacity: lOp,
              transform: `translateY(${lY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Recipe Details
            </span>
            <h2
              style={{
                fontSize: 56,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
                margin: "6px 0 0",
              }}
            >
              Every Detail at a Glance
            </h2>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

// ─── Scene 6: AI Chat Assistant ───
const AIChatScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chat mockup
  const mockScale = spring({
    frame: frame - 15,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const mockOp = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Chat messages
  const messages = [
    { role: "user", text: "What can I make with chicken and rice?", delay: 60 },
    {
      role: "ai",
      text: "Here are some great options:\n\n🍗 Chicken Fried Rice — 25 min, Easy\n🍛 Chicken Biryani — 45 min, Medium\n🥘 Chicken & Rice Casserole — 35 min, Easy\n\nWould you like the full recipe for any of these?",
      delay: 100,
    },
    { role: "user", text: "Show me the Chicken Biryani recipe", delay: 180 },
    {
      role: "ai",
      text: "🍛 Chicken Biryani\n⏱️ 45 min • Medium • 4 servings\n\nIngredients: basmati rice, chicken thighs, yogurt, onions, garam masala, saffron...",
      delay: 210,
    },
  ];

  // Typing indicator
  const typingDots = Math.floor(frame / 8) % 4;

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(100,160,230,0.06) 0%, transparent 65%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Title */}
      {(() => {
        const tOp = interpolate(frame, [5, 28], [0, 1], {
          extrapolateRight: "clamp",
        });
        const tY = interpolate(frame, [5, 28], [25, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 20,
              opacity: tOp,
              transform: `translateY(${tY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              AI Powered
            </span>
            <h2
              style={{
                fontSize: 58,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
                margin: "6px 0 0",
              }}
            >
              Your Recipe Assistant
            </h2>
          </div>
        );
      })()}

      {/* Chat mockup */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -46%) scale(${mockScale})`,
          opacity: mockOp,
          width: 850,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          background: "#fff",
          maxHeight: 720,
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 18,
              color: "#fff",
            }}
          >
            🤖
          </div>
          <div>
            <div
              style={{
                fontSize: 19,
                fontFamily: F,
                fontWeight: 700,
                color: "#333",
              }}
            >
              Recipe AI
            </div>
            <div style={{ fontSize: 14, fontFamily: F, color: "#999" }}>
              Always ready to help
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {messages.map((msg, i) => {
            const mOp = interpolate(
              frame,
              [msg.delay, msg.delay + 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const mY = interpolate(
              frame,
              [msg.delay, msg.delay + 20],
              [15, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                style={{
                  opacity: mOp,
                  transform: `translateY(${mY}px)`,
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "14px 22px",
                    borderRadius: 16,
                    borderBottomRightRadius: isUser ? 4 : 16,
                    borderBottomLeftRadius: isUser ? 16 : 4,
                    background: isUser ? "#333" : "#f5f5f5",
                    color: isUser ? "#fff" : "#333",
                    fontSize: 16,
                    fontFamily: F,
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {frame > 90 && frame < 100 && (
            <div style={{ display: "flex", gap: 4, padding: "8px 16px" }}>
              {[0, 1, 2].map((d) => (
                <div
                  key={d}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: d < typingDots ? "#999" : "#ddd",
                  }}
                />
              ))}
            </div>
          )}
          {frame > 200 && frame < 210 && (
            <div style={{ display: "flex", gap: 4, padding: "8px 16px" }}>
              {[0, 1, 2].map((d) => (
                <div
                  key={d}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: d < typingDots ? "#999" : "#ddd",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating decorative elements */}
      {["💬", "🧠", "✨", "📝"].map((e, i) => {
        const delay = 20 + i * 12;
        const eOp = interpolate(frame, [delay, delay + 20], [0, 0.5], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const floatY = Math.sin(frame * 0.018 + i * 1.5) * 18;
        const positions = [
          { left: 120, top: 200 },
          { right: 140, top: 250 },
          { left: 180, bottom: 180 },
          { right: 180, bottom: 220 },
        ];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...positions[i],
              fontSize: 52,
              opacity: eOp,
              transform: `translateY(${floatY}px)`,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
            }}
          >
            {e}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 7: Cooking Mode ───
const CookingModeScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mockScale = spring({
    frame: frame - 15,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const mockOp = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Steps
  const steps = [
    "Preheat oven to 180°C (350°F)",
    "Melt chocolate and butter in a double boiler",
    "Whisk eggs and sugar until fluffy",
    "Fold in the melted chocolate mixture",
    "Pour into ramekins and bake for 12 minutes",
  ];
  const currentStep =
    frame < 80 ? 0 : frame < 130 ? 1 : frame < 180 ? 2 : frame < 220 ? 3 : 4;

  // Timer animation
  const timerMinutes = Math.max(0, 12 - Math.floor(frame / 25));
  const timerSeconds = Math.max(0, 59 - (frame % 60));

  // Voice pulse
  const voicePulse = 1 + Math.sin(frame * 0.1) * 0.06;

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient warm glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(230,160,80,0.07) 0%, transparent 65%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Title */}
      {(() => {
        const tOp = interpolate(frame, [5, 28], [0, 1], {
          extrapolateRight: "clamp",
        });
        const tY = interpolate(frame, [5, 28], [25, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 20,
              opacity: tOp,
              transform: `translateY(${tY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Hands-Free
            </span>
            <h2
              style={{
                fontSize: 58,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
                margin: "6px 0 0",
              }}
            >
              Cooking Mode
            </h2>
          </div>
        );
      })()}

      {/* Cooking mode mockup */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -46%) scale(${mockScale})`,
          opacity: mockOp,
          width: 800,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          background: "#1a1a2e",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontFamily: F,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            🍫 Chocolate Lava Cake
          </div>
          <div
            style={{
              fontSize: 17,
              fontFamily: F,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              background: `linear-gradient(90deg, ${goldAccent}, #e8b84d)`,
              transition: "width 0.3s",
            }}
          />
        </div>

        {/* Current step */}
        <div style={{ padding: "40px 36px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 80,
              marginBottom: 28,
              filter: "drop-shadow(0 4px 15px rgba(201,169,110,0.3))",
            }}
          >
            {currentStep === 0
              ? "🔥"
              : currentStep === 1
                ? "🍫"
                : currentStep === 2
                  ? "🥚"
                  : currentStep === 3
                    ? "🥄"
                    : "🧁"}
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: F,
              fontWeight: 500,
              color: "#fff",
              lineHeight: 1.6,
              maxWidth: 550,
              margin: "0 auto",
            }}
          >
            {steps[currentStep]}
          </div>
        </div>

        {/* Timer */}
        {currentStep === 4 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
              opacity: interpolate(frame, [220, 240], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                padding: "12px 32px",
                borderRadius: 16,
                background: "rgba(201,169,110,0.15)",
                border: `1px solid rgba(201,169,110,0.3)`,
                fontSize: 34,
                fontFamily: "monospace",
                color: goldAccent,
                fontWeight: 700,
              }}
            >
              ⏱️ {String(timerMinutes).padStart(2, "0")}:
              {String(timerSeconds).padStart(2, "0")}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            padding: "20px 36px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 18,
              fontFamily: F,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            ← Previous
          </div>

          {/* Voice button */}
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${goldAccent}, #b8943e)`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 30,
              transform: `scale(${voicePulse})`,
              boxShadow: `0 4px 20px rgba(201,169,110,0.4)`,
            }}
          >
            🎤
          </div>

          <div
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: goldAccent,
              fontSize: 18,
              fontFamily: F,
              color: warmBg,
              fontWeight: 700,
            }}
          >
            Next →
          </div>
        </div>
      </div>

      {/* Floating cooking elements */}
      {["🥘", "👨‍🍳", "🔥", "⏱️", "🎤"].map((e, i) => {
        const delay = 25 + i * 10;
        const eOp = interpolate(frame, [delay, delay + 20], [0, 0.45], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const floatY = Math.sin(frame * 0.016 + i * 1.3) * 20;
        const positions = [
          { left: 100, top: 220 },
          { right: 110, top: 200 },
          { left: 140, bottom: 150 },
          { right: 150, bottom: 180 },
          { left: 80, top: 500 },
        ];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...positions[i],
              fontSize: 50,
              opacity: eOp,
              transform: `translateY(${floatY}px)`,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
            }}
          >
            {e}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 8: Favorites & Import URL ───
const FavoritesImportScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Split screen: Favorites left, Import right
  const leftOp = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const leftX = interpolate(frame, [15, 40], [-60, 0], {
    extrapolateRight: "clamp",
  });
  const rightOp = interpolate(frame, [35, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  const rightX = interpolate(frame, [35, 60], [60, 0], {
    extrapolateRight: "clamp",
  });

  const favoriteRecipes = recipes.slice(0, 4);

  // URL typing animation
  const urlText = "https://www.allrecipes.com/recipe/chocolate-cake";
  const urlLen = Math.min(
    Math.floor(
      interpolate(frame, [120, 180], [0, urlText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    urlText.length,
  );

  // Import success
  const importSuccess = frame > 200;
  const successOp = interpolate(frame, [200, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const successScale = spring({
    frame: frame - 200,
    fps,
    from: 0.7,
    to: 1,
    config: { damping: 10, stiffness: 60 },
  });

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 65%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Title */}
      {(() => {
        const tOp = interpolate(frame, [5, 28], [0, 1], {
          extrapolateRight: "clamp",
        });
        const tY = interpolate(frame, [5, 28], [25, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 20,
              opacity: tOp,
              transform: `translateY(${tY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontFamily: F,
                fontWeight: 500,
                color: goldAccent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              More Features
            </span>
            <h2
              style={{
                fontSize: 56,
                fontFamily: F,
                fontWeight: 700,
                color: "#fff",
                margin: "6px 0 0",
              }}
            >
              Favorites & Import
            </h2>
          </div>
        );
      })()}

      {/* Left: Favorites */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: "50%",
          transform: `translate(0, -42%) translateX(${leftX}px)`,
          opacity: leftOp,
          width: 520,
        }}
      >
        <div
          style={{
            ...frostedGlass(0.06, 25),
            borderRadius: 20,
            padding: "24px 20px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 28 }}>⭐</span>
            <span
              style={{
                fontSize: 24,
                fontFamily: F,
                fontWeight: 700,
                color: sandLight,
              }}
            >
              Your Favorites
            </span>
          </div>
          {favoriteRecipes.map((r, i) => {
            const rOp = interpolate(frame, [50 + i * 15, 65 + i * 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 12px",
                  borderRadius: 12,
                  marginBottom: 8,
                  opacity: rOp,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Img
                    src={r.image}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontFamily: F,
                      fontWeight: 600,
                      color: sandLight,
                    }}
                  >
                    {r.name}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontFamily: F,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 2,
                    }}
                  >
                    {r.time} • {r.difficulty}
                  </div>
                </div>
                <span style={{ fontSize: 20, color: "#ffc107" }}>★</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Import from URL */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: "50%",
          transform: `translate(0, -42%) translateX(${rightX}px)`,
          opacity: rightOp,
          width: 560,
        }}
      >
        <div
          style={{
            ...frostedGlass(0.06, 25),
            borderRadius: 20,
            padding: "28px 24px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 28 }}>🌐</span>
            <span
              style={{
                fontSize: 24,
                fontFamily: F,
                fontWeight: 700,
                color: sandLight,
              }}
            >
              Import from URL
            </span>
          </div>

          {/* URL input */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontFamily: F,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 6,
              }}
            >
              Paste recipe URL
            </div>
            <div
              style={{
                fontSize: 16,
                fontFamily: "monospace",
                color: goldAccent,
                wordBreak: "break-all",
              }}
            >
              {urlText.slice(0, urlLen)}
              {urlLen < urlText.length && (
                <span
                  style={{
                    opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                    color: "#fff",
                  }}
                >
                  |
                </span>
              )}
            </div>
          </div>

          {/* Import button */}
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              textAlign: "center",
              background:
                frame > 185
                  ? `linear-gradient(135deg, ${goldAccent}, #b8943e)`
                  : "rgba(255,255,255,0.08)",
              color: frame > 185 ? warmBg : "rgba(255,255,255,0.5)",
              fontSize: 18,
              fontFamily: F,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {frame > 185 ? "Import Recipe" : "Paste a URL to import"}
          </div>

          {/* Success result */}
          {importSuccess && (
            <div
              style={{
                opacity: successOp,
                transform: `scale(${successScale})`,
                padding: "16px",
                borderRadius: 14,
                background: "rgba(39,174,96,0.12)",
                border: "1px solid rgba(39,174,96,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Img
                  src={recipes[0].image}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontFamily: F,
                    fontWeight: 600,
                    color: "#27ae60",
                  }}
                >
                  ✓ Recipe imported!
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontFamily: F,
                    color: sandLight,
                    marginTop: 2,
                  }}
                >
                  Chocolate Cake — added to your collection
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 9: CTA / Outro (loops back to hero) ───
const CTAScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = interpolate(frame, [0, 300], [1, 1.05], {
    extrapolateRight: "clamp",
  });

  // Logo entrance
  const logoScale = spring({
    frame: frame - 20,
    fps,
    from: 0.6,
    to: 1,
    config: { damping: 12, stiffness: 40 },
  });
  const logoOp = interpolate(frame, [20, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  // CTA text
  const ctaOp = interpolate(frame, [50, 75], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [50, 75], [30, 0], {
    extrapolateRight: "clamp",
  });

  // URL
  const urlOp = interpolate(frame, [80, 105], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Button pulse
  const btnScale = 1 + Math.sin(frame * 0.05) * 0.03;

  // Floating mini cards
  const miniCards = recipes.slice(0, 6);

  // Fade out at end for loop
  const exitOp = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: warmBg, opacity: exitOp, overflow: "hidden" }}
    >
      {/* Ambient orbs */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 60%)",
          left: "50%",
          top: "50%",
          transform: `translate(-50%,-50%) scale(${bgScale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
          left: -100,
          bottom: -100,
        }}
      />

      {/* Floating mini recipe cards in background */}
      {miniCards.map((r, i) => {
        const delay = 15 + i * 10;
        const cOp = interpolate(frame, [delay, delay + 25], [0, 0.35], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const floatY = Math.sin(frame * 0.012 + i * 1.1) * 20;
        const floatX = Math.cos(frame * 0.009 + i * 0.9) * 15;
        const positions = [
          { left: 60, top: 80 },
          { right: 80, top: 120 },
          { left: 100, bottom: 100 },
          { right: 120, bottom: 80 },
          { left: 350, top: 50 },
          { right: 350, bottom: 50 },
        ];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...positions[i],
              width: 180,
              height: 130,
              borderRadius: 14,
              overflow: "hidden",
              opacity: cOp,
              transform: `translateY(${floatY}px) translateX(${floatX}px)`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <Img
              src={r.image}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        );
      })}

      {/* Center CTA */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOp,
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 110,
              fontFamily: F,
              fontWeight: 300,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Cook
          </span>
          <span
            style={{
              fontSize: 110,
              fontFamily: F,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            book
          </span>
        </div>

        {/* Decorative line */}
        {(() => {
          const lW = interpolate(frame, [40, 80], [0, 400], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              style={{
                width: lW,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${goldAccent}, transparent)`,
                marginBottom: 28,
              }}
            />
          );
        })()}

        {/* CTA text */}
        <p
          style={{
            fontSize: 42,
            fontFamily: F,
            fontWeight: 300,
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            maxWidth: 750,
            lineHeight: 1.6,
            margin: "0 0 32px",
            opacity: ctaOp,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          Start organizing your recipes today
        </p>

        {/* CTA Button */}
        <div
          style={{
            opacity: ctaOp,
            transform: `translateY(${ctaY}px) scale(${btnScale})`,
            padding: "20px 60px",
            borderRadius: 50,
            background: `linear-gradient(135deg, ${goldAccent}, #b8943e)`,
            color: warmBg,
            fontSize: 24,
            fontFamily: F,
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: `0 8px 30px rgba(201,169,110,0.3)`,
          }}
        >
          Get Started Free
        </div>

        {/* URL */}
        <div
          style={{
            opacity: urlOp,
            marginTop: 24,
            fontSize: 20,
            fontFamily: F,
            fontWeight: 400,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.05em",
          }}
        >
          recipe-book-82d57.web.app
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ───
// Total: 300 × 9 = 2700 frames = 90s @ 30fps
export const CookbookPromo = () => {
  const frame = useCurrentFrame();
  const musicVolume = interpolate(
    frame,
    [0, 60, 2600, 2700],
    [0, 0.1, 0.1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: warmBg }}>
      <Audio src={backgroundMusic} volume={musicVolume} loop />
      <Series>
        <Series.Sequence durationInFrames={300}>
          <HeroScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <FloatingCardsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <AppShowcaseScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <FeaturesScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <IngredientsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <AIChatScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <CookingModeScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <FavoritesImportScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <CTAScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
