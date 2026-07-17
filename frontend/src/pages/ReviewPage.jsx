import { useEffect, useState } from 'react'
import { PencilLine, SendHorizonal } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import MobileBottomNav from '../components/MobileBottomNav'
import Navbar from '../components/Navbar'

const initialFields = {
  otherPartyName: 'Rajat Traders',
  product: 'Cotton bags',
  quantity: '500',
  price: '1800',
  deliveryDate: '2026-08-10',
  paymentTerms: '50% advance, 50% on delivery',
  specialConditions: 'Bulk packing with company logo'
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const incomingAgreement = location.state?.agreement

  const [fields, setFields] = useState(() => ({
    otherPartyName: incomingAgreement?.otherPartyName || initialFields.otherPartyName,
    product: incomingAgreement?.product || initialFields.product,
    quantity: incomingAgreement?.quantity?.toString() || initialFields.quantity,
    price: incomingAgreement?.price?.toString() || initialFields.price,
    deliveryDate: incomingAgreement?.deliveryDate || initialFields.deliveryDate,
    paymentTerms: incomingAgreement?.paymentTerms || initialFields.paymentTerms,
    specialConditions: incomingAgreement?.specialConditions || initialFields.specialConditions
  }))

  useEffect(() => {
    if (!incomingAgreement) return
    setFields({
      otherPartyName: incomingAgreement.otherPartyName || initialFields.otherPartyName,
      product: incomingAgreement.product || initialFields.product,
      quantity: incomingAgreement.quantity?.toString() || initialFields.quantity,
      price: incomingAgreement.price?.toString() || initialFields.price,
      deliveryDate: incomingAgreement.deliveryDate || initialFields.deliveryDate,
      paymentTerms: incomingAgreement.paymentTerms || initialFields.paymentTerms,
      specialConditions: incomingAgreement.specialConditions || initialFields.specialConditions
    })
  }, [incomingAgreement])

  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }))

  const handleContinue = () => {
    const agreement = {
      ...incomingAgreement,
      id: incomingAgreement?.id || `agr-${Date.now()}`,
      ownerName: incomingAgreement?.ownerName || 'Asha Mehta',
      otherPartyName: fields.otherPartyName,
      product: fields.product,
      quantity: Number(fields.quantity) || 0,
      price: Number(fields.price) || 0,
      deliveryDate: fields.deliveryDate,
      paymentTerms: fields.paymentTerms,
      specialConditions: fields.specialConditions,
      status: incomingAgreement?.status || 'draft'
    }

    navigate('/share', { state: { agreement } })
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Review agreement</p>
            <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Check every term before sending</h1>
          </header>

          <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--ink)]/70">
              <PencilLine className="h-4 w-4 text-[var(--seal)]" />
              Tap any field to edit
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(fields).map(([key, value]) => (
                <Input key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={value} onChange={(e) => updateField(key, e.target.value)} placeholder="Enter detail" />
              ))}
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleContinue}>
              <SendHorizonal className="mr-2 h-4 w-4" /> Confirm & send
            </Button>
            <Button variant="secondary" onClick={() => navigate('/record')}>
              Back to recording
            </Button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
