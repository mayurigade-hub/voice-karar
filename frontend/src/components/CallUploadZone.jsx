import { useCallback, useRef, useState } from 'react'

const ACCEPTED = ['mp3', 'wav', 'm4a', 'ogg']

export default function CallUploadZone({ onFileAccepted, maxSizeMB = 20 }) {
  const [state, setState] = useState('idle') // idle, drag, uploading, error
  const [error, setError] = useState('')
  const inputRef = useRef()

  const validateAndEmit = useCallback(
    (file) => {
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      if (!ACCEPTED.includes(ext)) {
        setError("This file type isn't supported — try mp3, wav, or m4a")
        setState('error')
        return
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large — max ${maxSizeMB}MB`)
        setState('error')
        return
      }

      setError('')
      setState('uploading')
      // small delay to simulate upload
      setTimeout(() => {
        setState('idle')
        onFileAccepted(file)
      }, 600)
    },
    [maxSizeMB, onFileAccepted]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setState('idle')
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndEmit(file)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setState('drag')
  }

  const onDragLeave = () => setState('idle')

  const onBrowse = () => inputRef.current?.click()

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) validateAndEmit(file)
  }

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`p-6 rounded-sm border-2 ${
          state === 'drag' ? 'border-[var(--seal)] scale-102' : state === 'error' ? 'border-[var(--alert-amber)]' : 'border-dashed border-[var(--ledger-line)]'
        }`}
        style={{ transformOrigin: 'center', transition: 'transform 120ms ease' }}
      >
        <div className="text-center">
          <p className="mb-3 text-sm">Drop your call recording here or browse</p>
          <button onClick={onBrowse} className="px-3 py-2 border border-[var(--ledger-line)] bg-[var(--paper)]">Browse files</button>
          <p className="mt-2 text-xs text-[var(--ink)]/70">Up to 10 minutes, {maxSizeMB}MB</p>
          {state === 'uploading' && <div className="mt-2 h-1 w-full bg-[var(--ledger-line)]"><div className="h-1 bg-[var(--trust-green)]" style={{ width: '40%' }} /></div>}
          {state === 'error' && <p className="mt-2 text-sm text-[var(--alert-amber)]">{error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED.map((e) => '.' + e).join(',')} onChange={onFileChange} className="hidden" />
    </div>
  )
}
