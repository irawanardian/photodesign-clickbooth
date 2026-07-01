function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const baseClass =
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'

  const variantClass = {
    primary: 'bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-400',
    secondary: 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-400',
  }

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
