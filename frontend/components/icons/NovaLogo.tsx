export function NovaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        style={{ fill: "#f6fbfd" }}
        d="M49.7 2.5 L55.1 40.3 L69.2 30.8 L59.5 44.9 L89.2 49.7 L59.5 55.4 L68.6 68.6 L55.1 59.7 L49.7 96.4 L44.9 59.7 L30.3 68.6 L40.5 55.4 L10.6 50.3 L40.5 44.9 L31.4 31.6 L44.9 40.3 Z"
      />
    </svg>
  );
}