import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const AuthScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Motion graphic: reveal mask from center
  const revealScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 20, stiffness: 25 },
  });

  // Scene label with slide-in
  const labelOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [5, 25], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Form card - spring entrance
  const formScale = spring({
    frame: frame - 12,
    fps,
    from: 0.7,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const formOpacity = interpolate(frame, [12, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const formY = interpolate(frame, [12, 40], [40, 0], {
    extrapolateRight: "clamp",
  });

  // Email typing animation - slower
  const emailText = "chef@cookbook.com";
  const emailLen = Math.min(
    Math.floor(
      interpolate(frame, [60, 120], [0, emailText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    emailText.length,
  );

  // Password dots - slower
  const passLen = Math.min(
    Math.floor(
      interpolate(frame, [130, 160], [0, 8], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    8,
  );

  // Button hover + click effect - slower
  const btnHover = interpolate(frame, [170, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btnClick = interpolate(frame, [185, 192, 200], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Success toast slides down - slower
  const toastOpacity = interpolate(frame, [205, 220, 245, 265], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const toastY = interpolate(frame, [205, 220], [-30, 0], {
    extrapolateRight: "clamp",
  });

  // Cursor blink
  const cursorVisible = Math.sin(frame * 0.25) > 0;

  // Decorative floating circles - motion graphic
  const circles = [
    { x: 200, y: 200, size: 300, opacity: 0.04 },
    { x: 1600, y: 300, size: 400, opacity: 0.03 },
    { x: 400, y: 800, size: 250, opacity: 0.04 },
    { x: 1500, y: 750, size: 350, opacity: 0.03 },
  ];

  // Exit
  const exitOpacity = interpolate(frame, [350, 380], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      {/* Motion graphic: decorative circles */}
      {circles.map((c, i) => {
        const cScale = spring({
          frame: frame - i * 5,
          fps,
          from: 0,
          to: 1,
          config: { damping: 25, stiffness: 20 },
        });
        const floatY = Math.sin(frame * 0.01 + i * 1.5) * 12;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x - c.size / 2,
              top: c.y - c.size / 2 + floatY,
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(102,126,234,${c.opacity}) 0%, transparent 70%)`,
              transform: `scale(${cScale})`,
            }}
          />
        );
      })}

      {/* Scene label - slide in from left */}
      <div
        style={{
          position: "absolute",
          top: 45,
          left: 60,
          opacity: labelOpacity,
          transform: `translateX(${labelX}px)`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: 6,
            height: 36,
            borderRadius: 3,
            background: "linear-gradient(180deg, #667eea, #764ba2)",
          }}
        />
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "#444",
            fontFamily: "'Raleway', system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          Login Page
        </span>
      </div>

      {/* Success toast */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: "50%",
          transform: `translateX(-50%) translateY(${toastY}px)`,
          background: "#4caf50",
          color: "white",
          padding: "14px 28px",
          borderRadius: 8,
          fontSize: 18,
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(76,175,80,0.35)",
          opacity: toastOpacity,
          zIndex: 20,
          fontFamily: "'Raleway', system-ui, sans-serif",
        }}
      >
        Welcome to Recipe Book App! 👋
      </div>

      {/* Login form card - exact match: login.module.css */}
      <div
        style={{
          width: 440,
          padding: "40px",
          background: "white",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          transform: `scale(${formScale}) translateY(${formY}px)`,
          opacity: formOpacity,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            color: "#333",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 10,
            fontFamily: "'Raleway', system-ui, sans-serif",
          }}
        >
          Login
        </div>

        {/* Email input - matches .loginForm input */}
        <div
          style={{
            padding: "14px 18px",
            border: emailLen > 0 ? "2px solid #667eea" : "2px solid #e0e0e0",
            borderRadius: 12,
            background: emailLen > 0 ? "white" : "#f8f9fa",
            fontSize: 17,
            color: emailLen > 0 ? "#333" : "#999",
            fontFamily: "'Raleway', system-ui, sans-serif",
            boxShadow:
              emailLen > 0 ? "0 0 0 3px rgba(102,126,234,0.1)" : "none",
          }}
        >
          {emailLen > 0 ? emailText.slice(0, emailLen) : "Email"}
          {emailLen > 0 && emailLen < emailText.length && (
            <span
              style={{
                borderRight: cursorVisible
                  ? "2px solid #667eea"
                  : "2px solid transparent",
                marginLeft: 1,
              }}
            />
          )}
        </div>

        {/* Password input - matches .passwordInput */}
        <div
          style={{
            padding: "14px 18px",
            border: passLen > 0 ? "2px solid #667eea" : "2px solid #e0e0e0",
            borderRadius: 12,
            background: passLen > 0 ? "white" : "#f8f9fa",
            fontSize: 17,
            color: passLen > 0 ? "#333" : "#999",
            fontFamily: "'Raleway', system-ui, sans-serif",
            boxShadow: passLen > 0 ? "0 0 0 3px rgba(102,126,234,0.1)" : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{passLen > 0 ? "●".repeat(passLen) : "Password"}</span>
          {passLen > 0 && (
            <span style={{ color: "#666", fontSize: 18 }}>👁</span>
          )}
        </div>

        {/* Login button - matches button[type="submit"] gradient */}
        <div
          style={{
            padding: "16px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: 17,
            fontWeight: 600,
            textAlign: "center",
            marginTop: 6,
            fontFamily: "'Raleway', system-ui, sans-serif",
            boxShadow:
              btnHover > 0
                ? `0 8px 20px rgba(102,126,234,0.4)`
                : "0 4px 10px rgba(102,126,234,0.2)",
            transform:
              btnClick > 0
                ? "translateY(0px) scale(0.98)"
                : btnHover > 0
                  ? "translateY(-2px)"
                  : "none",
          }}
        >
          {frame > 195 ? "Logging in..." : "Login"}
        </div>

        {/* Forgot password - matches .forgotPassword */}
        <div
          style={{
            textAlign: "center",
            fontSize: 15,
            color: "#666",
            fontFamily: "'Raleway', system-ui, sans-serif",
          }}
        >
          <span
            style={{
              color: "#667eea",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Forgot Password?
          </span>
        </div>

        {/* Sign up link - matches .signupLink */}
        <div
          style={{
            textAlign: "center",
            fontSize: 15,
            color: "#666",
            fontFamily: "'Raleway', system-ui, sans-serif",
          }}
        >
          Don't have an account?{" "}
          <span
            style={{
              color: "#667eea",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Sign Up
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
