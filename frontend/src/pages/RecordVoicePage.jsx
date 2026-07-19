import { useEffect, useRef, useState } from 'react'
import { Mic, Square, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

export default function RecordVoicePage() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [waveform, setWaveform] = useState(Array.from({ length: 24 }, () => 24))
  const [errorMsg, setErrorMsg] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
      if (audioContextRef.current) audioContextRef.current.close()
      if (window.__voiceTimer) clearInterval(window.__voiceTimer)
    }
  }, [])

  const startVisualization = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 128
    source.connect(analyser)
    analyserRef.current = analyser
    audioContextRef.current = context

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const next = Array.from({ length: 24 }, (_, index) => {
        const sample = dataArray[index * 2] || 0
        return Math.max(16, (sample / 255) * 70)
      })
      setWaveform(next)
      animationRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const handleStart = async () => {
    setErrorMsg('')
    setIsRecording(true)
    setElapsed(0)
    try {
      await startVisualization()
    } catch (err) {
      console.error('Failed to access microphone:', err)
      setIsRecording(false)
      setErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone access denied. Please check your browser permissions.'
          : 'Could not access microphone. Please make sure a microphone is connected.'
      )
      return
    }

    const chunks = []
    audioChunksRef.current = chunks
    const recorder = new MediaRecorder(streamRef.current)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.start()

    const interval = setInterval(() => {
      setElapsed((value) => value + 1)
    }, 1000)
    window.__voiceTimer = interval
  }

  const handleStop = () => {
    if (!mediaRecorderRef.current) return

    mediaRecorderRef.current.onstop = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      navigate('/processing', { state: { audio: blob, source: 'live' } })
    }

    mediaRecorderRef.current.stop()
    clearInterval(window.__voiceTimer)
    setIsRecording(false)
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/75">Record voice summary</p>
          <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Speak naturally and let the record form itself.</h1>
          <p className="text-sm text-[var(--ink)]/80">The mic button stays central, and the waveform reacts to your voice in real time.</p>
        </header>

        <main className="flex flex-1 items-center justify-center py-8">
          <Card tone="stamp" className="w-full max-w-3xl border-t-4 border-t-[var(--seal)]">
            <div className="flex flex-col items-center gap-6 text-center">
              {errorMsg && (
                <div className="w-full rounded-none border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className={`flex h-32 w-32 items-center justify-center rounded-full border-2 border-[var(--seal)] ${isRecording ? 'bg-[var(--seal)] text-[var(--paper)]' : 'bg-[var(--paper)] text-[var(--seal)]'}`}>
                <Mic className="h-12 w-12" />
              </div>

              <div className="flex h-20 items-end gap-2">
                {waveform.map((height, index) => (
                  <div key={index} className="w-2 rounded-full bg-[var(--seal)]/70" style={{ height: `${height}px` }} />
                ))}
              </div>

              <p className="text-5xl font-semibold tabular-nums text-[var(--ink)]">{formatTime(elapsed)}</p>

              <div className="flex flex-wrap justify-center gap-3">
                {!isRecording ? (
                  <Button onClick={handleStart}>Start Recording</Button>
                ) : (
                  <Button onClick={handleStop} className="bg-[var(--seal)]">Stop Recording</Button>
                )}
                <Button variant="secondary" onClick={() => navigate('/create-agreement')}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
