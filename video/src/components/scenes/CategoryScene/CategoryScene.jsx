import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// Exact categories from the app screenshot
const categories = [
  { name: "All", color: "#999" },
  { name: "Salads", color: "#4caf50" },
  { name: "Breakfast", color: "#ff9800" },
  { name: "Main Dishes", color: "#e91e63", description: "Main course recipes" },
  { name: "Side Dishes", color: "#9c27b0" },
  { name: "Desserts", color: "#f44336" },
  { name: "Bread", color: "#795548" },
  { name: "Veganism", color: "#4caf50" },
  { name: "Kids", color: "#2196f3" },
  { name: "Tofu", color: "#607d8b" },
];

const navLinks = [
  { name: "Home", icon: "🏠" },
  { name: "Categories", icon: "📋", active: true },
  { name: "Conversions", icon: "🔢" },
];

// Recipe data grouped by category sections (matching screenshot)
const sideDishesSectionRecipes = [
  {
    name: "עוגיות בננה-שקדים רכות",
    time: "10 min",
    rating: 0,
    difficulty: "Easy",
    emoji: "🍪",
  },
  {
    name: "עוגת בננות ושוקולד טבעונית",
    time: "",
    rating: 4,
    difficulty: "",
    emoji: "🍰",
  },
  {
    name: "עוגת גבינה פשוטה",
    time: "",
    rating: 0,
    difficulty: "",
    emoji: "🧁",
  },
];

const breadSectionRecipes = [
  { name: "לחם", time: "", rating: 0, difficulty: "", emoji: "🍞" },
];

const topRowRecipes = [
  {
    name: "מתכוני כדורי שוקולד",
    time: "",
    rating: 0,
    difficulty: "",
    emoji: "🍫",
  },
  {
    name: "חטיף תמרים בריא בטעם שוקולד",
    time: "",
    rating: 0,
    difficulty: "Easy",
    emoji: "🥜",
  },
  {
    name: "טורט תפוחים פשוטה",
    time: "",
    rating: 0,
    difficulty: "Easy",
    emoji: "🍎",
  },
  {
    name: "כדורי שקדים תמאת בוטנים ומייפל",
    time: "10 min",
    rating: 0,
    difficulty: "Easy",
    emoji: "🥜",
  },
  {
    name: "עוגה בחושה בטעמים שונים",
    time: "10 min",
    rating: 0,
    difficulty: "Easy",
    emoji: "🎂",
  },
];

