import axios from 'axios';
import { TriageInput, TriageResult } from '../types/ai.types';

export class OllamaService {
  private baseUrl: string;
  private model: string;
  private isAvailable: boolean;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'phi3:mini';
    this.isAvailable = false;
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      this.isAvailable = response.status === 200;
      console.log(`🤖 Ollama ${this.isAvailable ? 'connected' : 'not available'} at ${this.baseUrl}`);
      
      if (
        this.isAvailable &&
        response.data &&
        typeof response.data === 'object' &&
        'tags' in response.data &&
        Array.isArray((response.data as any).tags)
      ) {
        const tags: { name?: string }[] = (response.data as any).tags as { name?: string }[];
        const hasModel = tags.some(
          (t) => typeof t.name === 'string' && (t.name as string).includes(this.model)
        );
        if (!hasModel) {
          console.warn(`⚠️ Model ${this.model} not found. Pull it with: ollama pull ${this.model}`);
        }
      }
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ Ollama not available. Using rule-based fallback.');
    }
  }

  async analyzeSymptoms(input: TriageInput): Promise<TriageResult> {
    if (!this.isAvailable) {
      return this.ruleBasedFallback(input);
    }

    try {
      const prompt = this.prdPrompt(input);

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        temperature: 0.1,
        max_tokens: 500
      });

      if (response.data && typeof response.data === 'object' && 'response' in response.data) {
        const result = this.parseResponse((response.data as any).response);
        return result;
      } else {
        return this.ruleBasedFallback(input);
      }
    } catch (error) {
      console.error('❌ Ollama analysis failed:', error);
      return this.ruleBasedFallback(input);
    }
  }

  prdPrompt(input: TriageInput): string {
    return `You are a medical triage AI. Analyze the following patient and determine priority (1-6, where 1 is most critical).

PATIENT:
- Age: ${input.context?.age || 'Unknown'}
- Gender: ${input.context?.gender || 'Unknown'}
- Medical History: ${input.context?.medicalHistory?.join(', ') || 'None'}
- Medications: ${input.context?.medications?.join(', ') || 'None'}
- Allergies: ${input.context?.allergies?.join(', ') || 'None'}

SYMPTOMS:
- Symptoms: ${input.symptoms?.symptoms?.join(', ') || 'None reported'}
- Duration: ${input.symptoms?.duration || 'Unknown'}
- Severity: ${input.symptoms?.severity || 'Not specified'}
- Location: ${input.symptoms?.location || 'Not specified'}
- Associated Symptoms: ${input.symptoms?.associatedSymptoms?.join(', ') || 'None'}

VITAL SIGNS:
- Heart Rate: ${input.vitals?.heartRate || 'Not measured'} bpm
- Blood Pressure: ${input.vitals?.bloodPressureSystolic || '?'}/${input.vitals?.bloodPressureDiastolic || '?'} mmHg
- O2 Saturation: ${input.vitals?.oxygenSaturation || 'Not measured'}%
- Temperature: ${input.vitals?.temperature || 'Not measured'}°F
- Pain Level: ${input.vitals?.painLevel || 'Not reported'}/10

Based on this information, provide a JSON response with:
1. priority (1-6)
2. confidence (0-100)
3. primaryConcern (what's the main issue)
4. suggestedSpecialty
5. suggestedActions (array of immediate actions)
6. recommendedTests (array of diagnostic tests)
7. redFlags (array of warning signs)
8. reasoning (brief explanation)

Respond with ONLY valid JSON, no other text.`;
  }

  private parseResponse(response: string): TriageResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          priority: parsed.priority ?? 3,
          confidence: parsed.confidence ?? 70,
          primaryConcern: parsed.primaryConcern ?? 'Unknown',
          suggestedSpecialty: parsed.suggestedSpecialty ?? 'Emergency Medicine',
          suggestedActions: parsed.suggestedActions ?? ['Monitor vital signs'],
          recommendedTests: parsed.recommendedTests ?? [],
          reasoning: parsed.reasoning ?? 'Based on presented symptoms',
          redFlags: parsed.redFlags ?? [],
          requiresImmediateAction: parsed.priority === 1,
          estimatedWaitTime: this.getEstimatedWaitTime(parsed.priority ?? 3)
        };
      }
    } catch (error) {
      console.error('❌ Failed to parse Ollama response:', error);
    }

    return this.ruleBasedFallback({} as TriageInput);
  }

  private ruleBasedFallback(input: TriageInput): TriageResult {
    // Rule-based fallback logic
    const vitals = input.vitals || {};
    const symptoms = input.symptoms || { symptoms: [] };
    const context = input.context || { age: 0, gender: 'unknown' };

    // Check for critical conditions
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) {
      return {
        priority: 1,
        confidence: 95,
        primaryConcern: 'Severe hypoxemia',
        suggestedSpecialty: 'Critical Care',
        suggestedActions: ['Administer oxygen', 'Prepare for intubation', 'Call respiratory therapy'],
        recommendedTests: ['Arterial blood gas', 'Chest X-ray'],
        redFlags: ['Low oxygen saturation', 'Respiratory distress'],
        reasoning: 'Oxygen saturation below 90% indicates severe respiratory compromise',
        requiresImmediateAction: true,
        estimatedWaitTime: 0
      };
    }

    if (symptoms.symptoms && symptoms.symptoms.some(s => s && s.toLowerCase().includes('chest pain'))) {
      return {
        priority: 1,
        confidence: 85,
        primaryConcern: 'Possible cardiac event',
        suggestedSpecialty: 'Cardiology',
        suggestedActions: ['Immediate ECG', 'Cardiac monitoring', 'Draw cardiac enzymes'],
        recommendedTests: ['Troponin', 'ECG', 'Chest X-ray'],
        redFlags: ['Chest pain', 'Potential myocardial infarction'],
        reasoning: 'Chest pain requires immediate cardiac evaluation',
        requiresImmediateAction: true,
        estimatedWaitTime: 0
      };
    }

    // Default fallback
    return {
      priority: 3,
      confidence: 60,
      primaryConcern: 'General medical evaluation needed',
      suggestedSpecialty: 'Emergency Medicine',
      suggestedActions: ['Complete triage assessment', 'Monitor vital signs'],
      recommendedTests: ['Basic metabolic panel', 'CBC'],
      redFlags: [],
      reasoning: 'No immediate life-threatening conditions detected',
      requiresImmediateAction: false,
      estimatedWaitTime: 15
    };
  }

  private getEstimatedWaitTime(priority: number): number {
    const waitTimes: Record<number, number> = {
      1: 0,
      2: 5,
      3: 15,
      4: 30,
      5: 60,
      6: 120
    };
    return waitTimes[priority] || 30;
  }
}
