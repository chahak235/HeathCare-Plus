import { Router, Request, Response } from 'express';
import multer from 'multer';
import { groqService } from '../services/groq.service';

const router = Router();

// Audio stays in memory and is discarded after the request
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // Groq free-tier limit
});

const EXT: Record<string, string> = {
  'audio/webm': 'webm', 'video/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a', 'audio/flac': 'flac', 'video/mp4': 'mp4',
};

// Crisis wording is checked directly so it never depends on the AI noticing it
const CRISIS_PATTERNS = [
  /\b(kill|hurt|harm)\s+(myself|me)\b/i, /\bsuicid/i, /\bend\s+(my|it)\s+(life|all)\b/i,
  /\bwant\s+to\s+die\b/i, /\bno\s+reason\s+to\s+live\b/i, /\bbetter\s+off\s+dead\b/i,
];

const CRISIS_RESOURCES = [
  { name: 'Tele-MANAS (Govt. of India, 24x7, free)', phone: '14416' },
  { name: 'Tele-MANAS alternate', phone: '1-800-891-4416' },
  { name: 'Emergency services', phone: '112' },
];

const SYSTEM_PROMPT = `You are a careful mental-wellbeing screening assistant for HealthCare+, used in India.
You receive (1) a transcript of a short voice recording and (2) acoustic measurements of how the person spoke.
You are NOT a clinician and must not diagnose. Describe patterns and how strongly they appear.

How to read the acoustic measurements (typical adult conversational speech):
- pauseRatio 0.2-0.4 is normal; above 0.5 with long pauses can go with low energy or low mood.
- pitchVariationSemitones below ~2 suggests flat, monotone delivery; above ~5 suggests animated or tense speech.
- loudnessVariationDb below ~4 suggests flat delivery.
- speechBurstsPerMin is a rough speaking-rate proxy; very high with short pauses can go with stress or anxiety.
- These cues are weak on their own, vary by person, microphone and language. Weigh the transcript more, and say when evidence is limited.

Return ONLY a JSON object with exactly this shape:
{
  "overallState": "short label, e.g. 'Calm and steady', 'Some signs of stress', 'Possible low mood', 'Not enough speech to assess'",
  "summary": "2-3 plain-language sentences addressed to the person ('you')",
  "scores": { "stress": 0-100, "anxiety": 0-100, "lowMood": 0-100, "energy": 0-100, "calm": 0-100 },
  "emotions": [ { "emotion": "single word", "score": 0-100 } ],
  "voiceObservations": [ "short observation linking a measurement to what it may suggest" ],
  "suggestions": [ "short practical, kind suggestion" ],
  "seekHelp": true or false,
  "seekHelpReason": "why, or empty string"
}
List 3-6 emotions, 2-4 voice observations and 3-5 suggestions. Set seekHelp true for strong distress, hopelessness, or any mention of self-harm.`;

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'voice-analysis', aiConfigured: groqService.isConfigured() });
});

router.post('/analyze', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file || file.size === 0) {
    res.status(400).json({ error: 'No audio file provided' });
    return;
  }
  if (!groqService.isConfigured()) {
    res.status(503).json({ error: 'Voice analysis is not configured on the server (missing GROQ_API_KEY).' });
    return;
  }

  let features: Record<string, unknown> | null = null;
  if (typeof req.body.features === 'string') {
    try {
      features = JSON.parse(req.body.features);
    } catch {
      features = null;
    }
  }

  try {
    const mime = (file.mimetype || 'audio/webm').split(';')[0];
    const ext = EXT[mime] || (file.originalname.split('.').pop() ?? 'webm');
    const { text: transcript, language } = await groqService.transcribe(file.buffer, `voice.${ext}`, mime);

    const crisis = CRISIS_PATTERNS.some((p) => p.test(transcript));

    if (transcript.split(/\s+/).filter(Boolean).length < 5) {
      res.json({
        transcript,
        language,
        features,
        report: {
          overallState: 'Not enough speech to assess',
          summary: 'We could not hear enough words to analyse. Please record 20 to 60 seconds talking about how your day or week has been.',
          scores: null,
          emotions: [],
          voiceObservations: [],
          suggestions: ['Find a quiet place', 'Speak naturally for at least 20 seconds'],
          seekHelp: crisis,
          seekHelpReason: crisis ? 'Your words mentioned harming yourself.' : '',
        },
        crisisResources: crisis ? CRISIS_RESOURCES : [],
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    const report = await groqService.completeJson<any>(
      SYSTEM_PROMPT,
      `Transcript (language: ${language || 'unknown'}):\n"""${transcript.slice(0, 6000)}"""\n\nAcoustic measurements:\n${JSON.stringify(features ?? 'not available')}`
    );

    if (crisis) {
      report.seekHelp = true;
      report.seekHelpReason = report.seekHelpReason || 'Your words mentioned harming yourself.';
    }

    res.json({
      transcript,
      language,
      features,
      report,
      crisisResources: report.seekHelp ? CRISIS_RESOURCES : [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Voice analysis failed:', error?.message || error);
    res.status(502).json({ error: 'Voice analysis failed. Please try again in a moment.' });
  }
});

export default router;
