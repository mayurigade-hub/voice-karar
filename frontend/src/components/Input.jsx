export default function Input({ label, value, onChange, placeholder, className = '' }) {
  return (
    <label className="block text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)]/80">
      <span className="mb-2 block">{label}</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
          className={`w-full border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-3 text-base text-[var(--ink)] outline-none ${className}`}
      />
    </label>
  )
}
