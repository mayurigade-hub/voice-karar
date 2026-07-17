const STORAGE_KEY = 'voicekarar-agreements'

const mockAgreements = [
  {
    id: 'agr-101',
    ownerName: 'Asha Mehta',
    otherPartyName: 'Rajat Traders',
    product: 'Cotton bags',
    quantity: 500,
    price: 1800,
    deliveryDate: '2026-08-10',
    paymentTerms: '50% advance, 50% on delivery',
    specialConditions: 'Bulk packing with company logo',
    status: 'accepted',
    createdAt: '2026-07-08',
    agreementLink: 'https://voicekarar.in/agr-101'
  },
  {
    id: 'agr-102',
    ownerName: 'Asha Mehta',
    otherPartyName: 'Kiran Motors',
    product: 'Spare parts kit',
    quantity: 12,
    price: 42000,
    deliveryDate: '2026-07-24',
    paymentTerms: 'Net 7 days',
    specialConditions: 'Warranty for 3 months',
    status: 'sent',
    createdAt: '2026-07-12',
    agreementLink: 'https://voicekarar.in/agr-102'
  }
]

const readStoredAgreements = () => {
  if (typeof window === 'undefined') {
    return mockAgreements
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : mockAgreements
  } catch {
    return mockAgreements
  }
}

const writeStoredAgreements = (agreements) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agreements))
}

export const getAgreements = async () => {
  // TODO: Replace with real Axios call when backend is available.
  return Promise.resolve(readStoredAgreements())
}

export const createAgreement = async (payload) => {
  // TODO: Replace with POST /agreements once backend exists.
  const agreement = {
    ...payload,
    id: payload.id || `agr-${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString().split('T')[0],
    agreementLink: `${typeof window !== 'undefined' ? window.location.origin : 'https://voicekarar.in'}/confirm/${payload.id || `agr-${Date.now()}`}`
  }

  const agreements = [...readStoredAgreements(), agreement]
  writeStoredAgreements(agreements)
  return Promise.resolve(agreement)
}

export const confirmAgreement = async (id, action, note = '') => {
  // TODO: Replace with PATCH /agreements/:id/confirm once backend exists.
  const agreements = readStoredAgreements().map((agreement) => {
    if (agreement.id !== id) return agreement
    return {
      ...agreement,
      status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'modified',
      note
    }
  })

  writeStoredAgreements(agreements)

  return Promise.resolve({
    id,
    action,
    note,
    status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'modified'
  })
}

export const getAgreementById = async (id) => {
  // TODO: Replace with GET /agreements/:id when backend is available.
  const agreement = readStoredAgreements().find((item) => item.id === id)
  return Promise.resolve(agreement || null)
}

// --- Mock transcript/call upload APIs (swap with real backend) ---

export const uploadCallRecording = async (fileOrBlob) => {
  // Simulate uploading and return a transcriptId + estimated seconds
  const transcriptId = `tx-${Date.now()}`
  const estimatedProcessingSeconds = 8 + Math.min(60, Math.round((fileOrBlob.size || 0) / (1024 * 1024)))
  // store a placeholder transcript
  const transcripts = JSON.parse(window.localStorage.getItem('vk-transcripts') || '{}')
  transcripts[transcriptId] = { text: 'Transcription in progress... (mock)', highlights: [] }
  window.localStorage.setItem('vk-transcripts', JSON.stringify(transcripts))
  return Promise.resolve({ transcriptId, estimatedProcessingSeconds })
}

export const getTranscript = async (transcriptId) => {
  const transcripts = JSON.parse(window.localStorage.getItem('vk-transcripts') || '{}')
  if (transcripts[transcriptId]) return Promise.resolve(transcripts[transcriptId])
  // fallback mock transcript
  const text = 'Buyer: I agree to buy 500 cotton bags at ₹1800 to be delivered on 10 August. Seller: agreed.'
  const highlights = [
    { text: '500', type: 'quantity', startIndex: text.indexOf('500'), endIndex: text.indexOf('500') + 3 },
    { text: '₹1800', type: 'price', startIndex: text.indexOf('₹1800'), endIndex: text.indexOf('₹1800') + 5 }
  ]
  return Promise.resolve({ text, highlights })
}

export const updateTranscript = async (transcriptId, correctedText) => {
  const transcripts = JSON.parse(window.localStorage.getItem('vk-transcripts') || '{}')
  transcripts[transcriptId] = { text: correctedText, highlights: [] }
  window.localStorage.setItem('vk-transcripts', JSON.stringify(transcripts))
  return Promise.resolve({ transcriptId })
}
