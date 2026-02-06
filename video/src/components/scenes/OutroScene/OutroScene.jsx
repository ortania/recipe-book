import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradAngle = interpolate(frame, [0, 240], [120, 200]);

  // Motion graphic particles
  const particles = Array.from({ length: 18 }).map((_, i) => ({
    x: (i * 107 + 60) % 1920,
    y: (i * 139 + 50) % 1080,
    size: 2 + (i % 3) * 1.5,
    speed: 0.007 + (i % 5) * 0.002,
    delay: i * 3,
  }));

  // Logo
  const logoScale = spring({
    frame: frame - 10,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12, stiffness: 40 },
  });

  const cookOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bookOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [60, 85], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [60, 85], [25, 0], {
    extrapolateRight: "clamp",
  });

  // Feature summary
  const features = [
    { icon: "📝", text: "Recipe Management" },
    { icon: "📂", text: "Smart Categories" },
    { icon: "⭐", text: "Favorites" },
    { icon: "🤖", text: "AI Cooking Assistant" },
    { icon: "🔢", text: "Conversion Tables" },
    { icon: "🔐", text: "Firebase Auth" },
  ];

  // CTA
  const ctaOpacity = interpolate(frame, [140, 165], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({
    frame: frame - 140,
    fps,
    from: 0.7,
    to: 1,
    config: { damping: 10, stiffness: 80 },
  });

  // Tech badges
  const badgesOpacity = interpolate(frame, [170, 195], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Floating emojis
  const emojis = ["🍰", "🥗", "🍕", "🍲", "🥧", "🍳", "🥘", "🧁", "🍫", "🥤"];

  // Glow pulse
  const glowPulse = Math.sin(frame * 0.06) * 12 + 20;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradAngle}deg, #667eea 0%, #764ba2 50%, #5b3d99 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Motion graphic particles */}
      {particles.map((p, i) => {
        const pOp = interpolate(frame, [p.delay, p.delay + 20], [0, 0.4], {
          extrapolateRight: "clamp",
        });
        const pY = p.y + Math.sin(frame * p.speed + i) * 18;
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
              opacity: pOp,
            }}
          />
        );
      })}

      {/* Floating food emojis */}
      {emojis.map((emoji, i) => {
        const startX = ((i * 193) % 1700) + 80;
        const startY = ((i * 157) % 900) + 60;
        const floatY = Math.sin(frame * 0.015 + i * 1.1) * 25;
        const floatX = Math.cos(frame * 0.012 + i * 0.9) * 18;
        const rot = Math.sin(frame * 0.008 + i) * 12;
        const emojiOp = interpolate(frame, [5 + i * 3, 25 + i * 3], [0, 0.1], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: startX + floatX,
              top: startY + floatY,
              fontSize: 50 + (i % 3) * 15,
              opacity: emojiOp,
              transform: `rotate(${rot}deg)`,
            }}
          >
            {emoji}
          </div>
        );
      })}

      {/* Glow ring */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.15)",
          boxShadow: `0 0 ${glowPulse}px rgba(255,255,255,0.15), inset 0 0 ${glowPulse}px rgba(255,255,255,0.05)`,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            transform: `scale(${logoScale})`,
          }}
        >
          <span
            style={{
              fontSize: 100,
              fontFamily: "'Raleway', system-ui, sans-serif",
              fontWeight: 300,
              color: "rgba(255,255,255,0.6)",
              opacity: cookOpacity,
            }}
          >
            Cook
          </span>
          <span
            style={{
              fontSize: 100,
              fontFamily: "'Raleway', system-ui, sans-serif",
              fontWeight: 700,
              color: "white",
              opacity: bookOpacity,
            }}
          >
            book
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 30,
            fontFamily: "'Raleway', system-ui, sans-serif",
            color: "rgba(255,255,255,0.85)",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            margin: 0,
            textAlign: "center",
            fontWeight: 300,
            letterSpacing: "0.04em",
          }}
        >
          Your complete recipe management solution
        </p>

        {/* Feature summary pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 10,
            maxWidth: 800,
          }}
        >
          {features.map((feat, i) => {
            const pillDelay = 90 + i * 7;
            const pillScale = spring({
              frame: frame - pillDelay,
              fps,
              from: 0,
              to: 1,
              config: { damping: 10, stiffness: 100 },
            });

            return (
              <div
                key={i}
                style={{
                  padding: "8px 20px",
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transform: `scale(${pillScale})`,
                }}
              >
                <span>{feat.icon}</span>
                {feat.text}
              </div>
            );
          })}
        </div>

        {/* CTA button */}
        <div
          style={{
            marginTop: 20,
            padding: "18px 55px",
            borderRadius: 16,
            background: "white",
            color: "#667eea",
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'Raleway', system-ui, sans-serif",
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            boxShadow: `0 8px 30px rgba(0,0,0,0.2)`,
          }}
        >
          Get Started Now
        </div>

        {/* Tech badges */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 16,
            opacity: badgesOpacity,
          }}
        >
          {["React 18", "Firebase", "Vite", "OpenAI"].map((tech, i) => (
            <div
              key={i}
              style={{
                padding: "6px 18px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
