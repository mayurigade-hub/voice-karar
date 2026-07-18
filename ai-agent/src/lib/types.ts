export interface AgreementResponsibilities {
  party_1: string[];
  party_2: string[];
}

export interface AgreementStructuredData {
  party_1: string;
  party_2: string;
  agreement_purpose: string;
  payment_amount: string;
  payment_terms: string;
  agreement_duration: string;
  responsibilities: AgreementResponsibilities;
  important_dates: string[];
  witnesses: string[];
  special_conditions: string[];
  location: string;
}

export interface GenerateAgreementRequest {
  transcript?: string;
  audio?: string; // base64 encoded audio
  audio_mime_type?: string; // e.g. audio/webm, audio/mp3, audio/wav
  output_language: string;
}

export interface GenerateAgreementResponse {
  transcript?: string; // returned if transcribed from audio
  detected_language: string;
  structured_data: AgreementStructuredData;
  missing_fields: string[];
  agreement: string;
}

export interface LanguageDetectionResult {
  detected_language: string;
  confidence: number;
}
