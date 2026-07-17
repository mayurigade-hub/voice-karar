import { FileText, Home, Mic, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/record', label: 'Record', icon: Mic },
  { to: '/review', label: 'Review', icon: FileText },
  { to: '/', label: 'Login', icon: User }
]

export default function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="sticky bottom-0 border-t border-[var(--ledger-line)] bg-[var(--paper)] px-2 py-2 sm:hidden">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} className={`flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] uppercase tracking-[0.16em] ${active ? 'text-[var(--seal)]' : 'text-[var(--ink)]/70'}`}>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
