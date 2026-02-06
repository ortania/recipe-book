import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const CookingModeScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene label
  const labelOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 25], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Page entrance
  const pageScale = spring({
    frame: frame - 5,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 16, stiffness: 40 },
  });
  const pageOpacity = interpolate(frame, [5, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Active tab switches from ingredients to instructions
  const activeTab = frame < 140 ? "ingredients" : "instructions";

  // Current step animation
  const ingredientStep = Math.floor(
    interpolate(frame, [40, 65, 90, 115, 135], [0, 1, 2, 3, 3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const instructionStep = Math.floor(
    interpolate(frame, [155, 185, 215], [0, 1, 2], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const currentStep =
    activeTab === "ingredients" ? ingredientStep : instructionStep;

  const ingredients = [
    "2 cups all-purpose flour",
    "1 cup sugar",
    "3 large eggs",
    "200g dark chocolate, melted",
  ];

  const instructions = [
    "Preheat oven to 180°C. Grease and line a 9-inch round cake pan.",
    "In a large bowl, whisk together flour, sugar, cocoa powder, and baking soda.",
    "Add eggs, buttermilk, and melted chocolate. Mix until smooth and pour into pan.",
  ];

  const items = activeTab === "ingredients" ? ingredients : instructions;
  const totalSteps = items.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Timer animation (appears in instructions tab)
  const timerMinutes = Math.floor(
    interpolate(frame, [180, 240], [25, 22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const timerSeconds = Math.floor(
    interpolate(frame, [180, 240], [0, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Tab switch animation
  const tabSwitchFlash = interpolate(frame, [138, 145, 155], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Mic button pulse
  const micPulse = Math.sin(frame * 0.08) * 0.05 + 1;

  // Exit
  const exitOpacity = interpolate(frame, [380, 410], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "white",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 60,
          opacity: labelOpacity,
          transform: `translateX(${labelX}px)`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: 6,
            height: 36,
            borderRadius: 3,
            background: "linear-gradient(180deg, #10b981, #059669)",
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
          Cooking Mode
        </span>
      </div>

      {/* Cooking mode card */}
      <div
        style={{
          width: 1000,
          maxHeight: 850,
          background: "white",
          borderRadius: 0,
          overflow: "hidden",
          transform: `scale(${pageScale})`,
          opacity: pageOpacity,
          display: "flex",
          flexDirection: "column",
          marginTop: 40,
        }}
      >
        {/* Header buttons - matches .headerButtonsCooking */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 24px",
          }}
        >
          {/* Mic button - matches .voiceToggleButton */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 50,
              background: "#e9edf2",
              fontSize: 15,
              color: "black",
              fontFamily: "'Raleway', system-ui, sans-serif",
              transform: `scale(${micPulse})`,
            }}
          >
            <span style={{ fontSize: 16 }}>🎤</span>
            <span>Start Mic</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Info button - matches .infoButton */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid #e0e0e0",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#0369a1",
              }}
            >
              ?
            </div>
            {/* Close button */}
            <div
              style={{
                fontSize: 24,
                color: "#333",
                cursor: "pointer",
              }}
            >
              ✕
            </div>
          </div>
        </div>

        {/* Serving selector - matches .servingSelector */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* - button */}
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                border: "2px solid #e0e0e0",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#666",
              }}
            >
              −
            </div>
            <span
              style={{
                fontSize: 28,
                minWidth: 50,
                textAlign: "center",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              4
            </span>
            {/* + button */}
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                border: "2px solid #e0e0e0",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#666",
              }}
            >
              +
            </div>
          </div>
          <span
            style={{
              fontSize: 18,
              fontFamily: "'Raleway', system-ui, sans-serif",
            }}
          >
            Serving 4
          </span>
        </div>

        {/* Tabs - matches .tabs / .tab / .activeTab */}
        <div
          style={{
            display: "flex",
            background: "white",
            width: "100%",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "14px 20px",
              textAlign: "center",
              fontSize: 17,
              fontWeight: 600,
              color: activeTab === "ingredients" ? "#10b981" : "#94a3b8",
              borderBottom:
                activeTab === "ingredients"
                  ? "2px solid #10b981"
                  : "2px solid #d9d8d8",
              fontFamily: "'Raleway', system-ui, sans-serif",
              background:
                tabSwitchFlash > 0 && activeTab === "ingredients"
                  ? `rgba(16,185,129,${tabSwitchFlash * 0.05})`
                  : "transparent",
            }}
          >
            Ingredients
          </div>
          <div
            style={{
              flex: 1,
              padding: "14px 20px",
              textAlign: "center",
              fontSize: 17,
              fontWeight: 600,
              color: activeTab === "instructions" ? "#10b981" : "#94a3b8",
              borderBottom:
                activeTab === "instructions"
                  ? "2px solid #10b981"
                  : "2px solid #d9d8d8",
              fontFamily: "'Raleway', system-ui, sans-serif",
              background:
                tabSwitchFlash > 0 && activeTab === "instructions"
                  ? `rgba(16,185,129,${tabSwitchFlash * 0.05})`
                  : "transparent",
            }}
          >
            Instructions
          </div>
        </div>

        {/* Current step content - matches .ingredientText/.instructionText large centered text */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 50px",
            minHeight: 180,
          }}
        >
          <div
            style={{
              fontSize: 32,
              textAlign: "center",
              lineHeight: 1.7,
              color: "#333",
              fontFamily: "'Raleway', system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            {items[currentStep]}
          </div>
        </div>

        {/* Progress section - matches .progressSection */}
        <div style={{ padding: "0 32px 16px" }}>
          {/* Step info + badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span
              style={{
                fontSize: 16,
                color: "#10b981",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress bar - matches .progressSlider with #10b981 fill */}
          <div
            style={{
              width: "100%",
              height: 6,
              borderRadius: 10,
              background: "#e5e7eb",
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#10b981",
                borderRadius: 10,
                transition: "width 0.3s",
              }}
            />
          </div>

          {/* Navigation buttons - matches .navButton .restartButton .nextButton */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                flex: 1,
                padding: "14px 20px",
                textAlign: "center",
                fontSize: 16,
                fontWeight: 700,
                background: currentStep === 0 ? "#f3f4f6" : "#f1f5f9",
                color: currentStep === 0 ? "#9ca3af" : "#94a3b8",
                borderRadius: 12,
                opacity: currentStep === 0 ? 0.6 : 1,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              ← Previous
            </div>
            <div
              style={{
                flex: 1,
                padding: "14px 20px",
                textAlign: "center",
                fontSize: 16,
                fontWeight: 700,
                background: "#475569",
                color: "white",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              ↻ Restart
            </div>
            <div
              style={{
                flex: 1,
                padding: "14px 20px",
                textAlign: "center",
                fontSize: 16,
                fontWeight: 700,
                background: "#10b981",
                color: "white",
                borderRadius: 12,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Next →
            </div>
          </div>

          {/* Timer section - only in instructions tab - matches .timerSection #e0f2fe */}
          {activeTab === "instructions" && (
            <div
              style={{
                padding: "20px 24px",
                background: "#e0f2fe",
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
              }}
            >
              {/* Timer title */}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0369a1",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                <span>🔥</span> Cooking Timer
              </div>

              {/* Timer controls - matches .timerControls */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* - button */}
                <div
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 8,
                    background: "white",
                    border: "2px solid #bae6fd",
                    color: "#0369a1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  −
                </div>
                {/* Timer display */}
                <div
                  style={{
                    background: "white",
                    borderRadius: 8,
                    padding: "10px 30px",
                    minWidth: 150,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#0c4a6e",
                      fontFamily: "'SF Mono', monospace",
                    }}
                  >
                    {String(timerMinutes).padStart(2, "0")}:
                    {String(timerSeconds).padStart(2, "0")}
                  </span>
                </div>
                {/* + button */}
                <div
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 8,
                    background: "white",
                    border: "2px solid #bae6fd",
                    color: "#0369a1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  +
                </div>
              </div>

              {/* Start button - matches .startButton */}
              <div
                style={{
                  padding: "10px 20px",
                  fontSize: 17,
                  background: "white",
                  color: "#0c4a6e",
                  borderRadius: 8,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                ▶ Start
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
