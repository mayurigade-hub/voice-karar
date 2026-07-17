import { Menu, Mic, ShieldCheck, ArrowLeft, Sun, Moon, Globe, Check } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' }
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('vk-theme') || 'light')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('vk-font') || 'large')
  const [lang, setLang] = useState(() => localStorage.getItem('vk-lang') || 'en')
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('vk-theme', theme)
  }, [theme])

  useEffect(() => {
    const size = fontSize === 'large' ? '18px' : '16px'
    document.documentElement.style.setProperty('--base-font-size', size)
    localStorage.setItem('vk-font', fontSize)
  }, [fontSize])

  useEffect(() => {
    document.documentElement.classList.remove('lang-en', 'lang-hi', 'lang-ta')
    document.documentElement.classList.add(`lang-${lang}`)
    localStorage.setItem('vk-lang', lang)
  }, [lang])

  useEffect(() => {
    const onDocClick = (e) => {
      if (!langRef.current) return
      if (!langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const showBack = !['/dashboard', '/'].includes(location.pathname)

  return (
    <header className="border-b border-[var(--ledger-line)] bg-[var(--paper)] px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button onClick={() => navigate(-1)} title="Back" className="p-2 border border-[var(--ledger-line)] bg-[var(--paper)]">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--ink)]/80">
              <ShieldCheck className="h-4 w-4 text-[var(--seal)]" />
              Voice Karar
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/record" className="flex items-center gap-2 rounded-none border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2 text-sm">
            <Mic className="h-4 w-4 text-[var(--seal)]" /> Record
          </Link>

          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((s) => !s)}
              aria-expanded={langOpen}
              title="Language"
              className="flex items-center gap-2 border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2 text-sm"
            >
              <Globe className="h-4 w-4" />
              <span>{LANGS.find((l) => l.code === lang)?.label}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-sm border bg-[var(--paper)] shadow-sm">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm ${l.code === lang ? 'bg-[var(--ledger-line)]/10 font-semibold' : ''}`}
                  >
                    <span>{l.label}</span>
                    {l.code === lang ? <Check className="h-4 w-4 text-[var(--seal)]" /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setFontSize((s) => (s === 'large' ? 'normal' : 'large'))}
            title="Toggle font size"
            className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2 text-sm"
          >
            A{fontSize === 'large' ? '+' : '-'}
          </button>

          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title="Toggle theme"
            className="border border-[var(--ledger-line)] bg-[var(--paper)] p-2"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button className="border border-[var(--ledger-line)] bg-[var(--paper)] p-2">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
