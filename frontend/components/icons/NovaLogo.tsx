export function NovaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nova-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" style={{ stopColor: "var(--accent, #8ED8FF)" }} />
          <stop offset="100%" stopColor="#2b6bff" />
        </radialGradient>
      </defs>

      {/* shockwave ring arcs */}
      <g
        fill="none"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ stroke: "var(--accent, #8ED8FF)" }}
        opacity="0.75"
      >
        <path d="M81.95 61.63 A34 34 0 0 1 61.63 81.95" />
        <path d="M38.37 81.95 A34 34 0 0 1 18.05 61.63" />
        <path d="M18.05 38.37 A34 34 0 0 1 38.37 18.05" />
        <path d="M61.63 18.05 A34 34 0 0 1 81.95 38.37" />
      </g>

      {/* four-pointed star */}
      <path
        d="M50 4 Q54 46 96 50 Q54 54 50 96 Q46 54 4 50 Q46 46 50 4 Z"
        fill="url(#nova-core)"
      />
    </svg>
  );
}