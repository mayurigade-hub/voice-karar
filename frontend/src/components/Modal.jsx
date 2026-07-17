export default function Modal({ children, open, title }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/70 px-4 py-6">
      <div className="w-full max-w-lg border border-[var(--ledger-line)] bg-[var(--paper)] p-5 shadow-[0_18px_45px_rgba(28,43,46,0.18)]">
        {title ? <h3 className="mb-4 font-['Source_Serif_4'] text-2xl">{title}</h3> : null}
        {children}
      </div>
    </div>
  )
}
