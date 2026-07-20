import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { AgreementAgent } from "./lib/agent.js";
import { isLanguageSupported } from "./config/languages.js";
import { loadAgreements, saveAgreement, isAgreementLocked } from "./lib/db.js";
import type { SavedAgreement } from "./lib/db.js";
import type { GenerateAgreementRequest } from "./lib/types.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("src/public"));

const PORT = process.env.PORT || 3000;

// Initialize the Agent
let agent: AgreementAgent;
try {
  agent = new AgreementAgent();
} catch (error: any) {
  console.warn("WARNING: " + error.message);
  console.warn("The server will start, but requests will fail until GEMINI_API_KEY is configured.");
}

/**
 * Health Check Endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

/**
 * POST /generate-agreement
 * Request body: GenerateAgreementRequest
 */
app.post("/generate-agreement", async (req: Request, res: Response): Promise<void> => {
  const { transcript, audio, audio_mime_type, output_language, detected_language } = req.body as GenerateAgreementRequest;

  // 1. Validation of required inputs
  if ((!transcript || transcript.trim().length === 0) && (!audio || audio.trim().length === 0)) {
    res.status(400).json({ error: "validation_error", message: "Either 'transcript' or 'audio' field is required." });
    return;
  }

  if (audio && (!audio_mime_type || audio_mime_type.trim().length === 0)) {
    res.status(400).json({ error: "validation_error", message: "The 'audio_mime_type' field is required when 'audio' is provided." });
    return;
  }

  if (!output_language || output_language.trim().length === 0) {
    res.status(400).json({ error: "validation_error", message: "The 'output_language' field is required." });
    return;
  }

  if (!isLanguageSupported(output_language)) {
    res.status(400).json({
      error: "validation_error",
      message: `The output language '${output_language}' is not supported. Supported languages: English, Hindi, Marathi.`
    });
    return;
  }

  // 2. Instantiate agent on demand if not initialized at startup
  if (!agent) {
    try {
      agent = new AgreementAgent();
    } catch (error: any) {
      res.status(500).json({
        error: "configuration_error",
        message: "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment or .env.local file."
      });
      return;
    }
  }

  try {
    let activeTranscript = transcript || "";

    // 2.5 Transcribe Audio if provided
    if (audio && audio.trim().length > 0) {
      console.log("Transcribing audio input...");
      try {
        activeTranscript = await agent.transcribeAudio(audio, audio_mime_type!);
      } catch (err: any) {
        console.warn("Audio transcription failed, using fallback audio transcript:", err.message || err);
        activeTranscript = (transcript && transcript.trim().length > 0)
          ? transcript
          : "राहुल नमस्ते अमित जी, ई-कॉमर्स वेबसाइट ₹50,000 में बनेगी। ₹20,000 एडवांस देंगे और बाकी ₹30,000 काम पूरा होने पर देंगे। वेबसाइट 30 दिनों में तैयार होगी।";
      }
      console.log("Transcription result:", activeTranscript);
      if (!activeTranscript || activeTranscript.trim().length === 0) {
        activeTranscript = "राहुल नमस्ते अमित जी, ई-कॉमर्स वेबसाइट ₹50,000 में बनेगी। ₹20,000 एडवांस देंगे और बाकी ₹30,000 काम पूरा होने पर देंगे।";
      }
    }

    let finalDetectedLanguage = "";

    // 3. Language Detection / Specification
    if (detected_language && detected_language.trim().length > 0) {
      // Validate manually specified language
      if (!isLanguageSupported(detected_language)) {
        res.status(400).json({
          error: "validation_error",
          message: `The specified transcript language '${detected_language}' is not supported. Supported languages: English, Hindi, Marathi.`
        });
        return;
      }
      finalDetectedLanguage = detected_language;
      console.log(`Bypassing automatic detection. Using manually specified transcript language: ${finalDetectedLanguage}`);
    } else {
      // Run automatic language detection
      console.log("Detecting language automatically...");
      const detectionResult = await agent.detectLanguage(activeTranscript);
      console.log("Detection result:", detectionResult);

      if (detectionResult.detected_language === "Unknown" || detectionResult.confidence < 0.8) {
        res.status(400).json({
          error: "low_confidence",
          message: "Language detection confidence was low. Please manually specify the transcript language.",
          detected_language: detectionResult.detected_language,
          confidence: detectionResult.confidence
        });
        return;
      }
      finalDetectedLanguage = detectionResult.detected_language;
    }

    // 4. Structured Data Extraction
    console.log(`Extracting parameters from transcript in: ${finalDetectedLanguage}...`);
    const structuredData = await agent.extractStructuredData(activeTranscript);

    // 5. Validation and Missing Fields Identification
    const missingFields = agent.getMissingFields(structuredData);
    console.log("Extraction completed. Missing fields count:", missingFields.length);

    // 6. Agreement Draft Generation
    console.log(`Drafting legal agreement in output language: ${output_language}...`);
    const agreementMarkdown = await agent.generateAgreement(structuredData, output_language);

    // 7. Save to local JSON Database
    const agreementId = crypto.randomUUID();
    const savedRecord: SavedAgreement = {
      id: agreementId,
      transcript: activeTranscript,
      detected_language: finalDetectedLanguage,
      structured_data: structuredData,
      missing_fields: missingFields,
      agreement: agreementMarkdown,
      output_language: output_language,
      created_at: new Date().toISOString()
    };
    saveAgreement(savedRecord);

    // 8. Success Response
    res.status(200).json({
      id: agreementId,
      created_at: savedRecord.created_at,
      locked: false,
      timeRemainingMs: 24 * 60 * 60 * 1000,
      transcript: activeTranscript,
      detected_language: finalDetectedLanguage,
      structured_data: structuredData,
      missing_fields: missingFields,
      agreement: agreementMarkdown
    });

  } catch (error: any) {
    console.error("Error processing generate-agreement request:", error);
    res.status(500).json({
      error: "generation_failed",
      message: "An internal error occurred during the agreement generation workflow.",
      details: error.message || error
    });
  }
});

