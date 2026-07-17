import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileText, MessageSquareMore, PenLine, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import MobileBottomNav from '../components/MobileBottomNav'
import Navbar from '../components/Navbar'
import { confirmAgreement, getAgreementById } from '../services/api'

export default function ConfirmationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('pending')
  const [note, setNote] = useState('')
  const [showNoteBox, setShowNoteBox] = useState(false)
  const [agreement, setAgreement] = useState(null)

  useEffect(() => {
    const loadAgreement = async () => {
      const data = await getAgreementById(id)
      setAgreement(data)
    }
    loadAgreement()
  }, [id])

  const summary = useMemo(() => ({
    otherPartyName: agreement?.otherPartyName || 'Rajat Traders',
    product: agreement?.product || 'Cotton bags',
    quantity: agreement?.quantity ? `${agreement.quantity}` : '500',
    price: agreement?.price ? `₹${agreement.price.toLocaleString()}` : '₹1,800',
    deliveryDate: agreement?.deliveryDate || '10 August 2026',
    paymentTerms: agreement?.paymentTerms || '50% advance, 50% on delivery'
  }), [agreement])

  const handleAction = async (action) => {
    if (action === 'modify') {
      setShowNoteBox(true)
      return
    }

    await confirmAgreement(id, action, note)
    setStatus(action === 'accept' ? 'accepted' : 'rejected')
  }

  if (status !== 'pending') {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
        <Navbar />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`rounded-full p-3 ${status === 'accepted' ? 'bg-[var(--trust-green)]/10 text-[var(--trust-green)]' : 'bg-[var(--seal)]/10 text-[var(--seal)]'}`}>
                {status === 'accepted' ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </div>
              <h1 className="font-['Source_Serif_4'] text-3xl">{status === 'accepted' ? 'Agreement accepted' : 'Agreement marked for change'}</h1>
              <p className="max-w-xl text-sm text-[var(--ink)]/70">The other party has responded. This is a mock confirmation state for the public flow.</p>
            </div>
          </Card>
          <Button onClick={() => navigate('/dashboard')}>Return to dashboard</Button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Public confirmation</p>
          <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Review the terms</h1>
        </header>

        <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--ink)]/70">
            <FileText className="h-4 w-4 text-[var(--seal)]" />
            Agreement summary
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-3 text-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]/60">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</p>
                <p className="mt-1 font-semibold text-[var(--ink)]">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {showNoteBox ? (
          <Card>
            <label className="block text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)]/70">
              <span className="mb-2 block">What should change?</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24 w-full border border-[var(--ledger-line)] bg-[var(--paper)] p-3 text-sm text-[var(--ink)] outline-none" placeholder="Brief note for the owner" />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => handleAction('modify')}>
                <MessageSquareMore className="mr-2 h-4 w-4" /> Send change request
              </Button>
              <Button variant="secondary" onClick={() => setShowNoteBox(false)}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => handleAction('accept')}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
            </Button>
            <Button variant="secondary" onClick={() => handleAction('modify')}>
              <PenLine className="mr-2 h-4 w-4" /> Request changes
            </Button>
            <Button variant="secondary" onClick={() => handleAction('reject')}>
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
          </div>
        )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
