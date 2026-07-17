import { useEffect, useMemo, useState } from 'react'
import { Filter, Mic, Plus, Search, Folder } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import MobileBottomNav from '../components/MobileBottomNav'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import { getAgreements } from '../services/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [agreements, setAgreements] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const data = await getAgreements()
      setAgreements(data)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return agreements.filter((agreement) => {
      const matchesStatus = filter === 'all' ? true : agreement.status === filter
      const matchesText = `${agreement.otherPartyName} ${agreement.product}`.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesText
    })
  }, [agreements, filter, search])

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Voice Karar</p>
              <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Your agreements</h1>
            </div>
            <Button onClick={() => navigate('/record')}>
              <Plus className="mr-2 h-4 w-4" /> New agreement
            </Button>
          </header>

          <Card className="border-t-4 border-t-[var(--seal)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-1 items-center gap-2 border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2">
                <Search className="h-4 w-4 text-[var(--ink)]/60" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search party or product" className="w-full bg-transparent text-sm outline-none" />
              </label>
              <label className="flex items-center gap-2 border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2 text-sm">
                <Filter className="h-4 w-4" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent outline-none">
                  <option value="all">All status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="modified">Modified</option>
                </select>
              </label>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
              {filtered.length === 0 ? (
              <Card className="lg:col-span-2">
                <p className="font-['Source_Serif_4'] text-2xl">No agreements yet — record your first one</p>
                <p className="mt-2 text-sm text-[var(--ink)]/70">A spoken deal can be turned into a clear record in minutes.</p>
              </Card>
            ) : (
              filtered.map((agreement) => (
                <Card key={agreement.id} tone="muted" className="cursor-pointer" onClick={() => navigate(`/agreement/${agreement.id}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink)]/60">{agreement.otherPartyName}</p>
                      <h2 className="font-['Source_Serif_4'] text-2xl">{agreement.product}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {agreement.source === 'upload' ? <Folder className="h-4 w-4 text-[var(--ink)]/70" /> : <Mic className="h-4 w-4 text-[var(--ink)]/70" />}
                      <StatusBadge status={agreement.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--ink)]/70">
                    <span>Qty {agreement.quantity}</span>
                    <span>₹{agreement.price.toLocaleString()}</span>
                    <span>{agreement.createdAt}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--ledger-line)] pt-3 text-sm text-[var(--ink)]/70">
                    <span>Open record</span>
                    <Mic className="h-4 w-4 text-[var(--seal)]" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
