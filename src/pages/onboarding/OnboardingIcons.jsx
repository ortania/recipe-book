export function SearchIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="42" cy="42" r="24" stroke="currentColor" strokeWidth="5" />
      <line
        x1="59"
        y1="59"
        x2="78"
        y2="78"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="42" cy="42" r="10" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export function CookIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Steam */}
      <path
        d="M35 30 Q37 22 35 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M50 26 Q52 18 50 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M65 30 Q67 22 65 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      {/* Pot lid handle */}
      <path
        d="M44 34 Q50 28 56 34"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Pot lid */}
      <line
        x1="22"
        y1="38"
        x2="78"
        y2="38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Pot body */}
      <path
        d="M24 38 L24 68 Q24 78 34 78 L66 78 Q76 78 76 68 L76 38"
        stroke="currentColor"
        strokeWidth="3"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Pot handles */}
      <path
        d="M24 50 L16 50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M76 50 L84 50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Burner */}
      <ellipse
        cx="50"
        cy="90"
        rx="26"
        ry="4"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

export function ChatIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main bubble */}
      <path
        d="M14 18 h50 a10 10 0 0 1 10 10 v24 a10 10 0 0 1 -10 10 h-30 l-14 14 v-14 h-6 a10 10 0 0 1 -10 -10 v-24 a10 10 0 0 1 10 -10z"
        stroke="currentColor"
        strokeWidth="3"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Sparkle / AI star */}
      <path
        d="M50 34 L52 40 L58 42 L52 44 L50 50 L48 44 L42 42 L48 40Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Small dots (typing) */}
      <circle cx="24" cy="42" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="33" cy="42" r="3" fill="currentColor" opacity="0.35" />
      {/* Second bubble (reply) */}
      <path
        d="M40 64 h38 a8 8 0 0 1 8 8 v16 a8 8 0 0 1 -8 8 h-4 v10 l-10 -10 h-24 a8 8 0 0 1 -8 -8 v-16 a8 8 0 0 1 8 -8z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}

export function NutritionIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Apple body */}
      <path
        d="M50 88 C30 88 16 72 16 55 C16 38 28 28 38 26 C44 24 48 27 50 30 C52 27 56 24 62 26 C72 28 84 38 84 55 C84 72 70 88 50 88Z"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Stem */}
      <path
        d="M50 30 C50 30 49 18 52 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf */}
      <path
        d="M52 16 C56 10 68 10 70 16 C68 14 58 14 52 16Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export function ShoppingIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cart body */}
      <path
        d="M22 28 L30 28 L40 65 L75 65 L82 38 L35 38"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cart fill */}
      <path
        d="M35 42 L78 42 L73 62 L42 62Z"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Wheels */}
      <circle
        cx="45"
        cy="75"
        r="6"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="70"
        cy="75"
        r="6"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="45" cy="75" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="70" cy="75" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function ShareIcon({ width = 80, height = 80 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lines */}
      <line
        x1="38"
        y1="44"
        x2="62"
        y2="31"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="56"
        x2="62"
        y2="69"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Top-right node */}
      <circle
        cx="72"
        cy="25"
        r="12"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Middle-left node */}
      <circle
        cx="28"
        cy="50"
        r="12"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Bottom-right node */}
      <circle
        cx="72"
        cy="75"
        r="12"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="currentColor"
        fillOpacity="0.08"
      />
    </svg>
  );
}
