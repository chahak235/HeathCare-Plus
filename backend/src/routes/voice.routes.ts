import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const router = Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'voice-analysis',
    timestamp: new Date().toISOString(),
  });
});

router.post(
  '/analyze',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const tempFilePath = (req.file && req.file.path) || null;

    if (!tempFilePath) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const apiKey = process.env.HUME_API_KEY;
    if (!apiKey) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      res.status(500).json({
        error: 'Hume API key not configured',
        details: 'Set HUME_API_KEY in your backend environment variables.',
      });
      return;
    }

    try {
      const stats = fs.statSync(tempFilePath);
      if (stats.size === 0) {
        throw new Error('Uploaded file is empty');
      }

      let requestMeta: { patient_id?: string; session_id?: string } | null = null;
      if (typeof req.body.request === 'string') {
        try {
          requestMeta = JSON.parse(req.body.request);
        } catch {
          requestMeta = null;
        }
      }

      // 1 — Send audio to Hume AI
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath), req.file?.originalname || 'audio.wav');

      const jobResponse = await axios.post(
        'https://api.hume.ai/v0/batch/jobs',
        formData,
        {
          headers: {
            'X-Hume-Api-Key': apiKey,
            ...formData.getHeaders(),
          },
          params: { models: 'prosody' },
          timeout: 15000,
        },
      );

      const jobData = jobResponse.data as { job_id: string };
      const jobId = jobData.job_id;

      // 2 — Poll until job is complete
      let predictions: any = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts && !predictions) {
        attempts += 1;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          const statusRes = await axios.get(
            `https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`,
            {
              headers: { 'X-Hume-Api-Key': apiKey },
              timeout: 10000,
            },
          );

          if (Array.isArray(statusRes.data) && statusRes.data.length > 0) {
            predictions = statusRes.data;
          }
        } catch {
          // Job likely still processing – keep polling
          continue;
        }
      }

      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      if (!predictions) {
        res.status(504).json({
          error: 'Hume AI analysis timed out. Please try again.',
        });
        return;
      }

      // 3 — Extract emotions
      const emotionsRaw =
        predictions[0]?.results?.predictions[0]?.models?.prosody
          ?.grouped_predictions[0]?.predictions[0]?.emotions || [];

      const relevantEmotions = [
        'Distress', 'Tiredness', 'Calmness', 'Anxiety', 'Sadness',
        'Excitement', 'Contentment', 'Anger', 'Fear', 'Joy',
        'Boredom', 'Loneliness', 'Happiness', 'Stress',
      ];

      let filtered = emotionsRaw
        .filter((e: any) => relevantEmotions.includes(e.name))
        .sort((a: any, b: any) => b.score - a.score)
        .map((e: any) => ({
          emotion: e.name as string,
          score: Math.round((e.score as number) * 100),
        }))
        .slice(0, 6);

      if (filtered.length === 0) {
        filtered = emotionsRaw
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 6)
          .map((e: any) => ({
            emotion: e.name as string,
            score: Math.round((e.score as number) * 100),
          }));
      }

      // 4 — Determine overall mental state
      const topEmotion = filtered[0]?.emotion || 'Neutral';
      let mentalState = 'Stable';

      const stressEmotions = ['Distress', 'Anxiety', 'Anger', 'Fear', 'Stress'];
      const lowEmotions = ['Sadness', 'Tiredness', 'Boredom', 'Loneliness'];
      const positiveEmotions = ['Calmness', 'Contentment', 'Excitement', 'Joy', 'Happiness'];

      if (stressEmotions.includes(topEmotion)) mentalState = 'High Stress Detected';
      else if (lowEmotions.includes(topEmotion)) mentalState = 'Low / Depressive Indicators';
      else if (positiveEmotions.includes(topEmotion)) mentalState = 'Uplifted / Positive';

      res.json({
        mental_state: mentalState,
        mentalState,
        emotions: filtered,
        warning:
          filtered.length < 3
            ? 'Limited emotional data detected. For best results, speak clearly for at least 5-8 seconds.'
            : null,
        patient_id: requestMeta?.patient_id ?? 'anonymous',
        session_id: requestMeta?.session_id ?? null,
      });
    } catch (error: any) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      const status = error?.response?.status || 500;
      const detail =
        error?.response?.data ||
        error?.message ||
        'Unknown error while calling Hume AI.';

      res.status(status).json({
        error: 'Voice analysis failed',
        details: detail,
      });
    }
  },
);

export default router;
