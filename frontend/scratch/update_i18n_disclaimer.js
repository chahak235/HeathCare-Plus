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

const disclaimerEn = {
  "criticalTitle": "Emergency Medical Notice",
  "criticalDesc": "This is an AI-powered decision support tool only. For medical emergencies, call emergency services immediately. Always consult with qualified healthcare professionals for diagnosis and treatment.",
  "defaultTitle": "Medical Disclaimer",
  "defaultDesc": "This AI tool provides decision support only, not medical diagnosis. Always consult with healthcare professionals for medical decisions."
};

const disclaimerHi = {
  "criticalTitle": "आपातकालीन चिकित्सा सूचना",
  "criticalDesc": "यह केवल एक एआई-संचालित निर्णय समर्थन उपकरण है। चिकित्सा आपात स्थिति के लिए, तुरंत आपातकालीन सेवाओं को कॉल करें। निदान और उपचार के लिए हमेशा योग्य स्वास्थ्य देखभाल पेशेवरों से परामर्श लें।",
  "defaultTitle": "चिकित्सा अस्वीकरण",
  "defaultDesc": "यह एआई उपकरण केवल निर्णय समर्थन प्रदान करता है, चिकित्सा निदान नहीं। चिकित्सा निर्णयों के लिए हमेशा स्वास्थ्य देखभाल पेशेवरों से परामर्श करें।"
};

enData.medicalDisclaimer = disclaimerEn;
hiData.medicalDisclaimer = disclaimerHi;

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(hiPath, JSON.stringify(hiData, null, 2));

console.log("Updated disclaimer translations");
