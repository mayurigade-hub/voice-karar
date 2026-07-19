import { useState, useRef, useEffect } from 'react'
import { FolderUp, Play, Pause, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

export default function UploadAudioPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    setFile(selectedFile)
    setProgress(30)
    setTimeout(() => setProgress(70), 400)
    setTimeout(() => setProgress(100), 800)

    audioRef.current = new Audio(URL.createObjectURL(selectedFile))
    audioRef.current.onended = () => setIsPlaying(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  const handleTogglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleRemove = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setFile(null)
    setIsPlaying(false)
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/75">Upload audio</p>
          <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Drop in a voice note or call recording.</h1>
        </header>

        <main className="flex flex-1 items-center py-8">
          <Card tone="stamp" className="w-full border-t-4 border-t-[var(--seal)]">
            <div
              onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-none border-2 border-dashed p-8 text-center ${dragActive ? 'border-[var(--seal)] bg-[var(--seal)]/10' : 'border-[var(--ledger-line)]'}`}>
              <FolderUp className="mx-auto h-10 w-10 text-[var(--seal)]" />
              <p className="mt-4 font-['Source_Serif_4'] text-2xl">Drag and drop your audio file</p>
              <p className="mt-2 text-sm text-[var(--ink)]/70">MP3, WAV, and M4A supported.</p>
              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 border border-[var(--ledger-line)] bg-[var(--paper)] px-3 py-2 text-sm uppercase tracking-[0.16em]">
                <Plus className="h-4 w-4" />
                Choose file
                <input type="file" accept="audio/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
              </label>
            </div>

            {file ? (
              <div className="mt-6 rounded-none border border-[var(--ledger-line)] bg-[var(--paper)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-[var(--ink)]/70">{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="border border-[var(--ledger-line)] bg-[var(--paper)] p-2" title="Preview" onClick={handleTogglePlay}>
                      {isPlaying ? <Pause className="h-4 w-4 text-[var(--seal)]" /> : <Play className="h-4 w-4 text-[var(--seal)]" />}
                    </button>
                    <button className="border border-[var(--ledger-line)] bg-[var(--paper)] p-2" title="Remove" onClick={handleRemove}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-[var(--ledger-line)]">
                  <div className="h-2 bg-[var(--trust-green)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => file && navigate('/processing', { state: { audio: file, source: 'upload' } })}>Upload File</Button>
              <Button variant="secondary" onClick={() => navigate('/create-agreement')}>Cancel</Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