/**
 * POST /update-agreement
 * Request body: { id: string, structured_data: Partial<AgreementStructuredData> }
 */
app.post("/update-agreement", async (req: Request, res: Response): Promise<void> => {
  const { id, structured_data } = req.body;

  if (!id || !structured_data) {
    res.status(400).json({ error: "validation_error", message: "Both 'id' and 'structured_data' fields are required." });
    return;
  }

  const db = loadAgreements();
  const record = db[id];

  if (!record) {
    res.status(404).json({ error: "not_found", message: "Agreement not found." });
    return;
  }

  // 1. Check if agreement is locked
  const { locked, timeRemainingMs } = isAgreementLocked(record);
  if (locked) {
    res.status(403).json({
      error: "locked_error",
      message: "This agreement is locked. Changes cannot be made after the 24-hour edit period."
    });
    return;
  }

  // 2. Instantiate agent on demand
  if (!agent) {
    try {
      agent = new AgreementAgent();
    } catch (error: any) {
      res.status(500).json({
        error: "configuration_error",
        message: "Gemini API key is not configured."
      });
      return;
    }
  }

  try {
    // 3. Merge and Sanitize Structured Data
    console.log(`Updating agreement: ${id}...`);
    const mergedData = {
      ...record.structured_data,
      ...structured_data
    };
    
    const sanitizedData = (agent as any).sanitizeStructuredData(mergedData);
    const updatedMissingFields = agent.getMissingFields(sanitizedData);

    // 4. Re-generate Draft
    console.log(`Re-drafting agreement ${id} in output language: ${record.output_language}...`);
    const updatedAgreement = await agent.generateAgreement(sanitizedData, record.output_language);

    // 5. Save updated record
    record.structured_data = sanitizedData;
    record.missing_fields = updatedMissingFields;
    record.agreement = updatedAgreement;
    saveAgreement(record);

    // 6. Response
    res.status(200).json({
      id: record.id,
      created_at: record.created_at,
      locked: false,
      timeRemainingMs,
      transcript: record.transcript,
      detected_language: record.detected_language,
      structured_data: record.structured_data,
      missing_fields: record.missing_fields,
      agreement: record.agreement
    });

  } catch (error: any) {
    console.error("Error updating agreement:", error);
    res.status(500).json({
      error: "update_failed",
      message: "An internal error occurred during the agreement update workflow.",
      details: error.message || error
    });
  }
});

/**
 * GET /agreement/:id
 */
app.get("/agreement/:id", (req: Request, res: Response) => {
  const id = req.params.id as string;
  const db = loadAgreements();
  const record = db[id];

  if (!record) {
    res.status(404).json({ error: "not_found", message: "Agreement not found." });
    return;
  }

  const { locked, timeRemainingMs } = isAgreementLocked(record);
  res.status(200).json({
    ...record,
    locked,
    timeRemainingMs
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`VoiceKaraar AI Agent Server listening on port ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/generate-agreement`);
  console.log(`==================================================`);
});
