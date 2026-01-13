export default function Badge({
  children,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary: "bg-blue-800 text-blue-200",
    success: "bg-green-800 text-green-200",
    warning: "bg-yellow-800 text-yellow-200",
    danger: "bg-red-800 text-red-200",
    purple: "bg-purple-800 text-purple-200",
    gray: "bg-gray-800 text-gray-200",
  };

  return (
    <span
      className={`${variants[variant]} px-3 py-1 rounded-full text-xs font-semibold border border-current/30 ${className}`}
    >
      {children}
    </span>
  );
}
