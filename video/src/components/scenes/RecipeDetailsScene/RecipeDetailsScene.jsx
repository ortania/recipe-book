import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const RecipeDetailsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const F = "'Raleway', system-ui, sans-serif";

  // Scene label
  const labelOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 25], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Modal overlay
  const overlayOp = interpolate(frame, [5, 20], [0, 0.7], {
    extrapolateRight: "clamp",
  });

  // Card entrance
  const cardScale = spring({
    frame: frame - 8,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const cardOp = interpolate(frame, [8, 28], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scroll simulation - slower
  const scrollY = interpolate(frame, [90, 310], [0, -420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Active tab switches
  const activeTab = frame < 200 ? "ingredients" : "instructions";

  // Ingredient checkmarks
  const checkedCount =
    frame < 110 ? 0 : frame < 135 ? 1 : frame < 155 ? 2 : frame < 175 ? 3 : 3;

  // Instruction checkmarks
  const instrChecked = frame < 230 ? 0 : frame < 260 ? 1 : frame < 285 ? 2 : 2;

  // Notes section expand
  const notesExpanded = frame >= 270;
  const notesContentOp = interpolate(frame, [270, 290], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [420, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ingredients = [
    "2 cups all-purpose flour",
    "1 cup sugar",
    "3 large eggs",
    "200g dark chocolate, melted",
    "1 cup buttermilk",
  ];

  const instructions = [
    "Preheat oven to 180°C. Grease and line a 9-inch round cake pan.",
    "In a large bowl, whisk together flour, sugar, cocoa powder, and baking soda.",
    "Add eggs, buttermilk, and melted chocolate. Mix until smooth.",
  ];

  return (
    <AbsoluteFill
      style={{
        background: "#f2f2f2",
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
          gap: 12,
          zIndex: 30,
        }}
      >
        <div
          style={{
            width: 7,
            height: 42,
            borderRadius: 4,
            background: "linear-gradient(180deg, #667eea, #764ba2)",
          }}
        />
        <span
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "#444",
            fontFamily: F,
            letterSpacing: "0.02em",
          }}
        >
          Recipe Details
        </span>
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          opacity: overlayOp,
          zIndex: 5,
        }}
      />

      {/* Recipe card - ENLARGED */}
      <div
        style={{
          width: 680,
          maxHeight: 960,
          background: "white",
          borderRadius: 24,
          overflow: "hidden",
          transform: `scale(${cardScale})`,
          opacity: cardOp,
          zIndex: 10,
          position: "relative",
        }}
      >
        {/* Header buttons */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#333",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            ✕
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "#333",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            ✏️
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "#dc2626",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            🗑
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ transform: `translateY(${scrollY}px)` }}>
          {/* Image */}
          <div
            style={{
              width: "100%",
              height: 260,
              background:
                "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fdfcfb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 100, opacity: 0.6 }}>🍰</span>
          </div>

          {/* Content */}
          <div style={{ padding: "32px" }}>
            {/* Name */}
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "center",
                marginBottom: 12,
                lineHeight: 1.3,
                fontFamily: F,
              }}
            >
              Chocolate Lava Cake
            </div>

            {/* Rating */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                margin: "10px 0",
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 30,
                    color: s <= 5 ? "#ffc107" : "#e0e0e0",
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "center",
                marginBottom: 20,
                fontSize: 20,
                color: "#666",
                fontFamily: F,
              }}
            >
              <span>Prep 15 min</span>
              <span style={{ fontWeight: "bold" }}>•</span>
              <span>Cook 30 min</span>
              <span style={{ fontWeight: "bold" }}>•</span>
              <span>Medium</span>
            </div>

            {/* Category tags */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  padding: "8px 18px",
                  background: "#f5f5f5",
                  borderRadius: 8,
                  fontSize: 18,
                  color: "#555",
                  fontWeight: 500,
                  fontFamily: F,
                }}
              >
                Desserts
              </span>
              <span
                style={{
                  padding: "8px 18px",
                  background: "#f5f5f5",
                  borderRadius: 8,
                  fontSize: 18,
                  color: "#555",
                  fontWeight: 500,
                  fontFamily: F,
                }}
              >
                Baking
              </span>
            </div>

            {/* Source URL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                padding: 16,
                background: "#f8f9fa",
                borderRadius: 10,
                fontSize: 17,
                fontFamily: F,
              }}
            >
              <span style={{ fontWeight: 600, color: "#666" }}>Source:</span>
              <span style={{ color: "#667eea" }}>
                https://recipes.example.com/cake
              </span>
            </div>

            {/* Notes section */}
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 14,
                marginBottom: 24,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(102,126,234,0.15)",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>📝</span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "white",
                      fontFamily: F,
                    }}
                  >
                    Notes
                  </span>
                </div>
                <span style={{ color: "white", fontSize: 26 }}>
                  {notesExpanded ? "▲" : "▼"}
                </span>
              </div>
              {notesExpanded && (
                <div
                  style={{
                    background: "white",
                    padding: 22,
                    opacity: notesContentOp,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      color: "#333",
                      lineHeight: 1.8,
                      fontFamily: F,
                    }}
                  >
                    Best served warm with vanilla ice cream. Can be prepared
                    ahead and reheated.
                  </span>
                </div>
              )}
            </div>

            {/* Serving selector */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 18,
                background: "#f8f9fa",
                borderRadius: 24,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid #ddd",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  +
                </div>
                <span
                  style={{
                    fontSize: 28,
                    minWidth: 36,
                    textAlign: "center",
                    fontFamily: F,
                  }}
                >
                  4
                </span>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid #ddd",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  -
                </div>
              </div>
              <span style={{ fontSize: 20, color: "#333", fontFamily: F }}>
                Serving 4
              </span>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "3px solid #f0f0f0",
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  color: activeTab === "ingredients" ? "#333" : "#999",
                  borderBottom:
                    activeTab === "ingredients"
                      ? "4px solid #333"
                      : "4px solid transparent",
                  marginBottom: -3,
                  fontFamily: F,
                }}
              >
                Ingredients
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  color: activeTab === "instructions" ? "#333" : "#999",
                  borderBottom:
                    activeTab === "instructions"
                      ? "4px solid #333"
                      : "4px solid transparent",
                  marginBottom: -3,
                  fontFamily: F,
                }}
              >
                Instructions
              </div>
              <div
                style={{
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#999",
                  fontFamily: F,
                  whiteSpace: "nowrap",
                }}
              >
                👨‍🍳 Cooking Mode
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "ingredients" && (
              <div>
                {ingredients.map((ing, i) => {
                  const isChecked = i < checkedCount;
                  const itemOp = interpolate(
                    frame,
                    [30 + i * 8, 42 + i * 8],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "14px 0",
                        borderBottom:
                          i < ingredients.length - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        opacity: itemOp,
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          minWidth: 26,
                          borderRadius: "50%",
                          border: isChecked
                            ? "2px solid #4caf50"
                            : "2px solid #ddd",
                          background: isChecked ? "#4caf50" : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 2,
                        }}
                      >
                        {isChecked && (
                          <span
                            style={{
                              color: "white",
                              fontSize: 14,
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 20,
                          color: isChecked ? "#999" : "#333",
                          textDecoration: isChecked ? "line-through" : "none",
                          lineHeight: 1.5,
                          fontFamily: F,
                        }}
                      >
                        {ing}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "instructions" && (
              <div>
                {instructions.map((inst, i) => {
                  const isChecked = i < instrChecked;
                  const itemOp = interpolate(
                    frame,
                    [205 + i * 10, 218 + i * 10],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "14px 0",
                        borderBottom:
                          i < instructions.length - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        opacity: itemOp,
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          minWidth: 26,
                          borderRadius: "50%",
                          border: isChecked
                            ? "2px solid #4caf50"
                            : "2px solid #ddd",
                          background: isChecked ? "#4caf50" : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 2,
                        }}
                      >
                        {isChecked && (
                          <span
                            style={{
                              color: "white",
                              fontSize: 14,
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 20,
                          color: isChecked ? "#999" : "#333",
                          textDecoration: isChecked ? "line-through" : "none",
                          lineHeight: 1.5,
                          fontFamily: F,
                        }}
                      >
                        {i + 1}. {inst}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
