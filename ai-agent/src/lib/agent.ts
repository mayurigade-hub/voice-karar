import { GoogleGenerativeAI } from "@google/generative-ai";
import { DETECTION_PROMPT, EXTRACTION_PROMPT, GENERATION_PROMPT } from "./prompts.js";
import type { AgreementStructuredData, LanguageDetectionResult } from "./types.js";
import { getLanguageByCode, isLanguageSupported } from "../config/languages.js";

export class AgreementAgent {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite") {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your environment or .env.local file.");
    }
    this.genAI = new GoogleGenerativeAI(key);
    if (!modelName || modelName === "gemini-1.5-flash" || modelName === "gemini-2.5-flash") {
      this.modelName = "gemini-2.0-flash-lite";
    } else {
      this.modelName = modelName;
    }
  }

  /**
   * Helper to execute prompt and return parsed JSON
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status;
      const details = JSON.stringify(error?.errorDetails || []);
      const errMsg = String(error?.message || "");
      const isInvalidApiKey =
        status === 400 &&
        (details.includes("API_KEY_INVALID") || errMsg.includes("API key not valid"));

      const is404Or429 = status === 404 || status === 429 || errMsg.includes("404") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("not found") || errMsg.includes("not supported");

      if (isInvalidApiKey || is404Or429) {
        throw error;
      }

      if (retries > 0) {
        console.warn(`[Agent Retry] Gemini API call failed: ${error.message || error}. Retrying in ${delayMs / 1000}s... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.withRetry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private async executeWithModelFallback<T>(
    systemInstruction: string,
    executeFn: (model: any) => Promise<T>
  ): Promise<T> {
    const candidateModels = [
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.0-flash-exp",
      "gemini-1.5-pro",
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    let lastError: any = null;
    for (const m of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel(
          { model: m, systemInstruction },
          { timeout: 45000 }
        );
        return await this.withRetry(() => executeFn(model));
      } catch (err: any) {
        const errMsg = String(err?.message || "");
        if (errMsg.includes("404") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("not found") || errMsg.includes("not supported")) {
          console.warn(`[Agent Model Fallback] Model ${m} failed (${errMsg.slice(0, 100)}), trying next candidate...`);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error("All Gemini model candidates failed.");
  }

  private async generateJson<T>(systemInstruction: string, promptContent: string): Promise<T> {
    return this.executeWithModelFallback<T>(systemInstruction, async (model) => {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptContent }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
      const text = result.response.text();
      try {
        return JSON.parse(text) as T;
      } catch (error) {
        console.error("Failed to parse Gemini JSON response:", text);
        throw new Error("Invalid response format received from AI model.");
      }
    });
  }

  /**
   * Detects the language of the transcript
   */
  async detectLanguage(transcript: string): Promise<LanguageDetectionResult> {
    if (!transcript || transcript.trim().length === 0) {
      return { detected_language: "Unknown", confidence: 0.0 };
    }

    try {
      const result = await this.generateJson<LanguageDetectionResult>(
        DETECTION_PROMPT,
        transcript
      );
      
      // Normalize language name to Title Case
      if (result.detected_language) {
        result.detected_language = result.detected_language.charAt(0).toUpperCase() + result.detected_language.slice(1).toLowerCase();
      }

      return result;
    } catch (error) {
      console.error("Language detection error:", error);
      return { detected_language: "Unknown", confidence: 0.0 };
    }
  }

  /**
   * Extracts structured JSON from the transcript
   */
  async extractStructuredData(transcript: string): Promise<AgreementStructuredData> {
    try {
      const result = await this.generateJson<AgreementStructuredData>(
        EXTRACTION_PROMPT,
        transcript
      );

      // Post-process response lists and objects to ensure stability
      return this.sanitizeStructuredData(result);
    } catch (error) {
      console.error("Structured data extraction error:", error);
      throw error;
    }
  }

  /**
   * Generates a legal contract draft from the structured data in a specific language
   */
  async generateAgreement(data: AgreementStructuredData, outputLanguage: string): Promise<string> {
    const langConfig = getLanguageByCode(outputLanguage);
    if (!langConfig) {
      throw new Error(`Output language '${outputLanguage}' is not supported.`);
    }

    const systemInstruction = GENERATION_PROMPT
      .replace(/{output_language}/g, langConfig.name)
      .replace(/{legal_style_instruction}/g, langConfig.legalStyleInstruction);

    const dataString = JSON.stringify(data, null, 2);

    return this.executeWithModelFallback<string>(systemInstruction, async (model) => {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: dataString }] }],
        generationConfig: {
          temperature: 0.3,
        },
      });
      return result.response.text();
    });
  }

  /**
   * Extracts the list of missing essential fields from the structured JSON.
   * Only core fields (parties, purpose, payment) trigger follow-up questions.
   */
  getMissingFields(data: AgreementStructuredData): string[] {
    const missing: string[] = [];

    const isNotSpecified = (val: string | undefined | null) => 
      !val || val.trim().toLowerCase() === "not specified";

    if (isNotSpecified(data.party_1)) missing.push("Party 1");
    if (isNotSpecified(data.party_2)) missing.push("Party 2");
    if (isNotSpecified(data.agreement_purpose)) missing.push("Agreement Purpose");

    // Consider payment specified if any pricing field is present
    const hasPayment = !isNotSpecified(data.payment_amount) || 
                       !isNotSpecified(data.total_amount) || 
                       !isNotSpecified(data.unit_price);
    if (!hasPayment) missing.push("Payment Amount");

    return missing;
  }

  /**
   * Helper to ensure all JSON fields exist and have proper defaults
   */
  private sanitizeStructuredData(data: Partial<AgreementStructuredData>): AgreementStructuredData {
    const isNotSpecified = (val: string | undefined | null) => 
      !val || val.trim().toLowerCase() === "not specified" ? "Not Specified" : val;

    return {
      party_1: isNotSpecified(data.party_1),
      party_2: isNotSpecified(data.party_2),
      agreement_purpose: isNotSpecified(data.agreement_purpose),
      quantity: isNotSpecified(data.quantity),
      unit_price: isNotSpecified(data.unit_price),
      total_amount: isNotSpecified(data.total_amount),
      payment_amount: isNotSpecified(data.payment_amount),
      payment_terms: isNotSpecified(data.payment_terms),
      agreement_duration: isNotSpecified(data.agreement_duration),
      responsibilities: {
        party_1: Array.isArray(data.responsibilities?.party_1) ? data.responsibilities.party_1 : [],
        party_2: Array.isArray(data.responsibilities?.party_2) ? data.responsibilities.party_2 : [],
      },
      important_dates: Array.isArray(data.important_dates) ? data.important_dates.map(d => isNotSpecified(d)) : ["Not Specified"],
      witnesses: Array.isArray(data.witnesses) ? data.witnesses.map(w => isNotSpecified(w)) : ["Not Specified"],
      special_conditions: Array.isArray(data.special_conditions) ? data.special_conditions.map(s => isNotSpecified(s)) : ["Not Specified"],
      location: isNotSpecified(data.location),
      delivery_location: isNotSpecified(data.delivery_location),
      summary: isNotSpecified(data.summary),
    };
  }

  /**
   * Transcribes audio using Gemini's multimodal audio understanding capability
   */
  async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    const raw = (String(mimeType || "audio/webm").split(";")[0] || "audio/webm").trim().toLowerCase();
    let cleanMime = raw;
    if (raw.includes("m4a") || raw.includes("mp4")) cleanMime = "audio/mp4";
    else if (raw.includes("wav") || raw.includes("wave")) cleanMime = "audio/wav";
    else if (raw.includes("mp3") || raw.includes("mpeg")) cleanMime = "audio/mp3";
    else if (raw.includes("ogg")) cleanMime = "audio/ogg";
    else if (raw.includes("aac")) cleanMime = "audio/aac";
    else if (raw.includes("flac")) cleanMime = "audio/flac";

    const systemInstruction = "You are an expert audio transcriber. Listen to the audio recording and write down the exact spoken words in the language they are spoken. Return only the transcription text. Do not add any summary, notes, or explanation.";

    return this.executeWithModelFallback<string>(systemInstruction, async (model) => {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: audioBase64,
                  mimeType: cleanMime
                }
              },
              { text: "Please transcribe this audio." }
            ]
          }
        ]
      });
      return result.response.text().trim();
    });
  }
}
