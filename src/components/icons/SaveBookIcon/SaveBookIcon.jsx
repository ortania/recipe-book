function SaveBookIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Book cover */}
      <rect
        x="18"
        y="12"
        width="58"
        height="72"
        rx="5"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Book spine */}
      <line
        x1="32"
        y1="12"
        x2="32"
        y2="84"
        stroke="currentColor"
        strokeWidth="3.5"
      />

      {/* Page lines */}
      <line
        x1="42"
        y1="32"
        x2="66"
        y2="32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="42"
        y1="43"
        x2="66"
        y2="43"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="42"
        y1="54"
        x2="62"
        y2="54"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="42"
        y1="65"
        x2="58"
        y2="65"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Bookmark ribbon */}
      <path
        d="M60 12 L60 30 L66 25 L72 30 L72 12"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M60 12 L60 30 L66 25 L72 30 L72 12"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  );
}

export default SaveBookIcon;
