export function SearchIcon({ width = 80, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="searchGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id="searchShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      <circle cx="42" cy="42" r="24" stroke="url(#searchGrad)" strokeWidth="7" filter="url(#searchShadow)" />
      <line x1="59" y1="59" x2="78" y2="78" stroke="url(#searchGrad)" strokeWidth="7" strokeLinecap="round" filter="url(#searchShadow)" />
      <circle cx="42" cy="42" r="10" fill="url(#searchGrad)" opacity="0.15" />
    </svg>
  );
}

export function CookIcon({ width = 80, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cookGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <filter id="cookShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Hat top */}
      <ellipse cx="50" cy="38" rx="28" ry="22" fill="url(#cookGrad)" filter="url(#cookShadow)" />
      {/* Hat band */}
      <rect x="24" y="52" width="52" height="10" rx="3" fill="url(#cookGrad)" filter="url(#cookShadow)" />
      {/* Hat pom */}
      <circle cx="50" cy="20" r="5" fill="white" opacity="0.7" />
      {/* Steam lines */}
      <path d="M35 75 Q37 68 35 62" stroke="url(#cookGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M50 78 Q52 70 50 64" stroke="url(#cookGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M65 75 Q67 68 65 62" stroke="url(#cookGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

export function ChatIcon({ width = 80, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chatGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="chatShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Main bubble */}
      <rect x="12" y="15" width="56" height="42" rx="12" fill="url(#chatGrad)" filter="url(#chatShadow)" />
      <polygon points="28,57 22,72 40,57" fill="url(#chatGrad)" />
      {/* Dots inside */}
      <circle cx="30" cy="36" r="4" fill="white" opacity="0.8" />
      <circle cx="44" cy="36" r="4" fill="white" opacity="0.8" />
      <circle cx="58" cy="36" r="4" fill="white" opacity="0.8" />
      {/* Small bubble */}
      <rect x="52" y="38" width="38" height="28" rx="10" fill="url(#chatGrad)" opacity="0.5" filter="url(#chatShadow)" />
      <polygon points="72,66 78,78 66,66" fill="url(#chatGrad)" opacity="0.5" />
    </svg>
  );
}

export function NutritionIcon({ width = 80, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="appleGrad" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <filter id="appleShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Apple body - two merged circles */}
      <path
        d="M50 88 C30 88 16 72 16 55 C16 38 28 28 38 26 C44 24 48 27 50 30 C52 27 56 24 62 26 C72 28 84 38 84 55 C84 72 70 88 50 88Z"
        fill="url(#appleGrad)"
        filter="url(#appleShadow)"
      />
      {/* Stem */}
      <path d="M50 30 C50 30 49 18 52 12" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Leaf */}
      <path
        d="M52 16 C56 10 68 10 70 16 C68 14 58 14 52 16Z"
        fill="url(#leafGrad)"
      />
      {/* Highlight */}
      <ellipse cx="36" cy="48" rx="7" ry="12" fill="white" opacity="0.2" transform="rotate(-15 36 48)" />
    </svg>
  );
}

export function ShoppingIcon({ width = 80, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shopGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="shopShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Cart body */}
      <path
        d="M22 28 L30 28 L40 65 L75 65 L82 38 L35 38"
        stroke="url(#shopGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#shopShadow)"
      />
      {/* Cart fill */}
      <path
        d="M35 42 L78 42 L73 62 L42 62Z"
        fill="url(#shopGrad)"
        opacity="0.2"
      />
      {/* Wheels */}
      <circle cx="45" cy="75" r="6" fill="url(#shopGrad)" filter="url(#shopShadow)" />
      <circle cx="70" cy="75" r="6" fill="url(#shopGrad)" filter="url(#shopShadow)" />
      {/* Wheel inner */}
      <circle cx="45" cy="75" r="2.5" fill="white" opacity="0.6" />
      <circle cx="70" cy="75" r="2.5" fill="white" opacity="0.6" />
    </svg>
  );
}

export function ShareIcon({ width = 80, height = 80 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shareGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <filter id="shareShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Top-right node */}
      <circle cx="72" cy="25" r="12" fill="url(#shareGrad)" filter="url(#shareShadow)" />
      {/* Middle-left node */}
      <circle cx="28" cy="50" r="12" fill="url(#shareGrad)" filter="url(#shareShadow)" />
      {/* Bottom-right node */}
      <circle cx="72" cy="75" r="12" fill="url(#shareGrad)" filter="url(#shareShadow)" />
      {/* Lines */}
      <line x1="38" y1="44" x2="62" y2="31" stroke="url(#shareGrad)" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="56" x2="62" y2="69" stroke="url(#shareGrad)" strokeWidth="4" strokeLinecap="round" />
      {/* Node highlights */}
      <circle cx="69" cy="22" r="4" fill="white" opacity="0.3" />
      <circle cx="25" cy="47" r="4" fill="white" opacity="0.3" />
      <circle cx="69" cy="72" r="4" fill="white" opacity="0.3" />
    </svg>
  );
}
