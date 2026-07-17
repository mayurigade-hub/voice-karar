import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import VoiceRecorderButton from '../components/VoiceRecorderButton'
import Card from '../components/Card'

export default function RecordingScreen() {
  const navigate = useNavigate()

  const handleComplete = (audioBlobOrFile, source) => {
    // for uploads, if it's a File keep it; for live it's a Blob
    navigate('/processing', { state: { audio: audioBlobOrFile, source } })
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Record your agreement</p>
            <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Record or upload your call</h1>
            <p className="text-sm text-[var(--ink)]/70">Just talk us through it — quick and easy, or upload a call recording.</p>
          </header>

          <Card>
            <VoiceRecorderButton onRecordingComplete={handleComplete} />
          </Card>
        </div>
      </div>
    </div>
  )
}
