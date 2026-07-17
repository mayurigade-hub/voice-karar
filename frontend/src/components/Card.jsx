export default function Card({ children, className = '', tone = 'default', ...props }) {
  const styles = {
    default: 'border border-[var(--ledger-line)] bg-[var(--paper)]',
    muted: 'border border-[var(--ledger-line)] bg-[var(--paper)]/70',
    stamp: 'border border-[var(--ledger-line)] bg-[var(--paper)] shadow-[0_10px_30px_rgba(28,43,46,0.08)]'
  }

  return (
    <div className={`relative overflow-hidden ${styles[tone]} ${className}`} {...props}>
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,transparent_0%,rgba(140,59,46,0.12)_50%,transparent_100%)]" />
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}
