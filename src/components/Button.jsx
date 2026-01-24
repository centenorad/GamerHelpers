export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const baseStyles =
    "font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/50",
    secondary:
      "bg-ghbackground-secondary border border-ghforegroundlow/20 text-white hover:border-ghaccent/50",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50",
    success:
      "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/50",
    outline: "border-2 border-ghaccent text-ghaccent hover:bg-ghaccent/10",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-lg",
    xl: "px-10 py-4 text-xl",
  };

  const disabledStyles =
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
