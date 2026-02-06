import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const tabs = [
  { id: "cups", label: "כוסות", icon: "🥤" },
  { id: "spoons", label: "כפות", icon: "🥄" },
  { id: "temp", label: "טמפרטורה", icon: "🌡️" },
  { id: "pans", label: "תבניות", icon: "🍰" },
  { id: "eggs", label: "ביצים", icon: "🥚" },
  { id: "faq", label: "שאלות", icon: "❓" },
];

const conversions = [
  { item: "כוס קמח מלא", amount: "140 גרם" },
  { item: "כוס סוכר", amount: "200 גרם" },
  { item: "כוס חמאה", amount: "230 גרם" },
  { item: "כוס אבקת סוכר", amount: "120 גרם" },
  { item: "כוס שוקולד צ'יפס", amount: "200 גרם" },
  { item: "כוס שמן", amount: "200 גרם" },
  { item: "כוס דבש", amount: "320 גרם" },
  { item: "כוס אורז ארוך", amount: "200 גרם" },
];

export const FeaturesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 20], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Page scale
  const pageScale = spring({
    frame: frame - 5,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 15, stiffness: 50 },
  });
  const pageOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Active tab - stays on each tab for a longer period, no interpolation jumps
  const activeTab =
    frame < 70 ? 0 : frame < 110 ? 1 : frame < 150 ? 2 : frame < 190 ? 3 : 0;

  // Search bar typing
  const searchText = "קמח";
  const searchLen = Math.min(
    Math.floor(
      interpolate(frame, [90, 110], [0, searchText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    searchText.length,
  );

  const exitOpacity = interpolate(frame, [320, 350], [1, 0], {
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
          top: 45,
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
          Conversion Tables
        </span>
      </div>

      {/* Conversion tables page */}
      <div
        style={{
          width: 1000,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
          overflow: "hidden",
          transform: `scale(${pageScale})`,
          opacity: pageOpacity,
          marginTop: 30,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 32px",
            textAlign: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#333",
              fontFamily: "'Raleway', system-ui, sans-serif",
              marginBottom: 8,
            }}
          >
            טבלת המרות למטבח
          </div>
          <div style={{ fontSize: 16, color: "#888", direction: "rtl" }}>
            המרת מידות אפייה ובישול - כל המידע שאתם צריכים במקום אחד
          </div>

          {/* Search bar */}
          <div
            style={{
              margin: "16px auto 0",
              maxWidth: 500,
              padding: "10px 16px",
              borderRadius: 10,
              border: "2px solid #e9ecef",
              background: "white",
              display: "flex",
              alignItems: "center",
              gap: 10,
              direction: "rtl",
            }}
          >
            <span style={{ fontSize: 16 }}>🔍</span>
            <span
              style={{
                fontSize: 15,
                color: searchLen > 0 ? "#333" : "#999",
                fontFamily: "'Raleway', system-ui, sans-serif",
              }}
            >
              {searchLen > 0
                ? searchText.slice(0, searchLen)
                : "חפש המרה... (לדוגמה: קמח, סוכר)"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "12px 20px",
            overflowX: "hidden",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {tabs.map((tab, i) => {
            const isActive = i === activeTab;
            const tabDelay = 20 + i * 5;
            const tabOpacity = interpolate(
              frame,
              [tabDelay, tabDelay + 12],
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
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: isActive ? "#667eea" : "white",
                  border: isActive ? "2px solid #667eea" : "2px solid #e9ecef",
                  color: isActive ? "white" : "#666",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: tabOpacity,
                  whiteSpace: "nowrap",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        {/* Conversion rows */}
        <div style={{ padding: "8px 20px", direction: "rtl" }}>
          {conversions.map((conv, i) => {
            const rowDelay = 30 + i * 6;
            const rowOpacity = interpolate(
              frame,
              [rowDelay, rowDelay + 12],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const rowX = interpolate(
              frame,
              [rowDelay, rowDelay + 12],
              [20, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "#f8f9fa",
                  borderRadius: 8,
                  marginBottom: 6,
                  opacity: rowOpacity,
                  transform: `translateX(${rowX}px)`,
                  fontSize: 16,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                <span style={{ color: "#333", fontWeight: 500 }}>
                  {conv.item}
                </span>
                <span style={{ color: "#667eea", fontWeight: 600 }}>
                  {conv.amount}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
