import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const SceneIntroSlide = ({
  icon,
  title,
  subtitle,
  features = [],
  accentColor = "#667eea",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const F = "'Raleway', system-ui, sans-serif";

  // Background gradient angle
  const gradAngle = interpolate(frame, [0, 120], [135, 145], {
    extrapolateRight: "clamp",
  });

  // Icon entrance
  const iconScale = spring({
    frame: frame - 5,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10, stiffness: 60 },
  });
  const iconOp = interpolate(frame, [5, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Title entrance
  const titleOp = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [15, 35], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Subtitle entrance
  const subOp = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
  });

  // Features entrance (staggered)
  const featureDelays = features.map((_, i) => 45 + i * 12);

  // Exit
  const exitOp = interpolate(frame, [120, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative line
  const lineWidth = spring({
    frame: frame - 25,
    fps,
    from: 0,
    to: 200,
    config: { damping: 15, stiffness: 40 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradAngle}deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOp,
      }}
    >
      {/* Subtle particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const pOp = interpolate(frame, [i * 5, i * 5 + 20], [0, 0.3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${10 + ((i * 13) % 80)}%`,
              top: `${15 + ((i * 17) % 70)}%`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: "50%",
              background: accentColor,
              opacity: pOp,
            }}
          />
        );
      })}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          maxWidth: 900,
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 80,
            transform: `scale(${iconScale})`,
            opacity: iconOp,
            filter: "drop-shadow(0 4px 20px rgba(102,126,234,0.4))",
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "white",
            fontFamily: F,
            textAlign: "center",
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            color: "rgba(255,255,255,0.7)",
            fontFamily: F,
            textAlign: "center",
            opacity: subOp,
            transform: `translateY(${subY}px)`,
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>

        {/* Feature bullets */}
        {features.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 30,
              marginTop: 20,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {features.map((feat, i) => {
              const fOp = interpolate(
                frame,
                [featureDelays[i], featureDelays[i] + 15],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              const fY = interpolate(
                frame,
                [featureDelays[i], featureDelays[i] + 15],
                [15, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={i}
                  style={{
                    opacity: fOp,
                    transform: `translateY(${fY}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "12px 24px",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{feat.icon}</span>
                  <span
                    style={{
                      fontSize: 18,
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: F,
                      fontWeight: 500,
                    }}
                  >
                    {feat.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
