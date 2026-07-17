import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { uploadCallRecording } from '../services/api'

export default function ProcessingScreen() {
  const loc = useLocation()
  const navigate = useNavigate()
  const { audio, source } = loc.state || {}
  const [step, setStep] = useState(0)
  const steps = ['Transcribing audio...', 'Understanding the conversation...', 'Extracting agreement details...', 'Checking for missing information...']
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!audio) {
      navigate('/record')
      return
    }

    let mounted = true

    const runSteps = async () => {
      if (source === 'upload') {
        // simulate upload and get estimated time
        const res = await uploadCallRecording(audio)
        const total = res.estimatedProcessingSeconds || 20
        let elapsed = 0
        const iv = setInterval(() => {
          elapsed += 1
          setProgress(Math.min(100, Math.round((elapsed / total) * 100)))
          if (elapsed >= total) {
            clearInterval(iv)
            navigate('/transcript-review', { state: { transcriptId: res.transcriptId, audio, source } })
          }
        }, 1000)
        return
      }

      // for live, just step through
      for (let i = 0; i < steps.length; i++) {
        if (!mounted) return
        setStep(i)
        await new Promise((r) => setTimeout(r, 800))
      }
      if (mounted) {
        // mock transcript id
        navigate('/transcript-review', { state: { transcriptId: `tx-${Date.now()}`, audio, source } })
      }
    }

    runSteps()

    return () => { mounted = false }
  }, [audio, navigate, source])

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Card>
            <h2 className="text-xl font-semibold">Processing</h2>
            {source === 'upload' ? (
              <div className="mt-4">
                <p className="text-sm">Uploading & transcribing. Estimated time remaining:</p>
                <div className="mt-2 h-2 w-full bg-[var(--ledger-line)]"><div className="h-2 bg-[var(--trust-green)]" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-sm">{progress}%</p>
              </div>
            ) : (
              <ol className="mt-4 list-decimal list-inside">
                {steps.map((s, i) => (
                  <li key={s} className={`mb-2 ${i < step ? 'text-[var(--trust-green)]' : i === step ? 'font-semibold' : ''}`}>{s}</li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
