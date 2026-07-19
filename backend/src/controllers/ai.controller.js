import * as aiService from '../services/ai.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

export const generateAgreement = async (req, res, next) => {
  try {
    const transcript = typeof req.body.transcript === 'string' ? req.body.transcript.trim() : '';
    const audio = typeof req.body.audio === 'string' ? req.body.audio.trim() : '';
    const audioMimeType = req.body.audioMimeType || req.body.audio_mime_type;

    if (!transcript && !audio) {
      throw new ApiError(400, 'Either transcript or audio is required');
    }

    if (audio && !audioMimeType) {
      throw new ApiError(400, 'audioMimeType is required when audio is provided');
    }

    const result = await aiService.generateAndSaveAgreement(req.user._id, {
      transcript,
      audio,
      audioMimeType,
      outputLanguage: req.body.outputLanguage || req.body.output_language || 'English',
      detectedLanguage: req.body.detectedLanguage || req.body.detected_language,
      source: req.body.source || 'manual',
    });

    return res
      .status(201)
      .json(new ApiResponse(201, result, 'Agreement generated successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  generateAgreement,
};
