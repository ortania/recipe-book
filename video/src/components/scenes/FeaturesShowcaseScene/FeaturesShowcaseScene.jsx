import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const FeaturesShowcaseScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene label
  const labelOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 25], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Feature cards appear one by one
  const features = [
    {
      icon: "🔍",
      title: "Search",
      desc: "Search recipes by name or ingredients instantly",
      color: "#2196f3",
    },
    {
      icon: "🔽",
      title: "Filter",
      desc: "Filter by prep time, difficulty, and keywords",
      color: "#4caf50",
    },
    {
      icon: "↕️",
      title: "Sort",
      desc: "Sort by name, prep time, or difficulty level",
      color: "#ff9800",
    },
    {
      icon: "🌐",
      title: "Import from URL",
      desc: "Import recipes directly from any website URL",
      color: "#9c27b0",
    },
  ];

  // Search bar demo
  const searchText = "chocolate cake";
  const searchLen = Math.min(
    Math.floor(
      interpolate(frame, [30, 80], [0, searchText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    searchText.length,
  );
  const cursorBlink = Math.sin(frame * 0.25) > 0;

  // Filter dropdown appears
  const filterDropOp = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filterDropY = interpolate(frame, [100, 120], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Filter selections animate
  const filterPrepActive = frame >= 130;
  const filterDiffActive = frame >= 145;

  // Sort dropdown
  const sortDropOp = interpolate(frame, [165, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Import URL demo
  const importUrl = "https://recipes.com/chocolate-cake";
  const importLen = Math.min(
    Math.floor(
      interpolate(frame, [220, 280], [0, importUrl.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    importUrl.length,
  );

  // Import success
  const importSuccessOp = interpolate(frame, [290, 310], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [390, 420], [1, 0], {
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
          Smart Features
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
          marginTop: 40,
        }}
      >
        {/* Left side - Feature cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: 380,
          }}
        >
          {features.map((feat, i) => {
            const cardDelay = 15 + i * 25;
            const cardScale = spring({
              frame: frame - cardDelay,
              fps,
              from: 0.85,
              to: 1,
              config: { damping: 14, stiffness: 50 },
            });
            const cardOp = interpolate(
              frame,
              [cardDelay, cardDelay + 18],
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
                  background: "white",
                  borderRadius: 14,
                  padding: "18px 22px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transform: `scale(${cardScale})`,
                  opacity: cardOp,
                  borderLeft: `4px solid ${feat.color}`,
                }}
              >
                <div
                  style={{ fontSize: 36, minWidth: 50, textAlign: "center" }}
                >
                  {feat.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#333",
                      fontFamily: "'Raleway', system-ui, sans-serif",
                      marginBottom: 4,
                    }}
                  >
                    {feat.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#666",
                      fontFamily: "'Raleway', system-ui, sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {feat.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side - Live demo area */}
        <div
          style={{
            width: 560,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Search bar demo - matches SearchBox */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#667eea",
                marginBottom: 10,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              🔍 Search Demo
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border:
                  searchLen > 0 ? "2px solid #667eea" : "2px solid #e0e0e0",
                background: searchLen > 0 ? "white" : "#f8f9fa",
                fontSize: 16,
                color: searchLen > 0 ? "#333" : "#999",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              {searchLen > 0
                ? searchText.slice(0, searchLen)
                : "Search for labels"}
              {searchLen > 0 && searchLen < searchText.length && (
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
            {/* Results count */}
            {searchLen >= searchText.length && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#4caf50",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                ✓ 3 recipes found
              </div>
            )}
          </div>

          {/* Filter demo - matches filter dropdown */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              opacity: filterDropOp,
              transform: `translateY(${filterDropY}px)`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#4caf50",
                marginBottom: 10,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              🔽 Filter & Sort Demo
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#f0f4ff",
                  border: "1px solid #667eea",
                  color: "#667eea",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Filter ▼
              </div>
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: sortDropOp > 0 ? "#f0f4ff" : "#f8f9fa",
                  border:
                    sortDropOp > 0 ? "1px solid #667eea" : "1px solid #e0e0e0",
                  color: sortDropOp > 0 ? "#667eea" : "#666",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Sorting ▼
              </div>
            </div>
            {/* Filter options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                זמן הכנה:
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["הכל", "מהיר (עד 15 דק')", "בינוני (15-30 דק')"].map(
                  (opt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background:
                          i === 1 && filterPrepActive ? "#667eea" : "#f8f9fa",
                        color: i === 1 && filterPrepActive ? "white" : "#666",
                        fontSize: 12,
                        fontFamily: "'Raleway', system-ui, sans-serif",
                      }}
                    >
                      {opt}
                    </div>
                  ),
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  fontFamily: "'Raleway', system-ui, sans-serif",
                  marginTop: 4,
                }}
              >
                רמת קושי:
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["הכל", "קל", "בינוני", "קשה"].map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background:
                        i === 2 && filterDiffActive ? "#667eea" : "#f8f9fa",
                      color: i === 2 && filterDiffActive ? "white" : "#666",
                      fontSize: 12,
                      fontFamily: "'Raleway', system-ui, sans-serif",
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Import from URL demo */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              opacity: interpolate(frame, [200, 220], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#9c27b0",
                marginBottom: 10,
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              🌐 Import from URL
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px dashed #667eea",
                background: "#f0f4ff",
                fontSize: 14,
                color: importLen > 0 ? "#333" : "#999",
                fontFamily: "'Raleway', system-ui, sans-serif",
                marginBottom: 10,
              }}
            >
              {importLen > 0
                ? importUrl.slice(0, importLen)
                : "Paste recipe URL here..."}
              {importLen > 0 && importLen < importUrl.length && (
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
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Import
              </div>
              {importSuccessOp > 0 && (
                <span
                  style={{
                    fontSize: 14,
                    color: "#4caf50",
                    fontWeight: 600,
                    opacity: importSuccessOp,
                    fontFamily: "'Raleway', system-ui, sans-serif",
                  }}
                >
                  ✓ Recipe imported successfully!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
