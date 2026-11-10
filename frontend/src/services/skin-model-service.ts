import axios from 'axios';
import { AnalysisResult, Finding, Recommendation, ModelInfo } from '../types/medical-images';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const SKIN_MODEL_INFO: ModelInfo = {
  id: 'skin-convnext-xl-23',
  name: 'Skin Condition Model (ConvNeXt-XL)',
  description: 'Suggests the most likely of 23 skin conditions from a close-up photo.',
  accuracy: 80.65,
  inputSize: '384x384',
  specialty: ['skin'],
  version: '1.0',
};

interface SkinPrediction {
  condition: string;
  label: string;
  probability: number;
  seeDoctorSoon: boolean;
}

/** Short plain-language notes for the 23 classes the model knows. */
const ABOUT: Record<string, string> = {
  Acne: 'Blocked pores causing pimples, blackheads or cysts.',
  Actinic_Keratosis: 'Rough, scaly patch from sun damage that can turn into skin cancer if untreated.',
  Atopic_Dermatitis: 'A long-term itchy, dry rash (a type of eczema).',
  Bacterial_Infections: 'Skin infection such as impetigo or cellulitis; may need antibiotics.',
  Basal_Cell_Carcinoma: 'The most common skin cancer; grows slowly but needs treatment.',
  Benign_Keratosis_Tumors: 'Non-cancerous growths such as seborrhoeic keratosis.',
  Bullous: 'Blistering skin conditions; these need a doctor to assess.',
  DrugEruption: 'A skin reaction to a medicine.',
  Eczema: 'Inflamed, itchy, dry or cracked skin.',
  Lupus: 'An immune condition that can cause rashes, often on sun-exposed skin.',
  Melanocytic_Nevi: 'Common moles, usually harmless.',
  Melanoma: 'A serious skin cancer that can spread; needs prompt assessment.',
  Parasitic_Infections: 'Conditions such as scabies or lice.',
  Psoriasis_Lichen_Planus: 'Raised, scaly or purplish patches from inflammation.',
  Rosacea: 'Redness and flushing on the face, sometimes with bumps.',
  SkinCancer_Other: 'Other kinds of skin cancer; needs a dermatologist.',
  Sun_Sunlight_Damage: 'Changes from sun exposure such as spots or sunburn.',
  Tinea_Fungal_Infections: 'Fungal infection such as ringworm or athlete\'s foot.',
  Unknown_Normal: 'No clear skin condition was recognised.',
  Vascular_Tumors: 'Growths made of blood vessels, such as haemangiomas.',
  Vasculitis: 'Inflamed blood vessels showing as spots or patches; needs a doctor.',
  Vitiligo: 'Loss of skin colour in patches.',
  Warts_Viral_Infections: 'Viral skin growths such as warts or molluscum.',
};

class SkinModelService {
  async isAvailable(): Promise<boolean> {
    try {
      const r = await axios.get(`${API_URL}/skin/status`, { timeout: 10000 });
      return !!r.data?.available || r.data?.reason === 'starting';
    } catch {
      return false;
    }
  }

  /** Sends the photo to the HealthCare+ API, which runs the skin model on its server. */
  async analyze(file: File): Promise<AnalysisResult> {
    const start = Date.now();
    const form = new FormData();
    form.append('file', file);
    let res;
    try {
      res = await axios.post(`${API_URL}/skin/analyze`, form, { timeout: 130000 });
    } catch (err: any) {
      throw new Error(err?.response?.data?.error || 'Skin analysis is unavailable right now. Please try again later.');
    }
    const d = res.data?.data;
    const preds: SkinPrediction[] = d?.predictions || [];
    if (!preds.length) throw new Error('The skin model returned no result.');
    const top = preds[0];
    const urgent: boolean = !!d.urgent;
    const unclear = top.probability < 0.4;

    const findings: Finding[] = preds.map((p, i) => ({
      name: `${i === 0 ? 'Most likely: ' : ''}${p.label}`,
      confidence: p.probability,
      description: `${ABOUT[p.condition] || ''}${p.seeDoctorSoon ? ' A dermatologist should check this.' : ''}`.trim(),
      severity: p.seeDoctorSoon && p.probability >= 0.15 ? 'high' : p.probability >= 0.3 ? 'medium' : 'low',
    }));

    const recommendations: Recommendation[] = [
      urgent
        ? {
            type: 'urgent',
            title: 'See a dermatologist soon',
            description: 'One of the likely results is a condition that should be checked by a skin doctor, for example a possible skin cancer. Book a visit and show them this spot.',
            timeframe: 'Within 1-2 weeks, sooner if it is growing, bleeding or changing',
          }
        : {
            type: 'follow-up',
            title: 'See a doctor if it does not improve',
            description: 'If the spot or rash lasts more than two weeks, spreads, hurts, bleeds or changes, see a doctor.',
          },
      ...(unclear
        ? [{
            type: 'standard' as const,
            title: 'The model is unsure',
            description: 'No single result is strong. Try a sharper, well-lit close-up of only the affected skin.',
          }]
        : []),
      {
        type: 'standard',
        title: 'Screening tool, not a diagnosis',
        description: `This model was tested on 2,300 photos: the right condition was its first answer ${d.top1Accuracy ?? 80.65}% of the time and in its top three ${d.top3Accuracy ?? 94.09}% of the time. It can be wrong; only a doctor can diagnose skin conditions.`,
      },
    ];

    return {
      id: `skin-${Date.now()}`,
      timestamp: new Date().toISOString(),
      aiModel: SKIN_MODEL_INFO.name,
      confidence: top.probability,
      severity: urgent ? 'high' : top.probability >= 0.5 && top.condition !== 'Unknown_Normal' ? 'medium' : 'low',
      findings,
      recommendations,
      disclaimer: 'Educational screening only, not a diagnosis. The photo is sent to our server for analysis and is not stored.',
      imageType: 'skin',
      processingTime: Date.now() - start,
    };
  }
}

export const skinModelService = new SkinModelService();
