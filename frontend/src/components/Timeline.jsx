export default function Timeline({ items }) {
  return (
    <ol className="space-y-3 border-l border-[var(--ledger-line)] pl-4">
      {items.map((item, index) => (
        <li key={item.label} className="relative">
          <span className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border border-[var(--seal)] bg-[var(--paper)]" />
          <div className="text-sm text-[var(--ink)]/80">
            <p className="font-semibold uppercase tracking-[0.14em]">{item.label}</p>
            <p className="text-xs">{item.time}</p>
          </div>
          {index < items.length - 1 ? <div className="mt-2 h-4" /> : null}
        </li>
      ))}
    </ol>
  )
}
