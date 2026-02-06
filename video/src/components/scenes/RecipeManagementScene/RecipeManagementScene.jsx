import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const RecipeManagementScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 25], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Modal overlay
  const overlayOpacity = interpolate(frame, [8, 25], [0, 0.7], {
    extrapolateRight: "clamp",
  });

  // Form card spring entrance
  const formScale = spring({
    frame: frame - 10,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const formOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Form scroll simulation - scroll down over time
  const scrollY = interpolate(frame, [60, 250], [0, -420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typing animation for recipe name
  const recipeName = "Chocolate Lava Cake";
  const nameLen = Math.min(
    Math.floor(
      interpolate(frame, [45, 90], [0, recipeName.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    recipeName.length,
  );

  const cursorBlink = Math.sin(frame * 0.25) > 0;

  // Exit
  const exitOpacity = interpolate(frame, [390, 420], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Field appearance helper
  const fieldOp = (delay) =>
    interpolate(frame, [delay, delay + 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

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
          gap: 10,
          zIndex: 30,
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
          Add / Edit Recipe
        </span>
      </div>

      {/* Dark overlay - matches modal.module.css .modalOverlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          opacity: overlayOpacity,
          zIndex: 5,
        }}
      />

      {/* Add Recipe form - matches form.module.css .form in Modal */}
      <div
        style={{
          width: 480,
          maxHeight: 820,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          transform: `scale(${formScale})`,
          opacity: formOpacity,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Scrollable content */}
        <div
          style={{
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            transform: `translateY(${scrollY}px)`,
          }}
        >
          {/* Title - matches .formTitle */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#333",
              textAlign: "center",
              fontFamily: "'Raleway', system-ui, sans-serif",
              marginBottom: 4,
            }}
          >
            Add New Recipe
          </div>

          {/* Import button - matches .importBtn */}
          <div
            style={{
              opacity: fieldOp(20),
              padding: "10px 16px",
              borderRadius: 8,
              background: "#f0f4ff",
              border: "1px dashed #667eea",
              color: "#667eea",
              fontSize: 15,
              fontWeight: 500,
              textAlign: "center",
              fontFamily: "'Raleway', system-ui, sans-serif",
            }}
          >
            🔗 Import Recipe from Web
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "#e0e0e0",
              margin: "4px 0",
              opacity: fieldOp(25),
            }}
          />

          {/* Recipe Name * - matches form input */}
          <div style={{ opacity: fieldOp(30) }}>
            <div
              style={{
                padding: "12px 16px",
                border: nameLen > 0 ? "2px solid #667eea" : "2px solid #e0e0e0",
                borderRadius: 8,
                background: nameLen > 0 ? "white" : "#f8f9fa",
                fontSize: 16,
                color: nameLen > 0 ? "#333" : "#999",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              {nameLen > 0 ? recipeName.slice(0, nameLen) : "Recipe Name *"}
              {nameLen > 0 && nameLen < recipeName.length && (
                <span
                  style={{
                    borderRight: cursorBlink
                      ? "2px solid #667eea"
                      : "2px solid transparent",
                    marginLeft: 1,
                  }}
                />
              )}
            </div>
          </div>

          {/* 📝 Ingredients section - matches .listSection with drag handles */}
          <div style={{ opacity: fieldOp(50) }}>
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
                  fontWeight: 600,
                  color: "#333",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                📝 Ingredients
              </span>
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  background: "#667eea",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                + Add
              </div>
            </div>
            {["2 cups all-purpose flour", "1 cup sugar", "3 large eggs"].map(
              (ing, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                    opacity: fieldOp(55 + i * 8),
                  }}
                >
                  <span style={{ color: "#ccc", fontSize: 14 }}>⠿</span>
                  <div
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#333",
                      background: "white",
                      fontFamily: "'Raleway', system-ui, sans-serif",
                    }}
                  >
                    {ing}
                  </div>
                  <span
                    style={{ color: "#ef5350", fontSize: 14, fontWeight: 600 }}
                  >
                    ✕
                  </span>
                </div>
              ),
            )}
          </div>

          {/* 👨‍🍳 Instructions section - matches .listSection */}
          <div style={{ opacity: fieldOp(85) }}>
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
                  fontWeight: 600,
                  color: "#333",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                👨‍🍳 Instructions
              </span>
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  background: "#667eea",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                + Add
              </div>
            </div>
            {["Preheat oven to 180°C", "Mix dry ingredients together"].map(
              (inst, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 6,
                    opacity: fieldOp(90 + i * 8),
                  }}
                >
                  <span style={{ color: "#ccc", fontSize: 14, marginTop: 8 }}>
                    ⠿
                  </span>
                  <div
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#333",
                      background: "white",
                      minHeight: 40,
                      fontFamily: "'Raleway', system-ui, sans-serif",
                    }}
                  >
                    {inst}
                  </div>
                  <span
                    style={{
                      color: "#ef5350",
                      fontSize: 14,
                      fontWeight: 600,
                      marginTop: 8,
                    }}
                  >
                    ✕
                  </span>
                </div>
              ),
            )}
          </div>

          {/* Prep Time + Cook Time row - matches .difficultySection */}
          <div style={{ display: "flex", gap: 12, opacity: fieldOp(110) }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginBottom: 4,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                ⏱️ זמן הכנה
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                  background: "#f8f9fa",
                  fontSize: 14,
                  color: "#333",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                15 min
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginBottom: 4,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                🔥 זמן בישול
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                  background: "#f8f9fa",
                  fontSize: 14,
                  color: "#333",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                30 min
              </div>
            </div>
          </div>

          {/* Servings + Difficulty row */}
          <div style={{ display: "flex", gap: 12, opacity: fieldOp(120) }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginBottom: 4,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Servings
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                  background: "#f8f9fa",
                  fontSize: 14,
                  color: "#333",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                4
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginBottom: 4,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Difficulty
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                  background: "#f8f9fa",
                  fontSize: 14,
                  color: "#333",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Medium <span style={{ fontSize: 10 }}>▼</span>
              </div>
            </div>
          </div>

          {/* Source URL */}
          <div style={{ opacity: fieldOp(130) }}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 4,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Source URL
            </div>
            <div
              style={{
                padding: "10px 12px",
                border: "2px solid #e0e0e0",
                borderRadius: 8,
                background: "#f8f9fa",
                fontSize: 14,
                color: "#999",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Source URL (where recipe is from)
            </div>
          </div>

          {/* Image */}
          <div style={{ opacity: fieldOp(140) }}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 4,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Image (Optional)
            </div>
            <div
              style={{
                padding: "10px 12px",
                border: "2px solid #e0e0e0",
                borderRadius: 8,
                background: "#f8f9fa",
                fontSize: 14,
                color: "#999",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Image URL (optional)
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginTop: 6,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Or upload from computer:{" "}
              <span style={{ color: "#667eea" }}>Choose file</span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ opacity: fieldOp(150) }}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 4,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Notes
            </div>
            <div
              style={{
                padding: "10px 12px",
                border: "2px solid #e0e0e0",
                borderRadius: 8,
                background: "#f8f9fa",
                fontSize: 14,
                color: "#999",
                minHeight: 50,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Notes (optional - personal comments, tips)
            </div>
          </div>

          {/* Rating - matches star rating from AddRecipe */}
          <div style={{ opacity: fieldOp(160) }}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 4,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Rating
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 28,
                    color: s <= 4 ? "#ffc107" : "#e0e0e0",
                  }}
                >
                  ★
                </span>
              ))}
              <span
                style={{
                  fontSize: 13,
                  color: "#666",
                  textDecoration: "underline",
                  marginLeft: 8,
                }}
              >
                Clear
              </span>
            </div>
          </div>

          {/* Categories select */}
          <div style={{ opacity: fieldOp(170) }}>
            <div
              style={{
                padding: "10px 12px",
                border: "2px solid #e0e0e0",
                borderRadius: 8,
                background: "#f8f9fa",
                fontSize: 14,
                color: "#333",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              <div style={{ color: "#667eea", fontWeight: 500 }}>Desserts</div>
              <div style={{ color: "#999" }}>Main Course</div>
              <div style={{ color: "#999" }}>Salads</div>
            </div>
          </div>

          {/* Favorite toggle - matches .favoriteToggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: fieldOp(180),
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: "2px solid #667eea",
                background: "#667eea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 12,
              }}
            >
              ✓
            </div>
            <span
              style={{
                fontSize: 15,
                color: "#333",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              ★ Favorite
            </span>
          </div>

          {/* Form buttons - matches .formButtons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 8,
              opacity: fieldOp(190),
            }}
          >
            <div
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 12,
                background: "#e0e0e0",
                color: "#333",
                fontSize: 16,
                fontWeight: 600,
                textAlign: "center",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Cancel
            </div>
            <div
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontSize: 16,
                fontWeight: 600,
                textAlign: "center",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              Add Recipe
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
