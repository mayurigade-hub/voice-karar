import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { getTranscript, updateTranscript } from '../services/api'

export default function TranscriptReviewScreen() {
  const loc = useLocation()
  const navigate = useNavigate()
  const { transcriptId, audio, source } = loc.state || {}
  const [transcript, setTranscript] = useState('')
  const [highlights, setHighlights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!transcriptId) {
      navigate('/record')
      return
    }
    let mounted = true
    const load = async () => {
      const res = await getTranscript(transcriptId)
      if (!mounted) return
      setTranscript(res.text)
      setHighlights(res.highlights || [])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [navigate, transcriptId])

  const handleSave = async () => {
    setLoading(true)
    await updateTranscript(transcriptId, transcript)
    setLoading(false)
    // proceed to agreement preview (using existing ReviewPage)
    navigate('/review', { state: { agreement: { id: `agr-${Date.now()}`, source, transcriptId } } })
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink)]/60">Transcript review</p>
            <h1 className="font-['Source_Serif_4'] text-3xl sm:text-4xl">Review the transcript</h1>
          </header>

          <Card>
            {loading ? <p>Loading transcript…</p> : (
              <div className="prose max-w-none">
                <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="w-full h-64 p-4" />
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">Highlights</h3>
                  <ul>
                    {highlights.map((h, idx) => (
                      <li key={idx} className="text-sm text-[var(--seal)]">{h.type}: {h.text}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={handleSave} className="bg-[var(--seal)] px-4 py-2 text-white">Looks good, extract agreement →</button>
              <button onClick={() => navigate('/record')} className="border px-4 py-2">Back</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
