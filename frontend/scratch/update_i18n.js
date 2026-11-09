import fs from 'fs';

const enPath = './public/locales/en/translation.json';
const hiPath = './public/locales/hi/translation.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let hiData = {};
try {
  hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
} catch (e) {
  console.log("Could not read hi data, creating new");
}

const footerEn = {
  "description": "AI-powered healthcare platform designed for medical professionals, providing advanced diagnostic support and clinical decision tools.",
  "featuresHeading": "Features",
  "links": {
    "imageAnalysis": "AI Image Analysis",
    "chatAssistant": "Medical Chat Assistant",
    "voiceToText": "Voice-to-Text Transcription",
    "clinicalAnalytics": "Clinical Analytics"
  },
  "contactHeading": "Contact",
  "contact": {
    "address": "123 Medical Center Dr, Boston, MA"
  },
  "trustHeading": "Trust & Security",
  "trust": {
    "hipaa": "HIPAA Compliant",
    "encryption": "End-to-End Encryption",
    "privacy": "Patient Privacy First"
  },
  "bottom": {
    "rights": "© {{year}} HealthCare+. All rights reserved.",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "cookiePolicy": "Cookie Policy"
  }
};

const footerHi = {
  "description": "चिकित्सा पेशेवरों के लिए डिज़ाइन किया गया एआई-संचालित स्वास्थ्य सेवा मंच, उन्नत नैदानिक ​​सहायता और नैदानिक ​​निर्णय उपकरण प्रदान करता है।",
  "featuresHeading": "विशेषताएं",
  "links": {
    "imageAnalysis": "एआई छवि विश्लेषण",
    "chatAssistant": "चिकित्सा चैट सहायक",
    "voiceToText": "आवाज़ से टेक्स्ट ट्रांसक्रिप्शन",
    "clinicalAnalytics": "नैदानिक एनालिटिक्स"
  },
  "contactHeading": "संपर्क करें",
  "contact": {
    "address": "123 मेडिकल सेंटर डॉ, बोस्टन, एमए"
  },
  "trustHeading": "विश्वास और सुरक्षा",
  "trust": {
    "hipaa": "HIPAA अनुपालक",
    "encryption": "एंड-टू-एंड एन्क्रिप्शन",
    "privacy": "रोगी गोपनीयता पहले"
  },
  "bottom": {
    "rights": "© {{year}} हेल्थकेयर+। सर्वाधिकार सुरक्षित।",
    "privacyPolicy": "गोपनीयता नीति",
    "termsOfService": "सेवा की शर्तें",
    "cookiePolicy": "कुकी नीति"
  }
};

enData.footer = footerEn;
hiData.footer = footerHi;

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 2));

console.log("Updated translations");
