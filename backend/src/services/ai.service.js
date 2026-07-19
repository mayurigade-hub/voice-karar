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

// ─── Local fallback parser (used when AI agent is unreachable) ────────────────

const extractWithFallback = (transcript = '') => {
  const text = normalizeText(transcript);
  const quantity = numberFrom(text.match(/\b(\d+)\s+(?:pieces|pcs|bags|shirts|units|kg|boxes)?/i)?.[1]);
  const priceMatch = text.match(/(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:rupees|rs)/i);
  const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : undefined;
  const partyMatch = text.match(/(?:with|from|to)\s+([A-Z][A-Za-z\s&.-]{2,40}?)(?:\s+to|\s+for|\s+will|\s+on|\.|,|$)/);
  const productMatch = text.match(/(?:supply|buy|purchase|deliver|sell)\s+(?:\d+\s+)?([A-Za-z\s-]{3,50}?)(?:\s+for|\s+at|\s+by|\.|,|$)/i);
  const deliveryMatch = text.match(/(?:delivery|deliver(?:ed)?)(?:\s+will\s+be|\s+by|\s+on|.*?\s+on)?\s+([0-9]{1,2}\s+[A-Za-z]+(?:\s+[0-9]{4})?|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  const paymentMatch = text.match(/(\d+%\s+advance(?:,\s*\d+%\s+on\s+delivery)?|net\s+\d+\s+days|full payment[^.]*|payment[^.]*)/i);
  const locationMatch = text.match(/(?:delivered?\s+to|warehouse\s+in|located\s+in|at)\s+([A-Z][A-Za-z\s,.-]{2,60}?)(?:\.|,|$)/i);
  const conditionMatch = text.match(/(?:damaged|replacement|penalty|fine|conditions?)[^.]*\./i);

  const party1 = 'Current user';
  const party2 = normalizeText(partyMatch?.[1]) || 'Other party';
  const product = normalizeText(productMatch?.[1]) || 'Business goods or services';
  const paymentAmount = price ? `INR ${price}` : 'Not Specified';
  const paymentTerms = normalizeText(paymentMatch?.[1]) || 'Not Specified';
  const deliveryDate = normalizeText(deliveryMatch?.[1]) || 'Not Specified';
  const deliveryLocation = normalizeText(locationMatch?.[1]) || 'Not Specified';
  const specialCondition = normalizeText(conditionMatch?.[0]) || 'Not Specified';

  const structuredData = {
    party_1: party1,
    party_2: party2,
    agreement_purpose: product,
    quantity: quantity ? String(quantity) : 'Not Specified',
    unit_price: price ? `₹${price}` : 'Not Specified',
    total_amount: quantity && price ? `₹${quantity * price}` : (price ? `₹${price}` : 'Not Specified'),
    payment_amount: paymentAmount,
    payment_terms: paymentTerms,
    agreement_duration: deliveryDate,
    responsibilities: {
      party_1: ['Make payment as agreed'],
      party_2: [`Supply ${quantity || ''} ${product}`.replace(/\s+/g, ' ').trim()],
    },
    important_dates: [deliveryDate],
    witnesses: ['Not Specified'],
    special_conditions: specialCondition !== 'Not Specified' ? [specialCondition] : ['Not Specified'],
    location: 'Not Specified',
    delivery_location: deliveryLocation,
    summary: 'Not Specified',
  };

  return {
    transcript: text,
    detected_language: 'English',
    structured_data: structuredData,
    missing_fields: [],
    agreement: [
      '# Agreement Draft',
      '',
      `${party1} and ${party2} agree for ${product}.`,
      quantity ? `Quantity: ${quantity}.` : '',
      price ? `Unit Price: INR ${price}.` : '',
      deliveryDate !== 'Not Specified' ? `Delivery date: ${deliveryDate}.` : '',
      paymentTerms !== 'Not Specified' ? `Payment terms: ${paymentTerms}.` : '',
      deliveryLocation !== 'Not Specified' ? `Delivery location: ${deliveryLocation}.` : '',
    ].filter(Boolean).join('\n'),
  };
};

// ─── AI Agent caller ──────────────────────────────────────────────────────────

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

const callAgentUpdate = async ({ id, structuredData }) => {
  const response = await fetch(`${config.aiAgentUrl}/update-agreement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      structured_data: structuredData,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.details || `AI agent update failed with ${response.status}`);
  }
  return payload;
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (normalizeText(value)) return [value];
  return [];
};

// ─── Build structured-data patch to send to AI agent on updates ───────────────

export const buildStructuredDataUpdate = (agreement, updates = {}) => {
  const existing = agreement?.aiExtractedData?.structured_data || {};
  const agreedTerms = updates.agreedTerms || {};
  const counterParty = updates.counterParty || {};
  const next = {
    ...existing,
    ...(updates.aiStructuredData || {}),
  };

  if (counterParty.name) next.party_2 = counterParty.name;
  if (agreedTerms.product) next.agreement_purpose = agreedTerms.product;
  if (agreedTerms.paymentTerms) next.payment_terms = agreedTerms.paymentTerms;
  if (agreedTerms.specialConditions) {
    next.special_conditions = normalizeArray(agreedTerms.specialConditions);
  }
  if (agreedTerms.deliveryLocation) next.delivery_location = agreedTerms.deliveryLocation;

  // Update pricing fields separately
  if (agreedTerms.pricePerUnit) next.unit_price = `₹${agreedTerms.pricePerUnit}`;
  if (agreedTerms.totalAmount) {
    next.total_amount = `₹${agreedTerms.totalAmount}`;
    next.payment_amount = `INR ${agreedTerms.totalAmount}`;
  } else if (agreedTerms.pricePerUnit) {
    next.payment_amount = `INR ${agreedTerms.pricePerUnit}`;
  }

  if (agreedTerms.deliveryDate) {
    next.agreement_duration = agreedTerms.deliveryDate;
    next.important_dates = [agreedTerms.deliveryDate];
  }

  return next;
};

// ─── Map AI response → MongoDB agreement payload ──────────────────────────────

/**
 * FIXED mapping: quantity, unit price, total amount, delivery location, and
 * summary are now read from dedicated AI fields instead of being guessed from
 * stringified "responsibilities" or a single payment_amount value.
 */
export const mapAiToAgreementPayload = (aiPayload, source = 'manual') => {
  const data = aiPayload.structured_data || {};

  // Quantity — read the new dedicated field first, fall back to old heuristic
  const rawQty = data.quantity && data.quantity !== 'Not Specified' ? data.quantity : '';
  const quantity = numberFrom(rawQty) || undefined;

  // Pricing — keep unit price and total amount as separate values
  const rawUnitPrice  = data.unit_price   && data.unit_price   !== 'Not Specified' ? data.unit_price   : '';
  const rawTotalAmt   = data.total_amount && data.total_amount !== 'Not Specified' ? data.total_amount : '';
  const rawPayAmt     = data.payment_amount && data.payment_amount !== 'Not Specified' ? data.payment_amount : '';

  const pricePerUnit = numberFrom(rawUnitPrice) || undefined;
  const totalAmount  = numberFrom(rawTotalAmt)  || numberFrom(rawPayAmt) || undefined;

  // Date — prefer explicit important_dates entries over agreement_duration text
  const dateText    = firstUseful(data.important_dates, data.agreement_duration);
  const deliveryDate = Date.parse(dateText) ? new Date(dateText) : undefined;

  const product           = firstUseful(data.agreement_purpose, 'Business agreement');
  const counterPartyName  = firstUseful(data.party_2, data.party_1, 'Other party');
  const deliveryLocation  = data.delivery_location && data.delivery_location !== 'Not Specified' ? data.delivery_location : '';
  const summary           = data.summary           && data.summary           !== 'Not Specified' ? data.summary           : '';
  const paymentTermsVal   = firstUseful(data.payment_terms, rawPayAmt || rawUnitPrice);

  return {
    title: `${product} - ${counterPartyName}`.slice(0, 180),
    rawTranscript: aiPayload.transcript || '',
    agreedTerms: {
      product,
      quantity,
      unit: '',
      pricePerUnit,
      totalAmount,
      ...(deliveryDate ? { deliveryDate } : {}),
      paymentTerms: paymentTermsVal,
      specialConditions: firstUseful(data.special_conditions),
      deliveryLocation,
      summary,
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

// ─── Convert a saved agreement + AI payload → lightweight frontend draft ──────

export const toFrontendDraft = (agreement, aiPayload) => {
  const json  = typeof agreement?.toJSON === 'function' ? agreement.toJSON() : agreement;
  const terms = json?.agreedTerms || {};

  return {
    id:             json?.id || json?._id,
    supplierName:   json?.counterParty?.name || '',
    otherPartyName: json?.counterParty?.name || '',
    product:        terms.product       || '',
    quantity:       terms.quantity      ?? '',
    pricePerUnit:   terms.pricePerUnit  ?? '',
    totalAmount:    terms.totalAmount   ?? '',
    deliveryDate:   terms.deliveryDate  ? new Date(terms.deliveryDate).toISOString().slice(0, 10) : '',
    paymentTerms:   terms.paymentTerms  || '',
    specialConditions: terms.specialConditions || '',
    deliveryLocation:  terms.deliveryLocation  || '',
    summary:           terms.summary           || aiPayload?.structured_data?.summary || '',
    status:         json?.status    || 'pending',
    createdAt:      json?.createdAt ? new Date(json.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    agreementLink:  json?.shareUrl  || `${config.appBaseUrl}/confirm/${json?.shareToken}`,
    shareToken:     json?.shareToken,
    source:         json?.aiExtractedData?.source || 'manual',
    transcriptId:   aiPayload?.id || null,
    rawTranscript:  json?.rawTranscript || aiPayload?.transcript || '',
    agreementText:  aiPayload?.agreement || json?.aiExtractedData?.agreement || '',
    missingFields:  aiPayload?.missing_fields || [],
  };
};

// ─── Generate a new agreement from audio/transcript ───────────────────────────

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
    ai:    aiPayload,
    agreement,
    draft: toFrontendDraft(agreement, aiPayload),
  };
};

// ─── Re-process an agreement after user answers follow-up questions ───────────

export const refreshAgreementWithAnswers = async (agreement, updates = {}) => {
  const aiAgentId = agreement?.aiExtractedData?.id;
  if (!aiAgentId) return null;

  const structuredData = buildStructuredDataUpdate(agreement, updates);
  const aiPayload = await callAgentUpdate({ id: aiAgentId, structuredData });

  agreement.aiExtractedData = {
    ...(agreement.aiExtractedData || {}),
    ...aiPayload,
    source: agreement.aiExtractedData?.source || 'manual',
  };

  await agreement.save();
  return {
    ai:    aiPayload,
    draft: toFrontendDraft(agreement, aiPayload),
  };
};

export default {
  generateAndSaveAgreement,
  mapAiToAgreementPayload,
  toFrontendDraft,
  refreshAgreementWithAnswers,
};
