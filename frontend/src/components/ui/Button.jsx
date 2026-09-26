const VARIANTS = {
  primary: 'rounded-xl bg-accent text-accent-foreground shadow-sm hover:bg-accent/90',
  secondary: 'rounded-xl border border-line bg-white text-ink shadow-sm hover:bg-paper',
  quiet: 'rounded-xl text-ink hover:bg-white',
  danger: 'rounded-xl text-danger hover:bg-white',
}

export function Button({ variant = 'primary', className = '', type = 'button', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
