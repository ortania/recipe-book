import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const SearchScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene label slide-in
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [0, 20], [-40, 0], {
    extrapolateRight: "clamp",
  });

  // Chat overlay fade
  const overlayOpacity = interpolate(frame, [5, 20], [0, 0.5], {
    extrapolateRight: "clamp",
  });

  // Chat window spring entrance
  const chatScale = spring({
    frame: frame - 8,
    fps,
    from: 0.75,
    to: 1,
    config: { damping: 14, stiffness: 40 },
  });
  const chatOpacity = interpolate(frame, [8, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const chatY = interpolate(frame, [8, 30], [30, 0], {
    extrapolateRight: "clamp",
  });

  // User types a question - slower
  const question = "How do I make chocolate cake moist?";
  const qLen = Math.min(
    Math.floor(
      interpolate(frame, [45, 110], [0, question.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    question.length,
  );

  // Typing indicator bounce
  const typingBounce = (dotIdx) => {
    if (frame < 115 || frame >= 140) return 0;
    const t = (frame - 115) * 0.15 + dotIdx * 0.7;
    return Math.sin(t * 3) * 4;
  };

  // AI response appears - slower
  const responseOpacity = interpolate(frame, [140, 160], [0, 1], {
    extrapolateRight: "clamp",
  });
  const responseY = interpolate(frame, [140, 160], [12, 0], {
    extrapolateRight: "clamp",
  });

  const cursorBlink = Math.sin(frame * 0.25) > 0;

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
          Cooking Assistant (AI Chat)
        </span>
      </div>

      {/* Dark overlay - matches .chatOverlay rgba(0,0,0,0.5) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "black",
          opacity: overlayOpacity,
          zIndex: 5,
        }}
      />

      {/* Chat window - exact match: chat-window.module.css */}
      <div
        style={{
          width: 600,
          height: 720,
          background: "#f2f2f2",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          overflow: "hidden",
          transform: `scale(${chatScale}) translateY(${chatY}px)`,
          opacity: chatOpacity,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header - matches .chatHeader: white bg, black text */}
        <div
          style={{
            padding: "16px 24px",
            background: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 19,
              fontWeight: 600,
              color: "black",
              fontFamily: "'Raleway', system-ui, sans-serif",
            }}
          >
            <span style={{ fontSize: 26 }}>🔍</span>
            Cooking Assistant
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Clear + Close buttons - matches .clearButton/.closeButton */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid gray",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "black",
              }}
            >
              🗑
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid gray",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                color: "black",
              }}
            >
              ✕
            </div>
          </div>
        </div>

        {/* Messages area - matches .messagesContainer */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflow: "hidden",
          }}
        >
          {/* User message - matches .userMessage .messageContent: #2196f3 bg, white text */}
          {qLen > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 4px 12px",
                  background: "#2196f3",
                  color: "white",
                  fontSize: 16,
                  lineHeight: 1.5,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                {question.slice(0, qLen)}
                {qLen < question.length && (
                  <span
                    style={{
                      borderRight: cursorBlink
                        ? "2px solid white"
                        : "2px solid transparent",
                      marginLeft: 1,
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Typing indicator - matches .typing with bouncing dots */}
          {frame >= 115 && frame < 140 && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 12px 4px",
                  background: "white",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#999",
                      transform: `translateY(${typingBounce(d)}px)`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI response - matches .assistantMessage .messageContent: white bg, #333 text */}
          {frame >= 140 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                opacity: responseOpacity,
                transform: `translateY(${responseY}px)`,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 12px 4px",
                  background: "white",
                  color: "#333",
                  fontSize: 16,
                  lineHeight: 1.6,
                  fontFamily: "'Raleway', system-ui, sans-serif",
                }}
              >
                Here are some tips for a moist chocolate cake:{"\n\n"}
                <strong>1.</strong> Use buttermilk instead of regular milk{"\n"}
                <strong>2.</strong> Add a tablespoon of mayonnaise{"\n"}
                <strong>3.</strong> Don't overbake — check at 25 minutes{"\n"}
                <strong>4.</strong> Use hot coffee to bloom the cocoa{"\n\n"}
                Would you like a full recipe? 🍰
              </div>
            </div>
          )}
        </div>

        {/* Input area - matches .inputContainer: white bg, border-top */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid #e9ecef",
            background: "white",
            borderRadius: "0 0 12px 12px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {/* Input - matches .input: border-radius 24px, 1px solid #dee2e6 */}
          <div
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 24,
              border: "1px solid #dee2e6",
              fontSize: 16,
              color: "#999",
              fontFamily: "'Raleway', system-ui, sans-serif",
            }}
          >
            Ask about recipes, cooking tips...
          </div>
          {/* Send button - matches .sendButton: #2196f3 → #1976d2 gradient */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 18,
            }}
          >
            ➤
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
