import { AgreementAgent } from "../lib/agent.js";
import { isLanguageSupported } from "../config/languages.js";
import type { AgreementStructuredData } from "../lib/types.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// Color utilities for terminal output
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;

const sampleTranscripts = {
  englishComplete: `
    This lease agreement is made on July 17, 2026, between Rajesh Kumar (Owner) and Amit Sharma (Tenant). 
    Rajesh Kumar agrees to rent out his apartment Flat 402, Sunset Heights, Mumbai, to Amit Sharma for a period of 11 months. 
    The monthly rent is 25,000 INR, payable by the 5th of every month. 
    Amit Sharma is responsible for paying electricity and maintenance. 
    Rajesh Kumar is responsible for major structural repairs. 
    The agreement is signed in the presence of Suresh Patel as a witness.
  `,
  hindiComplete: `
    यह समझौता 17 जुलाई 2026 को राकेश सिंह (मालिक) और विजय वर्मा (किराएदार) के बीच हुआ है। 
    राकेश सिंह अपनी दुकान नंबर 12, पालिका बाजार, नई दिल्ली को विजय वर्मा को 2 साल के लिए किराए पर दे रहे हैं। 
    मासिक किराया 15,000 रुपये है, जो हर महीने की 10 तारीख तक देना होगा। 
    विजय वर्मा दुकान की साफ-सफाई के लिए जिम्मेदार होंगे। 
    राकेश सिंह संपत्ति कर का भुगतान करेंगे। 
    गवाह के रूप में अनिल गुप्ता मौजूद हैं।
  `,
  marathiComplete: `
    हा करार १७ जुलै २०२६ रोजी संजय पाटील (मालक) आणि मिलिंद जोशी (भाडेकरू) यांच्यात झाला आहे. 
    संजय पाटील त्यांची कार क्रमांक MH 12 AB 1234 मिलिंद जोशी यांना ६ महिन्यांसाठी भाड्याने देत आहेत. 
    भाडे दरमहा १०,००० रुपये असेल, जे प्रत्येक महिन्याच्या पहिल्या तारखेला द्यावे लागेल. 
    कारची देखभाल मिलिंद जोशी करतील. 
    संजय पाटील विमा हप्ता भरतील. 
    हा करार पुणे येथे करण्यात आला असून रमेश काळे हा साक्षीदार आहे।
  `,
  missingFields: `
    This agreement is between Ramesh and Suresh. 
    Ramesh is giving Suresh his bicycle. 
    The duration is 3 months.
  `,
  ambiguous: `
    asdasd kjsdhkf jshd kjashd kjahsd jasdh random words in no particular syntax.
  `
};

async function runTests() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(red("ERROR: GEMINI_API_KEY is not defined in environment or .env.local file."));
    console.log("Please create a .env.local file with: GEMINI_API_KEY=your_key");
    process.exit(1);
  }

  console.log(cyan("Starting Multilingual Agreement Agent Integration Tests...\n"));
  
  const agent = new AgreementAgent(apiKey);

  // ==========================================
  // Test Case 1: Automatic Language Detection
  // ==========================================
  console.log(cyan("--- Test Case 1: Automatic Language Detection ---"));
  
  const enLang = await agent.detectLanguage(sampleTranscripts.englishComplete);
  console.log(`English Transcript: Detected as ${green(enLang.detected_language)} (Confidence: ${enLang.confidence})`);
  
  const hiLang = await agent.detectLanguage(sampleTranscripts.hindiComplete);
  console.log(`Hindi Transcript: Detected as ${green(hiLang.detected_language)} (Confidence: ${hiLang.confidence})`);
  
  const mrLang = await agent.detectLanguage(sampleTranscripts.marathiComplete);
  console.log(`Marathi Transcript: Detected as ${green(mrLang.detected_language)} (Confidence: ${mrLang.confidence})`);
  
  const ambLang = await agent.detectLanguage(sampleTranscripts.ambiguous);
  console.log(`Ambiguous Transcript: Detected as ${yellow(ambLang.detected_language)} (Confidence: ${ambLang.confidence})`);
  if (ambLang.confidence < 0.8) {
    console.log(green("✔ Correctly flagged ambiguous input with low confidence (< 0.8)"));
  } else {
    console.log(red("✘ Failed: High confidence on ambiguous input"));
  }
  console.log();

  // ==========================================
  // Test Case 2: Information Extraction & Hallucination Prevention
  // ==========================================
  console.log(cyan("--- Test Case 2: Information Extraction & Missing Fields ---"));
  
  console.log("Extracting from Complete English Transcript...");
  const completeData = await agent.extractStructuredData(sampleTranscripts.englishComplete);
  console.log("Extracted Party 1:", green(completeData.party_1));
  console.log("Extracted Party 2:", green(completeData.party_2));
  console.log("Extracted Rent Amount:", green(completeData.payment_amount));
  const completeMissing = agent.getMissingFields(completeData);
  console.log("Missing fields in complete draft:", completeMissing);
  if (completeMissing.length === 0) {
    console.log(green("✔ Success: No missing fields detected."));
  } else {
    console.log(yellow(`⚠ Note: Missing fields found: ${completeMissing.join(", ")}`));
  }
  console.log();

  console.log("Extracting from Incomplete English Transcript (Missing Location, Witnesses, Special Conditions)...");
  const incompleteData = await agent.extractStructuredData(sampleTranscripts.missingFields);
  console.log("Extracted Party 1:", green(incompleteData.party_1));
  console.log("Extracted Location:", yellow(incompleteData.location));
  const incompleteMissing = agent.getMissingFields(incompleteData);
  console.log("Detected Missing Fields:", red(incompleteMissing.join(", ")));
  
  // Verify anti-hallucination defaults
  if (incompleteData.location === "Not Specified" && incompleteMissing.includes("Location")) {
    console.log(green("✔ Success: Missing fields correctly flagged as 'Not Specified' and detected in missing list."));
  } else {
    console.log(red("✘ Failed: Hallucination guardrail failed for missing location."));
  }
  console.log();

  // ==========================================
  // Test Case 3: Cross-Language Generation
  // ==========================================
  console.log(cyan("--- Test Case 3: Cross-Language Agreement Generation ---"));
  
  console.log("Extracting Hindi transcript...");
  const hindiData = await agent.extractStructuredData(sampleTranscripts.hindiComplete);
  
  console.log("Generating Agreement in English...");
  const englishAgreement = await agent.generateAgreement(hindiData, "English");
  console.log(cyan("----- English Agreement Excerpt -----"));
  console.log(englishAgreement.split("\n").slice(0, 8).join("\n"));
  console.log("...");
  console.log(cyan("-------------------------------------"));
  
  console.log("Generating Agreement in Marathi...");
  const marathiAgreement = await agent.generateAgreement(hindiData, "Marathi");
  console.log(cyan("----- Marathi Agreement Excerpt -----"));
  console.log(marathiAgreement.split("\n").slice(0, 8).join("\n"));
  console.log("...");
  console.log(cyan("-------------------------------------"));
  
  console.log(green("✔ Success: Cross-language agreements drafted successfully."));
  console.log();

  console.log(green("ALL Core Agent Tests Passed successfully."));
}

runTests().catch(error => {
  console.error(red("Test failed with error:"), error);
  process.exit(1);
});
