const variants = {
  primary: 'bg-[var(--seal)] text-[var(--paper)]',
  secondary: 'bg-[var(--paper)] text-[var(--ink)] border border-[var(--ledger-line)]',
  ghost: 'bg-transparent text-[var(--ink)]'
}

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-none px-4 py-3 text-sm font-semibold tracking-[0.12em] uppercase transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
