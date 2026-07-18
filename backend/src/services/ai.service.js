import config from '../config/env.js';
import * as agreementService from './agreement.service.js';

const normalizeText = (value = '') => String(value || '').trim();

const numberFrom = (value) => {
  const match = normalizeText(value).replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
};

const firstUseful = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => normalizeText(item) && normalizeText(item).toLowerCase() !== 'not specified');
      if (found) return found;
      continue;
    }
    if (normalizeText(value) && normalizeText(value).toLowerCase() !== 'not specified') return value;
  }
  return '';
};

const extractWithFallback = (transcript = '') => {
  const text = normalizeText(transcript);
  const quantity = numberFrom(text.match(/\b(\d+)\s+(?:pieces|pcs|bags|shirts|units|kg|boxes)?/i)?.[1]);
  const priceMatch = text.match(/(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:rupees|rs)/i);
  const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : undefined;
  const partyMatch = text.match(/(?:with|from|to)\s+([A-Z][A-Za-z\s&.-]{2,40}?)(?:\s+to|\s+for|\s+will|\s+on|\.|,|$)/);
  const productMatch = text.match(/(?:supply|buy|purchase|deliver|sell)\s+(?:\d+\s+)?([A-Za-z\s-]{3,50}?)(?:\s+for|\s+at|\s+by|\.|,|$)/i);
  const deliveryMatch = text.match(/(?:delivery|deliver(?:ed)?)(?:\s+will\s+be|\s+by|\s+on|.*?\s+on)?\s+([0-9]{1,2}\s+[A-Za-z]+(?:\s+[0-9]{4})?|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  const paymentMatch = text.match(/(\d+%\s+advance(?:,\s*\d+%\s+on\s+delivery)?|net\s+\d+\s+days|full payment[^.]*|payment[^.]*)/i);

  const party1 = 'Current user';
  const party2 = normalizeText(partyMatch?.[1]) || 'Other party';
  const product = normalizeText(productMatch?.[1]) || 'Business goods or services';
  const paymentAmount = price ? `INR ${price}` : 'Not Specified';
  const paymentTerms = normalizeText(paymentMatch?.[1]) || 'Not Specified';
  const deliveryDate = normalizeText(deliveryMatch?.[1]) || 'Not Specified';

  const structuredData = {
    party_1: party1,
    party_2: party2,
    agreement_purpose: product,
    payment_amount: paymentAmount,
    payment_terms: paymentTerms,
    agreement_duration: deliveryDate,
    responsibilities: {
      party_1: ['Make payment as agreed'],
      party_2: [`Supply ${quantity || ''} ${product}`.replace(/\s+/g, ' ').trim()],
    },
    important_dates: [deliveryDate],
    witnesses: ['Not Specified'],
    special_conditions: ['Not Specified'],
    location: 'Not Specified',
  };

  return {
    transcript: text,
    detected_language: 'English',
    structured_data: structuredData,
    missing_fields: Object.entries({
      price: paymentAmount,
      deliveryDate,
      paymentTerms,
    }).filter(([, value]) => value === 'Not Specified').map(([key]) => key),
    agreement: [
      '# Agreement Draft',
      '',
      `${party1} and ${party2} agree for ${product}.`,
      quantity ? `Quantity: ${quantity}.` : '',
      price ? `Price: INR ${price}.` : '',
      deliveryDate !== 'Not Specified' ? `Delivery/date term: ${deliveryDate}.` : '',
      paymentTerms !== 'Not Specified' ? `Payment terms: ${paymentTerms}.` : '',
    ].filter(Boolean).join('\n'),
  };
};

const callAgent = async ({ transcript, audio, audioMimeType, outputLanguage, detectedLanguage }) => {
  const response = await fetch(`${config.aiAgentUrl}/generate-agreement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      audio,
      audio_mime_type: audioMimeType,
      output_language: outputLanguage || 'English',
      detected_language: detectedLanguage,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.details || `AI agent failed with ${response.status}`);
  }
  return payload;
};

export const mapAiToAgreementPayload = (aiPayload, source = 'manual') => {
  const data = aiPayload.structured_data || {};
  const amount = firstUseful(data.payment_amount);
  const price = numberFrom(amount);
  const dateText = firstUseful(data.important_dates, data.agreement_duration);
  const deliveryDate = Date.parse(dateText) ? new Date(dateText) : undefined;
  const product = firstUseful(data.agreement_purpose, 'Business agreement');
  const counterPartyName = firstUseful(data.party_2, data.party_1, 'Other party');

  return {
    title: `${product} - ${counterPartyName}`.slice(0, 180),
    rawTranscript: aiPayload.transcript || '',
    agreedTerms: {
      product,
      quantity: numberFrom(JSON.stringify(data.responsibilities || {})),
      unit: '',
      pricePerUnit: price,
      totalAmount: price,
      ...(deliveryDate ? { deliveryDate } : {}),
      paymentTerms: firstUseful(data.payment_terms, amount),
      specialConditions: firstUseful(data.special_conditions),
    },
    counterParty: {
      name: counterPartyName,
      role: 'other',
    },
    aiExtractedData: {
      ...aiPayload,
      source,
    },
  };
};

export const toFrontendDraft = (agreement, aiPayload) => {
  const json = typeof agreement?.toJSON === 'function' ? agreement.toJSON() : agreement;
  const terms = json?.agreedTerms || {};

  return {
    id: json?.id || json?._id,
    supplierName: json?.counterParty?.name || 'Other party',
    otherPartyName: json?.counterParty?.name || 'Other party',
    product: terms.product || 'Business agreement',
    quantity: terms.quantity || '',
    price: terms.pricePerUnit || terms.totalAmount || '',
    deliveryDate: terms.deliveryDate ? new Date(terms.deliveryDate).toISOString().slice(0, 10) : '',
    paymentTerms: terms.paymentTerms || '',
    specialConditions: terms.specialConditions || '',
    status: json?.status || 'pending',
    createdAt: json?.createdAt ? new Date(json.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    agreementLink: json?.shareUrl || `${config.appBaseUrl}/confirm/${json?.shareToken}`,
    shareToken: json?.shareToken,
    source: json?.aiExtractedData?.source || 'manual',
    transcriptId: aiPayload?.id || null,
    rawTranscript: json?.rawTranscript || aiPayload?.transcript || '',
    agreementText: aiPayload?.agreement || json?.aiExtractedData?.agreement || '',
    missingFields: aiPayload?.missing_fields || [],
  };
};

export const generateAndSaveAgreement = async (userId, options) => {
  let aiPayload;
  try {
    aiPayload = await callAgent(options);
  } catch (error) {
    console.warn(`[AI] Falling back to local parser: ${error.message}`);
    aiPayload = extractWithFallback(options.transcript || 'Audio uploaded for agreement generation.');
  }

  const agreementPayload = mapAiToAgreementPayload(aiPayload, options.source);
  const agreement = await agreementService.createAgreement(userId, agreementPayload);

  return {
    ai: aiPayload,
    agreement,
    draft: toFrontendDraft(agreement, aiPayload),
  };
};

export default {
  generateAndSaveAgreement,
  mapAiToAgreementPayload,
  toFrontendDraft,
};
