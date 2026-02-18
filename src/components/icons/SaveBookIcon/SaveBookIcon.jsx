function SaveBookIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="saveBookGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <filter id="saveBookShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Book body */}
      <rect
        x="20"
        y="15"
        width="60"
        height="70"
        rx="6"
        fill="url(#saveBookGrad)"
        filter="url(#saveBookShadow)"
      />

      {/* Book spine */}
      <rect x="20" y="15" width="10" height="70" rx="3" fill="#E11D6D" opacity="0.4" />

      {/* Page lines */}
      <line x1="40" y1="35" x2="70" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="40" y1="45" x2="70" y2="45" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="40" y1="55" x2="65" y2="55" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="40" y1="65" x2="60" y2="65" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export default SaveBookIcon;
