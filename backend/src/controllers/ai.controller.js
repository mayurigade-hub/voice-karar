import * as aiService from '../services/ai.service.js';
import ApiResponse from '../utils/ApiResponse.js';

export const generateAgreement = async (req, res, next) => {
  try {
    const result = await aiService.generateAndSaveAgreement(req.user._id, {
      transcript: req.body.transcript,
      audio: req.body.audio,
      audioMimeType: req.body.audioMimeType || req.body.audio_mime_type,
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
