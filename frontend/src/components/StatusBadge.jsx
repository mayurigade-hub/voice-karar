const statusMap = {
  draft: 'bg-[var(--paper)] text-[var(--ink)] border-[var(--ledger-line)]',
  sent: 'bg-[var(--alert-amber)]/15 text-[var(--alert-amber)] border-[var(--alert-amber)]',
  accepted: 'bg-[var(--trust-green)]/10 text-[var(--trust-green)] border-[var(--trust-green)]',
  rejected: 'bg-[var(--seal)]/10 text-[var(--seal)] border-[var(--seal)]',
  modified: 'bg-[var(--alert-amber)]/20 text-[var(--ink)] border-[var(--alert-amber)]'
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex -rotate-2 items-center border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusMap[status] || statusMap.draft}`}>
      {status}
    </span>
  )
}
