import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import CallUploadZone from './CallUploadZone'

export default function VoiceRecorderButton({ onRecordingComplete, maxDurationSeconds = 600, acceptedFormats = ['mp3', 'wav', 'm4a', 'ogg'] }) {
  const [mode, setMode] = useState('live') // live | upload
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [timer, setTimer] = useState(0)
  const rafRef = useRef()
  const analyserRef = useRef()
  const audioRef = useRef()
  const chunksRef = useRef([])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    let t
    if (isRecording) {
      t = setInterval(() => setTimer((s) => s + 1), 1000)
    } else {
      clearInterval(t)
    }
    return () => clearInterval(t)
  }, [isRecording])

  const startLive = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecordingComplete && onRecordingComplete(blob, 'live')
      }
      mr.start()
      setMediaRecorder(mr)
      setIsRecording(true)
      setTimer(0)

      // setup analyser
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const canvas = document.getElementById('vk-wave')
      const canvasCtx = canvas?.getContext('2d')

      const draw = () => {
        if (!canvasCtx || !analyserRef.current) return
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
        const barWidth = (canvas.width / bufferLength) * 1.5
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255.0
          const h = v * canvas.height
          canvasCtx.fillStyle = '#8C3B2E'
          canvasCtx.fillRect(x, canvas.height - h, barWidth, h)
          x += barWidth + 1
        }
        rafRef.current = requestAnimationFrame(draw)
      }
      rafRef.current = requestAnimationFrame(draw)
    } catch (err) {
      console.error(err)
      alert('Microphone access denied or unavailable')
    }
  }

  const stopLive = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    setIsRecording(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (analyserRef.current && analyserRef.current.context) analyserRef.current.context.close()
  }

  const toggleRecord = () => {
    if (isRecording) stopLive()
    else startLive()
  }

  const onFileAccepted = async (file) => {
    // read file and produce blob
    onRecordingComplete && onRecordingComplete(file, 'upload')
    setAudioUrl(URL.createObjectURL(file))
    setRecordedBlob(file)
  }

  const formatTime = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-sm overflow-hidden border border-[var(--ledger-line)]">
        <button onClick={() => setMode('live')} className={`px-3 py-2 ${mode === 'live' ? 'bg-[var(--seal)]/10' : ''}`}>🎙 Record Live</button>
        <button onClick={() => setMode('upload')} className={`px-3 py-2 ${mode === 'upload' ? 'bg-[var(--seal)]/10' : ''}`}>📁 Upload Recording</button>
      </div>

      {mode === 'live' ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <canvas id="vk-wave" width="400" height="80" className="rounded-sm bg-[var(--paper)]" />
            <button onClick={toggleRecord} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--seal)] p-6 text-white">
              {isRecording ? <Pause /> : <Play />}
            </button>
          </div>
          <div className="text-sm text-[var(--ink)]/70">{formatTime(timer)}</div>
          {recordedBlob ? (
            <div className="flex gap-2">
              <audio ref={audioRef} src={audioUrl} controls className="w-96" />
              <button onClick={() => { setRecordedBlob(null); setAudioUrl(null) }} className="border px-3 py-2">Re-record</button>
              <button onClick={() => onRecordingComplete && onRecordingComplete(recordedBlob, 'live')} className="bg-[var(--trust-green)] px-3 py-2 text-white">Use this recording</button>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <CallUploadZone onFileAccepted={onFileAccepted} />
          {recordedBlob ? (
            <div className="mt-3 flex items-center gap-3">
              <audio src={audioUrl} controls className="w-96" />
              <div className="text-sm text-[var(--ink)]/70">{recordedBlob.name} • {(recordedBlob.size / 1024 / 1024).toFixed(2)}MB</div>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => {
            if (!recordedBlob) {
              alert('No recording selected')
              return
            }
            onRecordingComplete && onRecordingComplete(recordedBlob, mode === 'live' ? 'live' : 'upload')
          }}
          className="bg-[var(--seal)] px-4 py-2 text-white"
        >
          Submit for Processing
        </button>
      </div>
    </div>
  )
}
 
