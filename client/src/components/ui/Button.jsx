const variantClasses = {
  primary:
    "bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700",

  secondary:
    "bg-slate-950 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800",

  outline:
    "border border-slate-300 bg-white text-slate-900 hover:border-brand-600 hover:text-brand-600",
};

const sizeClasses = {
  small: "min-h-10 px-4 py-2 text-sm",
  medium: "min-h-12 px-6 py-3 text-sm",
  large: "min-h-14 px-7 py-3.5 text-base",
};

function Button({
  children,
  variant = "primary",
  size = "medium",
  className = "",
  type = "button",
  disabled = false,
  ...props
}) {
  const variantClass =
    variantClasses[variant] || variantClasses.primary;

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        font-semibold transition duration-200
        focus-visible:outline-none focus-visible:ring-4
        focus-visible:ring-brand-500/20
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;