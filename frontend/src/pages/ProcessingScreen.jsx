/**
 * frontend/src/pages/ProcessingScreen.jsx
 *
 * Handles all three input types by calling the real backend AI endpoint.
 *
 * Flow:
 *  1. Receive state from the previous page: { audio, source, text }
 *  2. Convert audio Blob → base64 (for voice/upload)
 *  3. POST /api/v1/ai/generate → Backend → AI Agent → Gemini
 *  4. Navigate to /agreement-preview with the real draft object
 *  5. If there are missingFields, also pass them for the follow-up questions page
 */

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock3, AlertCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { generateAgreement } from '../services/api'
import { blobToBase64, getAudioMimeType } from '../services/audioUtils'

const allSteps = [
  { label: 'Speech to Text', key: 'speech' },
  { label: 'AI Analysis', key: 'analysis' },
  { label: 'Extracting Agreement', key: 'extract' },
  { label: 'Preparing Draft', key: 'draft' },
]

export default function ProcessingScreen() {
  const loc = useLocation()
  const navigate = useNavigate()
  const { audio, source, text } = loc.state || {}

  const [completedSteps, setCompletedSteps] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  // For manual text, skip the "Speech to Text" step
  const steps = source === 'manual'
    ? allSteps.filter((s) => s.key !== 'speech')
    : allSteps

  useEffect(() => {
    if (!audio && source !== 'manual') {
      navigate('/create-agreement')
      return
    }

    mountedRef.current = true

    const run = async () => {
      if (source === 'manual' && !String(text || '').trim()) {
        setError('Please enter an agreement summary before generating an agreement.')
        setLoading(false)
        return
      }

      // Animate the steps while the API call is in progress
      let stepIndex = 0
      const stepInterval = setInterval(() => {
        if (!mountedRef.current) return
        if (stepIndex < steps.length - 1) {
          stepIndex += 1
          setCompletedSteps(steps.slice(0, stepIndex).map((s) => s.key))
        }
      }, 1200)

      try {
        let payload

        if (source === 'manual') {
          // Manual text → send transcript directly
          payload = await generateAgreement({
            transcript: text,
            source: 'manual',
            outputLanguage: 'English',
          })
        } else {
          // Voice (live recording) or audio file upload → convert to base64
          const audioBase64 = await blobToBase64(audio)
          const audioMimeType = getAudioMimeType(audio)
          payload = await generateAgreement({
            audio: audioBase64,
            audioMimeType,
            source: source || 'live',
            outputLanguage: 'English',
          })
        }

        clearInterval(stepInterval)
        if (!mountedRef.current) return

        // Mark all steps complete
        setCompletedSteps(steps.map((s) => s.key))

        // Small delay so the user sees all steps checked before navigating
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (!mountedRef.current) return

        const { draft, ai } = payload

        // If there are missing fields, go to follow-up questions first
        if (ai?.missing_fields?.length > 0) {
          navigate('/followup-questions', {
            state: {
              agreementId: draft?.id,
              missingFields: ai.missing_fields,
              draft,
              source,
            },
          })
        } else {
          // All fields present — go straight to preview
          navigate('/agreement-preview', {
            state: { agreement: draft, source },
          })
        }
      } catch (err) {
        clearInterval(stepInterval)
        if (!mountedRef.current) return
        setError(err.message || 'Failed to process your audio. Please try again.')
        setLoading(false)
      }
    }

    run()

    return () => {
      mountedRef.current = false
    }
  }, []) // run once on mount

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Card tone="stamp" className="border-t-4 border-t-[var(--seal)]">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--ink)]/80">
              <Clock3 className="h-4 w-4 text-[var(--seal)]" />
              {error ? 'Processing failed' : 'Preparing your agreement'}
            </div>

            {error ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => navigate(-1)}>Try Again</Button>
                  <Button variant="secondary" onClick={() => navigate('/create-agreement')}>
                    Start Over
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {steps.map((step) => {
                  const done = completedSteps.includes(step.key)
                  return (
                    <div
                      key={step.key}
                      className={`flex items-center justify-between border border-[var(--ledger-line)] bg-[var(--paper)] px-4 py-3 ${done ? 'text-[var(--trust-green)]' : 'text-[var(--ink)]/70'}`}
                    >
                      <span>{step.label}</span>
                      {done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock3 className="h-5 w-5 animate-spin" />
                      )}
                    </div>
                  )
                })}
                <p className="mt-4 text-sm text-[var(--ink)]/60">
                  AI is processing your {source === 'manual' ? 'text' : 'audio'}. This may take 10-30 seconds...
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
