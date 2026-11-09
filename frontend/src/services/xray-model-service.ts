import * as ort from 'onnxruntime-web';
import { AnalysisResult, Finding, Recommendation, ModelInfo } from '../types/medical-images';

// Pneumonia classifier (EfficientNet-B0, binary). Runs entirely in the browser,
// so X-ray images never leave the user's device.
const MODEL_URL = '/models/xray_pneumonia.onnx';
const CARD_URL = '/models/xray_pneumonia.card.json';
const ORT_VERSION = '1.31.1';
const IMG_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

interface ModelCard {
  threshold: number;
  class_names: string[];
  metrics: { test_accuracy_pct: number; test_sensitivity_pct: number; test_specificity_pct: number };
}

ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

export const XRAY_MODEL_INFO: ModelInfo = {
  id: 'xray-pneumonia-effnet-b0',
  name: 'Pneumonia X-ray Model (EfficientNet-B0)',
  description: 'Detects signs of pneumonia on chest X-rays. Runs on your device.',
  accuracy: 88.5,
  inputSize: '224x224',
  specialty: ['xray'],
  version: '3.0',
};

class XrayModelService {
  private session: Promise<ort.InferenceSession> | null = null;
  private card: Promise<ModelCard> | null = null;

  /** Start downloading the model early (about 15 MB, cached by the browser). */
  preload(): void {
    this.getSession().catch(() => undefined);
  }

  private getSession(): Promise<ort.InferenceSession> {
    if (!this.session) {
      this.session = ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] }).catch((e) => {
        this.session = null;
        throw e;
      });
    }
    return this.session;
  }

  private getCard(): Promise<ModelCard> {
    if (!this.card) {
      this.card = fetch(CARD_URL).then((r) => {
        if (!r.ok) throw new Error('Could not load model card');
        return r.json();
      });
    }
    return this.card;
  }

  private async toTensor(file: File): Promise<ort.Tensor> {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = IMG_SIZE;
    canvas.height = IMG_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, IMG_SIZE, IMG_SIZE);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
    const plane = IMG_SIZE * IMG_SIZE;
    const chw = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      for (let c = 0; c < 3; c++) {
        chw[c * plane + i] = (data[i * 4 + c] / 255 - MEAN[c]) / STD[c];
      }
    }
    return new ort.Tensor('float32', chw, [1, 3, IMG_SIZE, IMG_SIZE]);
  }

  async analyze(file: File): Promise<AnalysisResult> {
    const start = Date.now();
    const [session, card, input] = await Promise.all([this.getSession(), this.getCard(), this.toTensor(file)]);
    const output = await session.run({ input });
    const logit = (output.logit.data as Float32Array)[0];
    const prob = 1 / (1 + Math.exp(-logit));

    const pneumonia = prob >= card.threshold;
    const confidence = pneumonia ? prob : 1 - prob;
    const m = card.metrics;

    const findings: Finding[] = [
      {
        name: pneumonia ? 'Signs consistent with pneumonia' : 'No signs of pneumonia detected',
        confidence,
        description: pneumonia
          ? 'The model found patterns in this chest X-ray that are commonly seen with pneumonia.'
          : 'The model did not find patterns commonly seen with pneumonia in this chest X-ray.',
        severity: pneumonia ? 'high' : 'low',
      },
      {
        name: 'Pneumonia probability',
        confidence: prob,
        description: `Model score ${(prob * 100).toFixed(1)}%. Results at or above ${(card.threshold * 100).toFixed(1)}% are flagged as pneumonia.`,
        severity: pneumonia ? 'high' : prob > card.threshold * 0.8 ? 'medium' : 'low',
      },
    ];

    const recommendations: Recommendation[] = [
      pneumonia
        ? {
            type: 'urgent',
            title: 'See a doctor soon',
            description: 'Show this X-ray to a doctor. Seek urgent care for breathing difficulty, chest pain, high fever or bluish lips.',
            timeframe: 'Within 24 hours',
          }
        : {
            type: 'follow-up',
            title: 'Follow up if symptoms continue',
            description: 'A normal result does not rule out illness. See a doctor if cough, fever or breathlessness persist.',
          },
      {
        type: 'standard',
        title: 'Screening tool, not a diagnosis',
        description: `This model was tested at ${m.test_accuracy_pct}% accuracy (sensitivity ${m.test_sensitivity_pct}%, specificity ${m.test_specificity_pct}%). It only checks for pneumonia and is meant for chest X-rays. A radiologist must confirm any result.`,
      },
    ];

    return {
      id: `xray-${Date.now()}`,
      timestamp: new Date().toISOString(),
      aiModel: XRAY_MODEL_INFO.name,
      confidence,
      severity: pneumonia ? 'high' : 'low',
      findings,
      recommendations,
      disclaimer: 'Educational screening only. Not a clinical diagnostic tool. Analysed on your device; the image was not uploaded.',
      imageType: 'xray',
      processingTime: Date.now() - start,
    };
  }
}

export const xrayModelService = new XrayModelService();
