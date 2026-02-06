import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const favorites = [
  {
    name: "Grandma's Apple Pie",
    emoji: "🥧",
    rating: 5,
    time: "60 min",
    cat: "Desserts",
    catColor: "#e91e63",
  },
  {
    name: "Classic Tiramisu",
    emoji: "🍰",
    rating: 5,
    time: "40 min",
    cat: "Desserts",
    catColor: "#e91e63",
  },
  {
    name: "Homemade Pizza",
    emoji: "🍕",
    rating: 4,
    time: "35 min",
    cat: "Main Course",
    catColor: "#ff5722",
  },
  {
    name: "Beef Stew",
    emoji: "🥘",
    rating: 4,
    time: "90 min",
    cat: "Main Course",
    catColor: "#ff5722",
  },
  {
    name: "Chocolate Mousse",
    emoji: "🍫",
    rating: 5,
    time: "20 min",
    cat: "Desserts",
    catColor: "#e91e63",
  },
  {
    name: "Greek Salad",
    emoji: "🥗",
    rating: 4,
    time: "10 min",
    cat: "Salads",
    catColor: "#4caf50",
  },
];

export const FavoritesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 20], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Popup overlay
  const overlayOpacity = interpolate(frame, [10, 25], [0, 0.5], {
    extrapolateRight: "clamp",
  });

  // Popup scale
  const popupScale = spring({
    frame: frame - 10,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 14, stiffness: 50 },
  });
  const popupOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

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
          Favorites Popup
        </span>
      </div>

      {/* Dark overlay - matches .modalOverlay rgba(0,0,0,0.7) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          opacity: overlayOpacity,
          zIndex: 5,
        }}
      />

      {/* Favorites popup - matching actual FavoritesPopup */}
      <div
        style={{
          width: 900,
          maxHeight: 750,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          overflow: "hidden",
          transform: `scale(${popupScale})`,
          opacity: popupOpacity,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#333",
              fontFamily: "'Raleway', system-ui, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: "#ffc107", fontSize: 28 }}>★</span>
            Favorite Recipes - All Recipes
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#666",
            }}
          >
            ✕
          </div>
        </div>

        {/* Recipe cards grid */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            justifyContent: "center",
          }}
        >
          {favorites.map((fav, i) => {
            const cardDelay = 25 + i * 10;
            const cardScale = spring({
              frame: frame - cardDelay,
              fps,
              from: 0.85,
              to: 1,
              config: { damping: 12, stiffness: 80 },
            });
            const cardOpacity = interpolate(
              frame,
              [cardDelay, cardDelay + 15],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            const heartBeat = 1 + Math.sin(frame * 0.12 + i) * 0.06;

            return (
              <div
                key={i}
                style={{
                  width: 250,
                  borderRadius: 14,
                  background: "white",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  border: "1px solid #f0f0f0",
                  overflow: "hidden",
                  transform: `scale(${cardScale})`,
                  opacity: cardOpacity,
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: "100%",
                    height: 120,
                    background: `linear-gradient(135deg, ${fav.catColor}25, ${fav.catColor}08)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 45 }}>{fav.emoji}</span>
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 22,
                      color: "#ffc107",
                      transform: `scale(${heartBeat})`,
                      display: "inline-block",
                    }}
                  >
                    ★
                  </span>
                </div>
                {/* Info */}
                <div style={{ padding: "10px 14px" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#333",
                      fontFamily: "'Raleway', system-ui, sans-serif",
                    }}
                  >
                    {fav.name}
                  </div>
                  <div style={{ display: "flex", gap: 2, margin: "4px 0" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 12,
                          color: s <= fav.rating ? "#ffc107" : "#e0e0e0",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#888",
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span>{fav.time}</span>
                    <span>•</span>
                    <span style={{ color: fav.catColor }}>{fav.cat}</span>
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
