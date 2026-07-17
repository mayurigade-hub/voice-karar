import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/Card'
import MobileBottomNav from '../components/MobileBottomNav'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import Timeline from '../components/Timeline'
import { getAgreementById } from '../services/api'

export default function AgreementDetailPage() {
  const { id } = useParams()
  const [agreement, setAgreement] = useState(null)

  useEffect(() => {
    const load = async () => {
      const data = await getAgreementById(id)
      setAgreement(data)
    }
    load()
  }, [id])

  if (!agreement) {
    return null
  }

  const timeline = [
    { label: agreement.source === 'upload' ? 'Uploaded' : 'Recorded', time: agreement.createdAt },
    { label: 'Transcribed', time: agreement.transcriptId ? 'Processed' : 'Pending' },
    { label: 'Reviewed', time: agreement.reviewedAt || 'Pending' },
    { label: 'Extracted', time: agreement.extractedAt || 'Pending' },
    { label: 'Sent', time: agreement.sentAt || 'Pending' },
    { label: agreement.status === 'accepted' ? 'Confirmed' : agreement.status === 'rejected' ? 'Rejected' : 'Status', time: agreement.updatedAt || 'Today' }
  ]

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Agreement detail</p>
            <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">{agreement.product}</h1>
          </div>
          <StatusBadge status={agreement.status} />
        </header>

        <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Other party', agreement.otherPartyName],
              ['Quantity', agreement.quantity],
              ['Price', `₹${agreement.price.toLocaleString()}`],
              ['Delivery date', agreement.deliveryDate],
              ['Payment terms', agreement.paymentTerms],
              ['Special conditions', agreement.specialConditions]
            ].map(([label, value]) => (
              <div key={label} className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-3 text-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]/60">{label}</p>
                <p className="mt-1 font-semibold text-[var(--ink)]">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-['Source_Serif_4'] text-2xl">Status history</h2>
          <div className="mt-4">
            <Timeline items={timeline} />
          </div>
          {agreement.transcriptId ? (
            <div className="mt-4">
              <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = `/transcript-review?from=detail&tx=${agreement.transcriptId}` }} className="text-sm text-[var(--seal)] underline">View original transcript</a>
            </div>
          ) : null}
        </Card>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
