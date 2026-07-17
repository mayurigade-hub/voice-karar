import { useState } from 'react'
import { ArrowRight, MessageCircleMore, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Navbar from '../components/Navbar'
import MobileBottomNav from '../components/MobileBottomNav'

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center">
        <section className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2 text-sm uppercase tracking-[0.2em]">
            <ShieldCheck className="h-4 w-4 text-[var(--seal)]" />
            Voice Karar
          </div>
          <div className="space-y-3">
            <h1 className="font-['Source_Serif_4'] text-4xl leading-tight sm:text-5xl">Record a spoken agreement. Turn it into a trusted record.</h1>
            <p className="max-w-xl text-lg text-[var(--ink)]/70">Built for small business owners in India who want a clear, mutual agreement without legal complexity.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--ink)]/70">
            <span className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2">Hindi + English labels</span>
            <span className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2">Mobile-first flow</span>
            <span className="border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2">Secure link sharing</span>
          </div>
        </section>

        <section className="w-full max-w-md">
          <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
            <div className="mb-6 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--ink)]/70">
              <MessageCircleMore className="h-4 w-4 text-[var(--seal)]" />
              {step === 'phone' ? 'Sign in to continue' : 'Enter OTP'}
            </div>

            {step === 'phone' ? (
              <div className="space-y-4">
                <Input label="Phone number or email" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
                <Button className="w-full" onClick={() => setStep('otp')}>
                  Send code <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-[var(--ink)]/60">This is a mock auth screen. Real OTP/JWT integration can plug in later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map((digit) => (
                    <input key={digit} className="h-12 border border-[var(--ledger-line)] bg-[var(--paper)] text-center text-lg font-semibold text-[var(--ink)]" defaultValue={digit} />
                  ))}
                </div>
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  Verify & continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </section>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
