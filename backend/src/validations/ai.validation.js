/**
 * Validation helpers for backend-mediated AI processing.
 *
 * The frontend must never call the AI agent directly; this validation guards the
 * Express boundary before the backend forwards a clean payload to the AI engine.
 */

const allowedSources = ['manual', 'live', 'upload'];

export const generateAgreementSchema = {
  body: {
    transcript: {
      required: false,
      type: 'string',
    },
    audio: {
      required: false,
      type: 'string',
    },
    audioMimeType: {
      required: false,
      type: 'string',
    },
    audio_mime_type: {
      required: false,
      type: 'string',
    },
    outputLanguage: {
      required: false,
      type: 'string',
    },
    output_language: {
      required: false,
      type: 'string',
    },
    detectedLanguage: {
      required: false,
      type: 'string',
    },
    detected_language: {
      required: false,
      type: 'string',
    },
    source: {
      required: false,
      type: 'string',
      enum: allowedSources,
    },
  },
};

export default {
  generateAgreementSchema,
};