export const CategoryScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const F = "'Raleway', system-ui, sans-serif";

  // Scene label
  const labelOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 25], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Sidebar slide in
  const sidebarX = spring({
    frame: frame - 3,
    fps,
    from: -230,
    to: 0,
    config: { damping: 18, stiffness: 40 },
  });

  // Categories panel slide in
  const catPanelX = spring({
    frame: frame - 15,
    fps,
    from: -260,
    to: 0,
    config: { damping: 16, stiffness: 35 },
  });
  const catPanelOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Selected category - discrete steps (matching screenshot: starts on "All")
  const selectedIdx =
    frame < 100 ? 0 : frame < 140 ? 3 : frame < 180 ? 5 : frame < 220 ? 6 : 0;

  // Main content
  const contentOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Edit Category modal
  const showEditModal = frame >= 240 && frame < 340;
  const editOverlayOp = interpolate(frame, [240, 258], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const editModalScale = spring({
    frame: frame - 242,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 14, stiffness: 45 },
  });
  const editModalOp = interpolate(frame, [242, 262], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#9B59B6",
    "#3498DB",
    "#F1C40F",
    "#2ECC71",
    "#E67E22",
    "#1ABC9C",
  ];
  const selectedColorIdx =
    frame < 280 ? 0 : frame < 300 ? 3 : frame < 315 ? 5 : 7;

  // Exit
  const exitOpacity = interpolate(frame, [410, 440], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Recipe card component (square image like the real app)
  const RecipeCard = ({ recipe, delay, size = 155 }) => {
    const cardScale = spring({
      frame: frame - delay,
      fps,
      from: 0.85,
      to: 1,
      config: { damping: 12, stiffness: 80 },
    });
    const cardOp = interpolate(frame, [delay, delay + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const colors = ["#e8d5b7", "#d4a574", "#c9a96e", "#b8956a", "#dcc8a0"];
    const bgColor = colors[Math.abs(recipe.name.length) % colors.length];

    return (
      <div
        style={{
          width: size,
          transform: `scale(${cardScale})`,
          opacity: cardOp,
        }}
      >
        {/* Square image container */}
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span style={{ fontSize: size * 0.35, opacity: 0.7 }}>
            {recipe.emoji}
          </span>
          {/* Favorite button - top right like real app */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#ccc",
            }}
          >
            ☆
          </div>
        </div>
        {/* Info below image - matches .recipeInfo */}
        <div style={{ padding: "8px 4px" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
              fontFamily: F,
              lineHeight: 1.3,
              marginBottom: 3,
            }}
          >
            {recipe.name}
          </div>
          {recipe.rating > 0 && (
            <div style={{ display: "flex", gap: 2, margin: "3px 0" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 13,
                    color: s <= recipe.rating ? "#ffc107" : "#e0e0e0",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          )}
          {(recipe.time || recipe.difficulty) && (
            <div
              style={{
                fontSize: 12,
                color: "#999",
                display: "flex",
                gap: 4,
                fontFamily: F,
              }}
            >
              {recipe.time && <span>{recipe.time}</span>}
              {recipe.time && recipe.difficulty && <span>•</span>}
              {recipe.difficulty && <span>{recipe.difficulty}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#f2f2f2", opacity: exitOpacity }}>
      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: 22,
          right: 50,
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
            width: 7,
            height: 42,
            borderRadius: 4,
            background: "linear-gradient(180deg, #667eea, #764ba2)",
          }}
        />
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#444",
            fontFamily: F,
            letterSpacing: "0.02em",
          }}
        >
          Categories & Recipes
        </span>
      </div>

      {/* ===== LEFT SIDEBAR NAV - exact match: #f2f2f2, 230px, border-right #d1d1d1 ===== */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 230,
          height: "100%",
          background: "#f2f2f2",
          borderRight: "1px solid #d1d1d1",
          display: "flex",
          flexDirection: "column",
          padding: "24px 24px",
          transform: `translateX(${sidebarX}px)`,
          zIndex: 10,
        }}
      >
        {/* Logo - "Cook" grey + "book" blue */}
        <div style={{ marginBottom: 24, paddingLeft: 8 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: "#aaa",
              fontFamily: F,
            }}
          >
            Cook
          </span>
          <span
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: "#3498db",
              fontFamily: F,
            }}
          >
            book
          </span>
        </div>

        {/* Nav links - matches .navLink with icons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            marginTop: 40,
          }}
        >
          {navLinks.map((link, i) => (
            <div
              key={i}
              style={{
                padding: "10px 16px",
                borderRadius: 6,
                background: link.active ? "#e8eaed" : "transparent",
                fontWeight: link.active ? 500 : 400,
                color: link.active ? "#202124" : "#333",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontFamily: F,
              }}
            >
              <span style={{ fontSize: 17 }}>{link.icon}</span>
              {link.name}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "#ddd", margin: "16px 0" }} />

        {/* Chat Log */}
        <div
          style={{
            padding: "10px 16px",
            color: "#5f6368",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: F,
          }}
        >
          <span style={{ fontSize: 17 }}>💬</span> Chat Log
        </div>

        {/* Logout at bottom */}
        <div
          style={{
            marginTop: "auto",
            padding: "10px 16px",
            color: "#5f6368",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 17 }}>🚪</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: F }}>Logout</span>
            <span style={{ fontSize: 12, color: "#999", fontFamily: F }}>
              (Tania)
            </span>
          </div>
        </div>
      </div>

      {/* ===== CATEGORIES LIST PANEL - matches .groupList: sticky, border-right #d1d1d1, min-width 250px ===== */}
      <div
        style={{
          position: "absolute",
          left: 231,
          top: 0,
          width: 250,
          height: "100%",
          background: "#f2f2f2",
          borderRight: "1px solid #d1d1d1",
          padding: "16px 16px",
          transform: `translateX(${catPanelX}px)`,
          opacity: catPanelOpacity,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          zIndex: 5,
        }}
      >
        {/* Category Management button - matches .manageButtonDesktop */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #d1d1d1",
            borderTop: "1px solid #d1d1d1",
            color: "#333",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 12,
            fontFamily: F,
            fontWeight: 400,
          }}
        >
          ⚙️ Category Management
        </div>

        {/* Category buttons - matches .groupButton with border-left colored */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {categories.map((cat, i) => {
            const isSelected = i === selectedIdx;
            const catDelay = 30 + i * 5;
            const catOpacity = interpolate(
              frame,
              [catDelay, catDelay + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );

            return (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  opacity: catOpacity,
                  borderLeft: `4px solid ${cat.color}`,
                  background: isSelected ? `${cat.color}22` : "transparent",
                  color: isSelected ? "#212529" : "#333",
                  fontSize: 15,
                  fontWeight: isSelected ? 500 : 400,
                  fontFamily: F,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{cat.name}</span>
                {cat.description && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#888",
                      background: "rgba(0,0,0,0.06)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.description}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div
        style={{
          position: "absolute",
          left: 501,
          top: 0,
          right: 0,
          bottom: 0,
          opacity: contentOpacity,
          padding: "24px 40px",
          overflow: "hidden",
        }}
      >
        {/* Sticky header area - matches .viewToggleWrapper */}
        <div
          style={{
            position: "relative",
            minHeight: 50,
            marginBottom: 16,
            background: "#f2f2f2",
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {/* View toggle centered - matches .viewToggle centered */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              background: "#e8eaed",
              borderRadius: 25,
              overflow: "hidden",
              border: "1px solid #d1d1d1",
            }}
          >
            <div
              style={{
                padding: "8px 28px",
                fontSize: 15,
                fontWeight: 400,
                color: "#666",
                fontFamily: F,
              }}
            >
              Chat
            </div>
            <div
              style={{
                padding: "8px 28px",
                fontSize: 15,
                fontWeight: 600,
                background: "#333",
                color: "white",
                borderRadius: 25,
                fontFamily: F,
              }}
            >
              Recipes
            </div>
          </div>

          {/* Icon buttons on right - matches .iconButtons */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.67)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "#333",
              }}
            >
              ☆
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.67)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: "#333",
                fontWeight: 300,
              }}
            >
              +
            </div>
          </div>
        </div>

        {/* Search + Filter + Sort row - matches .searchHeader */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 24,
            background: "#f5f5f5",
            padding: "8px 0",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 8,
              border: "2px solid #e0e0e0",
              background: "white",
              fontSize: 15,
              color: "#999",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: F,
            }}
          >
            🔍 Search recipes...
          </div>
          <div
            style={{
              padding: "0 12px",
              height: 32,
              borderRadius: 10,
              background: "white",
              fontSize: 14,
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: F,
            }}
          >
            Filter ▾
          </div>
          <div
            style={{
              padding: "0 12px",
              height: 32,
              borderRadius: 10,
              background: "white",
              fontSize: 14,
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: F,
            }}
          >
            Sorting ▾
          </div>
        </div>

        {/* Recipe grid - top row (5 cards) matching screenshot layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 20,
            marginBottom: 30,
          }}
        >
          {topRowRecipes.map((recipe, i) => (
            <RecipeCard
              key={`top-${i}`}
              recipe={recipe}
              delay={50 + i * 8}
              size={170}
            />
          ))}
        </div>

        {/* "Side Dishes" section header - matches .sectionTitle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#333",
              margin: 0,
              fontFamily: F,
            }}
          >
            Side Dishes
          </h2>
        </div>

        {/* Side dishes recipe grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 20,
            marginBottom: 30,
          }}
        >
          {sideDishesSectionRecipes.map((recipe, i) => (
            <RecipeCard
              key={`side-${i}`}
              recipe={recipe}
              delay={90 + i * 8}
              size={170}
            />
          ))}
        </div>

        {/* "Bread" section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: 0,
              fontFamily: F,
            }}
          >
            Bread
          </h2>
        </div>

        {/* Bread recipe grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 20,
          }}
        >
          {breadSectionRecipes.map((recipe, i) => (
            <RecipeCard
              key={`bread-${i}`}
              recipe={recipe}
              delay={120 + i * 8}
              size={170}
            />
          ))}
        </div>
      </div>

      {/* ===== EDIT CATEGORY MODAL ===== */}
      {showEditModal && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              opacity: editOverlayOp,
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${editModalScale})`,
              width: 520,
              background: "white",
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              padding: "40px",
              opacity: editModalOp,
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#333",
                textAlign: "center",
                fontFamily: F,
              }}
            >
              Edit Category
            </div>
            <div
              style={{
                padding: "16px 20px",
                border: "2px solid #667eea",
                borderRadius: 10,
                background: "white",
                fontSize: 20,
                color: "#333",
                fontFamily: F,
              }}
            >
              Desserts
            </div>
            <div
              style={{
                padding: "16px 20px",
                border: "2px solid #e0e0e0",
                borderRadius: 10,
                background: "#f8f9fa",
                fontSize: 20,
                color: "#999",
                fontFamily: F,
              }}
            >
              Description
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  color: "#666",
                  marginBottom: 10,
                  fontFamily: F,
                }}
              >
                Color:
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {COLORS.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: color,
                      border:
                        i === selectedColorIdx
                          ? "3px solid #333"
                          : "2px solid transparent",
                      boxShadow:
                        i === selectedColorIdx
                          ? "0 0 0 2px white, 0 0 0 4px #333"
                          : "none",
                      transform:
                        i === selectedColorIdx ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <div
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 14,
                  background: "#e0e0e0",
                  color: "#333",
                  fontSize: 19,
                  fontWeight: 600,
                  textAlign: "center",
                  fontFamily: F,
                }}
              >
                Cancel
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: 19,
                  fontWeight: 600,
                  textAlign: "center",
                  fontFamily: F,
                }}
              >
                Save Changes
              </div>
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
