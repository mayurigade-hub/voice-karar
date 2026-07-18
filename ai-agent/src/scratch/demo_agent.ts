import { AgreementAgent } from "../lib/agent.js";
import type { AgreementStructuredData } from "../lib/types.js";
import dotenv from "dotenv";

dotenv.config();

const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

const delay = async (ms: number) => {
  console.log(yellow(`[Rate Limiter] Pausing for ${ms/1000} seconds to respect Gemini Free Tier 5 RPM limit...`));
  return new Promise(resolve => setTimeout(resolve, ms));
};

const sampleHindiTranscript = `
यह समझौता 17 जुलाई 2026 को राकेश सिंह (मालिक) और विजय वर्मा (किराएदार) के बीच हुआ है। 
राकेश सिंह अपनी दुकान नंबर 12, पालिका बाजार, नई दिल्ली को विजय वर्मा को 2 साल के लिए किराए पर दे रहे हैं। 
मासिक किराया 15,000 रुपये है, जो हर महीने की 10 तारीख तक देना होगा। 
विजय वर्मा दुकान की साफ-सफाई के लिए जिम्मेदार होंगे। 
राकेश सिंह संपत्ति कर का भुगतान करेंगे। 
गवाह के रूप में अनिल गुप्ता मौजूद हैं।
`;

async function runDemo() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`\x1b[31mERROR: GEMINI_API_KEY is not defined in your environment or .env file.\x1b[0m`);
    process.exit(1);
  }

  const agent = new AgreementAgent(apiKey);

  console.log(cyan("================================================================"));
  console.log(bold(cyan("          VOICEKARAAR MULTILINGUAL AI AGENT DEMO               ")));
  console.log(cyan("================================================================"));
  console.log(bold("\nSource Transcript (Hindi):"));
  console.log(sampleHindiTranscript.trim());
  console.log(cyan("----------------------------------------------------------------"));

  // 1. Language Detection
  console.log(bold("\nStep 1: Detecting Transcript Language..."));
  const detection = await agent.detectLanguage(sampleHindiTranscript);
  console.log(`Detected Language: ${green(detection.detected_language)}`);
  console.log(`Confidence Score: ${green(detection.confidence.toString())}`);

  // Wait to avoid rate limits
  await delay(13000);

  // 2. Structured Information Extraction
  console.log(bold("\nStep 2: Extracting Structured JSON Data (No Hallucinations)..."));
  const structuredData = await agent.extractStructuredData(sampleHindiTranscript);
  console.log(green(JSON.stringify(structuredData, null, 2)));

  // 3. Validation & Missing Fields Check
  console.log(bold("\nStep 3: Checking for Missing Fields..."));
  const missing = agent.getMissingFields(structuredData);
  if (missing.length > 0) {
    console.log(yellow(`Missing parameters identified: ${missing.join(", ")}`));
    console.log(yellow("Note: These fields will be marked as 'Not Specified' in the contract."));
  } else {
    console.log(green("All 11 required parameters are present in the transcript."));
  }

  // Wait to avoid rate limits
  await delay(13000);

  // 4. English Agreement Generation
  console.log(bold("\nStep 4: Generating Formal Legal Agreement in English..."));
  const englishContract = await agent.generateAgreement(structuredData, "English");
  console.log(cyan("------------------- GENERATED ENGLISH AGREEMENT -------------------"));
  console.log(englishContract.trim());
  console.log(cyan("-------------------------------------------------------------------"));

  // Wait to avoid rate limits
  await delay(13000);

  // 5. Marathi Agreement Generation (Cross-translation from Hindi structured JSON source)
  console.log(bold("\nStep 5: Generating Formal Legal Agreement in Marathi..."));
  const marathiContract = await agent.generateAgreement(structuredData, "Marathi");
  console.log(cyan("------------------- GENERATED MARATHI AGREEMENT -------------------"));
  console.log(marathiContract.trim());
  console.log(cyan("-------------------------------------------------------------------"));

  console.log(bold(green("\n✔ Demo completed successfully!")));
}

runDemo().catch(err => {
  console.error("\x1b[31mDemo failed:\x1b[0m", err);
});
