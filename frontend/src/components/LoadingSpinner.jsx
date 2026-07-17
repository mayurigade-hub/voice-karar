export default function LoadingSpinner({ label = 'Processing your recording' }) {
  return (
    <div className="flex items-center gap-3 rounded-none border border-[var(--ledger-line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)]/70">
      <span className="flex h-3 w-3 rounded-full bg-[var(--seal)]" />
      <span className="flex h-3 w-3 rounded-full bg-[var(--seal)]/80" />
      <span className="flex h-3 w-3 rounded-full bg-[var(--seal)]/50" />
      <span>{label}</span>
    </div>
  )
}
