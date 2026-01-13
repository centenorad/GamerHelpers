export default function Card({
  children,
  className = "",
  hoverable = true,
  ...props
}) {
  const hoverClass = hoverable
    ? "hover:border-ghaccent/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
    : "";

  return (
    <div
      className={`bg-ghbackground-secondary rounded-lg border border-ghforegroundlow/20 p-6 ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
