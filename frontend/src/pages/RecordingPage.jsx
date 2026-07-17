import { useMemo, useState } from 'react'
import { CheckCircle2, Mic, RotateCcw, SendHorizonal, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import MobileBottomNav from '../components/MobileBottomNav'
import Navbar from '../components/Navbar'
import VoiceRecorderButton from '../components/VoiceRecorderButton'
import { createAgreement } from '../services/api'

export default function RecordingPage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('idle')
  const [agreement, setAgreement] = useState(null)
  const [draft, setDraft] = useState({
    ownerName: 'Asha Mehta',
    otherPartyName: 'Rajat Traders',
    product: 'Cotton bags',
    quantity: 500,
    price: 1800,
    deliveryDate: '2026-08-10',
    paymentTerms: '50% advance',
    specialConditions: 'Bulk packing with company logo'
  })

  const handleRecord = () => {
    if (stage === 'idle') {
      setStage('recording')
      return
    }
    if (stage === 'recording') {
      setStage('processing')
      setTimeout(async () => {
        const result = await createAgreement(draft)
        setAgreement(result)
        setStage('results')
      }, 1400)
    }
  }

  const progress = useMemo(() => {
    const fields = [draft.otherPartyName, draft.product, draft.quantity, draft.price, draft.paymentTerms]
    const filled = fields.filter(Boolean).length
    return `${filled} of 5 details confirmed`
  }, [draft])

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Record your agreement</p>
          <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Speak the deal out loud</h1>
        </header>

        <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--ink)]/70">
              <Sparkles className="h-4 w-4 text-[var(--seal)]" />
              {stage === 'idle' && 'Tap to begin'}
              {stage === 'recording' && 'Recording now'}
              {stage === 'processing' && 'Reading the words'}
              {stage === 'results' && 'Agreement ready'}
            </div>

            <VoiceRecorderButton isRecording={stage === 'recording'} isProcessing={stage === 'processing'} onToggle={handleRecord} />

            {stage === 'recording' ? (
              <div className="rounded-none border border-[var(--ledger-line)] bg-[var(--paper)] px-4 py-2 text-sm text-[var(--ink)]/70">00:24 / 00:30</div>
            ) : null}

            {stage === 'processing' ? <LoadingSpinner label="Extracting details from your voice" /> : null}

            {stage === 'results' && agreement ? (
              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--trust-green)]">
                  <CheckCircle2 className="h-4 w-4" />
                  {progress}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(draft).map(([key, value]) => (
                    <div key={key} className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-3 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]/60">{key}</p>
                      <p className="mt-1 font-semibold text-[var(--ink)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        {stage !== 'results' ? (
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--ink)]/70">Say: “I agree to supply 500 cotton bags at ₹1800 for delivery by 10 August.”</p>
              {stage === 'recording' ? (
                <Button variant="secondary" onClick={handleRecord}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Re-record
                </Button>
              ) : null}
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate('/review', { state: { agreement } })}>
              <SendHorizonal className="mr-2 h-4 w-4" /> Review agreement
            </Button>
            <Button variant="secondary" onClick={() => setStage('idle')}>
              Record again
            </Button>
          </div>
        )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
