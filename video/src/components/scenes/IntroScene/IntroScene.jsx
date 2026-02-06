import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient rotation for dynamic feel
  const gradAngle = interpolate(frame, [0, 210], [120, 160]);

  // Geometric shapes - motion graphic style
  const shapes = [
    { x: 150, y: 120, size: 180, color: "rgba(255,255,255,0.04)", delay: 0 },
    { x: 1600, y: 200, size: 250, color: "rgba(255,255,255,0.03)", delay: 5 },
    { x: 300, y: 750, size: 200, color: "rgba(255,255,255,0.04)", delay: 10 },
    { x: 1400, y: 700, size: 160, color: "rgba(255,255,255,0.05)", delay: 8 },
    { x: 900, y: 100, size: 120, color: "rgba(255,255,255,0.03)", delay: 12 },
  ];

  // Logo reveal - cinematic
  const logoContainerScale = spring({
    frame: frame - 20,
    fps,
    from: 0.6,
    to: 1,
    config: { damping: 18, stiffness: 30 },
  });

  // "Cook" slides in from left
  const cookX = interpolate(frame, [25, 55], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cookOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  // "book" slides in from right
  const bookX = interpolate(frame, [40, 70], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bookOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Underline wipe
  const lineWidth = interpolate(frame, [70, 110], [0, 500], {
    extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(frame, [70, 85], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tagline - kinetic typography
  const taglineOpacity = interpolate(frame, [85, 110], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [85, 110], [30, 0], {
    extrapolateRight: "clamp",
  });
  const taglineLetterSpacing = interpolate(frame, [85, 120], [0.3, 0.08], {
    extrapolateRight: "clamp",
  });

  // Feature pills stagger
  const pills = [
    "📝 Recipes",
    "📂 Categories",
    "⭐ Favorites",
    "🤖 AI Chat",
    "🔢 Conversions",
  ];

  // Particle dots - motion graphic style
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    x: (i * 97 + 50) % 1920,
    y: (i * 131 + 30) % 1080,
    size: 2 + (i % 3) * 1.5,
    speed: 0.008 + (i % 5) * 0.003,
    delay: i * 3,
  }));

  // Exit
  const exitOpacity = interpolate(frame, [310, 340], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradAngle}deg, #667eea 0%, #764ba2 50%, #5b3d99 100%)`,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      {/* Geometric shapes - motion graphic background */}
      {shapes.map((s, i) => {
        const shapeScale = spring({
          frame: frame - s.delay,
          fps,
          from: 0,
          to: 1,
          config: { damping: 20, stiffness: 30 },
        });
        const floatY = Math.sin(frame * 0.012 + i * 1.5) * 15;
        const rot = frame * 0.15 + i * 45;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x - s.size / 2,
              top: s.y - s.size / 2 + floatY,
              width: s.size,
              height: s.size,
              borderRadius: i % 2 === 0 ? "50%" : "20%",
              border: `2px solid ${s.color}`,
              background: s.color,
              transform: `scale(${shapeScale}) rotate(${rot}deg)`,
            }}
          />
        );
      })}

      {/* Animated particles */}
      {particles.map((p, i) => {
        const pOpacity = interpolate(frame, [p.delay, p.delay + 20], [0, 0.4], {
          extrapolateRight: "clamp",
        });
        const pY = p.y + Math.sin(frame * p.speed + i) * 20;

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
              background: "rgba(255,255,255,0.5)",
              opacity: pOpacity,
            }}
          />
        );
      })}

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          transform: `scale(${logoContainerScale})`,
          zIndex: 1,
        }}
      >
        {/* Logo - matching actual app: "Cook" light + "book" bold */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 130,
              fontFamily: "'Raleway', system-ui, sans-serif",
              fontWeight: 300,
              color: "rgba(255,255,255,0.65)",
              opacity: cookOpacity,
              transform: `translateX(${cookX}px)`,
              letterSpacing: "0.02em",
            }}
          >
            Cook
          </span>
          <span
            style={{
              fontSize: 130,
              fontFamily: "'Raleway', system-ui, sans-serif",
              fontWeight: 700,
              color: "#fff",
              opacity: bookOpacity,
              transform: `translateX(${bookX}px)`,
            }}
          >
            book
          </span>
        </div>

        {/* Animated underline wipe */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
            opacity: lineOpacity,
            marginTop: -10,
          }}
        />

        {/* Tagline - kinetic typography */}
        <p
          style={{
            fontSize: 36,
            fontFamily: "'Raleway', system-ui, sans-serif",
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            margin: 0,
            maxWidth: 750,
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: `${taglineLetterSpacing}em`,
          }}
        >
          Your Modern Recipe Management System
        </p>

        {/* Feature pills - staggered spring entrance */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 20,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {pills.map((label, i) => {
            const pillDelay = 120 + i * 8;
            const pillScale = spring({
              frame: frame - pillDelay,
              fps,
              from: 0,
              to: 1,
              config: { damping: 10, stiffness: 80 },
            });
            const pillOpacity = interpolate(
              frame,
              [pillDelay, pillDelay + 12],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            return (
              <div
                key={i}
                style={{
                  padding: "10px 26px",
                  borderRadius: 30,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white",
                  fontSize: 17,
                  fontWeight: 500,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                  transform: `scale(${pillScale})`,
                  opacity: pillOpacity,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
