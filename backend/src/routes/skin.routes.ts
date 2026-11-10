import { Router, Request, Response } from 'express';
import multer from 'multer';

/**
 * Skin condition analysis. The model (ConvNeXt-XL, ~700 MB) is too large for
 * the browser or Render's free plan, so it runs as its own service
 * (`skin-model-service/`, e.g. a free Hugging Face Space). This route forwards
 * the image there and returns the top results with plain-language guidance.
 *
 * Env: SKIN_MODEL_URL (service base URL), SKIN_SERVICE_KEY (optional shared secret).
 */
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Conditions where a dermatologist should see the skin soon
const SEE_SOON = new Set(['Melanoma', 'Basal_Cell_Carcinoma', 'SkinCancer_Other', 'Actinic_Keratosis', 'Bullous', 'Vasculitis', 'Lupus', 'DrugEruption']);

const serviceUrl = () => (process.env.SKIN_MODEL_URL || '').replace(/\/+$/, '');

router.get('/status', async (_req: Request, res: Response) => {
  const base = serviceUrl();
  if (!base) return res.json({ success: true, available: false, reason: 'not_configured' });
  try {
    const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) });
    const info = await r.json().catch(() => ({}));
    return res.json({ success: true, available: r.ok, info });
  } catch {
    // A sleeping free Space wakes on the first real request
    return res.json({ success: true, available: false, reason: 'starting' });
  }
});

router.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  const base = serviceUrl();
  if (!base) {
    return res.status(503).json({ success: false, error: 'Skin analysis is not switched on yet.' });
  }
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'Please choose a photo.' });
  if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
    return res.status(400).json({ success: false, error: 'Please upload a JPG, PNG or WebP photo.' });
  }

  try {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname || 'skin.jpg');
    const headers: Record<string, string> = {};
    if (process.env.SKIN_SERVICE_KEY) headers['X-Api-Key'] = process.env.SKIN_SERVICE_KEY;

    // Generous timeout: a free Space that was asleep needs time to load the model
    const r = await fetch(`${base}/predict`, { method: 'POST', body: form, headers, signal: AbortSignal.timeout(120_000) });
    const data: any = await r.json().catch(() => null);
    if (!r.ok || !data?.predictions) {
      return res.status(502).json({ success: false, error: data?.detail || 'The skin model could not analyse this photo.' });
    }

    const predictions = (data.predictions as any[]).map((p) => ({
      condition: p.class as string,
      label: p.label as string,
      probability: Number(p.probability),
      seeDoctorSoon: SEE_SOON.has(p.class),
    }));
    const top = predictions[0];
    // Flag if any likely result (>= 15%) is one a dermatologist should check soon
    const urgent = predictions.some((p) => p.seeDoctorSoon && p.probability >= 0.15);

    return res.json({
      success: true,
      data: {
        predictions,
        top,
        urgent,
        model: data.model,
        top1Accuracy: data.top1_acc,
        top3Accuracy: data.top3_acc,
        processingMs: data.processing_ms,
      },
    });
  } catch (err: any) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({
      success: false,
      error: timedOut ? 'The skin model is waking up. Please try again in a minute.' : 'The skin model is not reachable right now.',
    });
  }
});

export default router;
