export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  locale: string;
  legalStyleInstruction: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: "English",
    name: "English",
    nativeName: "English",
    locale: "en-US",
    legalStyleInstruction: "Use professional English legal agreement draft standards (Preamble, Recitals, Terms and Conditions, Signatures)."
  },
  {
    code: "Hindi",
    name: "Hindi",
    nativeName: "हिन्दी",
    locale: "hi-IN",
    legalStyleInstruction: "Use traditional and formal legal Hindi terminology (e.g., 'करारनामा', 'प्रथम पक्ष', 'द्वितीय पक्ष', 'गवाह'). Use standard Devanagari script."
  },
  {
    code: "Marathi",
    name: "Marathi",
    nativeName: "मराठी",
    locale: "mr-IN",
    legalStyleInstruction: "Use formal and traditional legal Marathi terminology (e.g., 'करारनामा', 'पक्षकार क्रमांक १', 'पक्षकार क्रमांक २', 'साक्षीदार'). Use standard Devanagari script."
  },
  {
    code: "Bengali",
    name: "Bengali",
    nativeName: "বাংলা",
    locale: "bn-IN",
    legalStyleInstruction: "Use formal and traditional legal Bengali terminology (e.g., 'চুক্তিপত্র', 'প্রথম পক্ষ', 'দ্বিতীয় পক্ষ', 'সাক্ষী')."
  },
  {
    code: "Tamil",
    name: "Tamil",
    nativeName: "தமிழ்",
    locale: "ta-IN",
    legalStyleInstruction: "Use formal and traditional legal Tamil terminology (e.g., 'வாடகை ஒப்பந்தம்', 'முதல் தரப்பினர்', 'இரண்டாம் தரப்பினர்', 'சாட்சிகள்')."
  },
  {
    code: "Telugu",
    name: "Telugu",
    nativeName: "తెలుగు",
    locale: "te-IN",
    legalStyleInstruction: "Use formal and traditional legal Telugu terminology (e.g., 'అద్దె ఒప్పందం', 'మొదటి పక్షము', 'రెండव పక్షము', 'సాక్షులు')."
  },
  {
    code: "Gujarati",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    locale: "gu-IN",
    legalStyleInstruction: "Use formal and traditional legal Gujarati terminology (e.g., 'ભાડા કરાર', 'પ્રથમ પક્ષકાર', 'દ્વિતીય પક્ષકાર', 'સાક્ષી')."
  },
  {
    code: "Kannada",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    locale: "kn-IN",
    legalStyleInstruction: "Use formal and traditional legal Kannada terminology (e.g., 'ಬಾಡಿಗೆ ಕರಾರು ಪತ್ರ', 'ಪ್ರಥಮ ಪಕ್ಷ', 'ದ್ವಿತೀಯ ಪಕ್ಷ', 'ಸಾಕ್ಷಿಗಳು')."
  }
];

export function getLanguageByCode(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(
    (lang) => lang.code.toLowerCase() === code.toLowerCase()
  );
}

export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(
    (lang) => lang.code.toLowerCase() === code.toLowerCase()
  );
}
