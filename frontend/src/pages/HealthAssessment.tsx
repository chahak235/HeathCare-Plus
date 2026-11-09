import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';
import {
  Heart,
  Moon,
  Dumbbell,
  Utensils,
  Brain,
  Droplets,
  Cigarette,
  Stethoscope,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';

// ============================================================================
// Question bank
// ----------------------------------------------------------------------------
// Each option carries a 0-4 score. Higher is healthier. Categories map to the
// result breakdown so the summary can point at specific weak spots instead of
// just a single overall number.
// ============================================================================

type Category = 'sleep' | 'exercise' | 'nutrition' | 'stress' | 'hydration' | 'habits';

interface Option {
  label: string;
  score: number;
}

interface Question {
  id: string;
  category: Category;
  icon: React.ReactNode;
  prompt: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: 'sleep-hours',
    category: 'sleep',
    icon: <Moon className="w-5 h-5" />,
    prompt: 'On an average night, how many hours do you sleep?',
    options: [
      { label: 'Less than 5 hours', score: 0 },
      { label: '5–6 hours', score: 1 },
      { label: '6–7 hours', score: 2 },
      { label: '7–8 hours', score: 4 },
      { label: 'More than 8 hours', score: 3 },
    ],
  },
  {
    id: 'sleep-quality',
    category: 'sleep',
    icon: <Moon className="w-5 h-5" />,
    prompt: 'How often do you wake up feeling rested?',
    options: [
      { label: 'Almost never', score: 0 },
      { label: 'Rarely', score: 1 },
      { label: 'Sometimes', score: 2 },
      { label: 'Most days', score: 3 },
      { label: 'Almost every day', score: 4 },
    ],
  },
  {
    id: 'exercise-frequency',
    category: 'exercise',
    icon: <Dumbbell className="w-5 h-5" />,
    prompt: 'How many days a week do you get at least 30 minutes of physical activity?',
    options: [
      { label: '0 days', score: 0 },
      { label: '1–2 days', score: 1 },
      { label: '3–4 days', score: 3 },
      { label: '5–6 days', score: 4 },
      { label: 'Every day', score: 4 },
    ],
  },
  {
    id: 'exercise-type',
    category: 'exercise',
    icon: <Dumbbell className="w-5 h-5" />,
    prompt: 'How much of your day involves sitting (desk, commute, TV)?',
    options: [
      { label: 'Almost all of it', score: 0 },
      { label: 'Most of it', score: 1 },
      { label: 'About half', score: 2 },
      { label: 'A small part', score: 3 },
      { label: 'Very little — I move often', score: 4 },
    ],
  },
  {
    id: 'nutrition-veg',
    category: 'nutrition',
    icon: <Utensils className="w-5 h-5" />,
    prompt: 'How many servings of fruits and vegetables do you eat on a typical day?',
    options: [
      { label: '0', score: 0 },
      { label: '1–2', score: 1 },
      { label: '3–4', score: 3 },
      { label: '5 or more', score: 4 },
    ],
  },
  {
    id: 'nutrition-processed',
    category: 'nutrition',
    icon: <Utensils className="w-5 h-5" />,
    prompt: 'How often do you eat fast food or heavily processed meals?',
    options: [
      { label: 'Almost every day', score: 0 },
      { label: 'A few times a week', score: 1 },
      { label: 'About once a week', score: 3 },
      { label: 'Rarely or never', score: 4 },
    ],
  },
  {
    id: 'hydration',
    category: 'hydration',
    icon: <Droplets className="w-5 h-5" />,
    prompt: 'How much water do you drink on a typical day?',
    options: [
      { label: 'Less than 1 litre', score: 0 },
      { label: '1–1.5 litres', score: 1 },
      { label: '1.5–2.5 litres', score: 3 },
      { label: 'More than 2.5 litres', score: 4 },
    ],
  },
  {
    id: 'stress-level',
    category: 'stress',
    icon: <Brain className="w-5 h-5" />,
    prompt: 'Over the past two weeks, how would you rate your stress level?',
    options: [
      { label: 'Overwhelming, most days', score: 0 },
      { label: 'High, several days', score: 1 },
      { label: 'Moderate', score: 2 },
      { label: 'Low', score: 3 },
      { label: 'Rarely stressed', score: 4 },
    ],
  },
  {
    id: 'stress-coping',
    category: 'stress',
    icon: <Brain className="w-5 h-5" />,
    prompt: 'Do you have a regular way of unwinding (walk, hobby, meditation, talking to someone)?',
    options: [
      { label: 'No, I rarely get the chance', score: 0 },
      { label: 'Occasionally', score: 2 },
      { label: 'Yes, most weeks', score: 3 },
      { label: 'Yes, daily', score: 4 },
    ],
  },
  {
    id: 'habits-smoking',
    category: 'habits',
    icon: <Cigarette className="w-5 h-5" />,
    prompt: 'Do you currently smoke or use tobacco products?',
    options: [
      { label: 'Yes, daily', score: 0 },
      { label: 'Occasionally', score: 1 },
      { label: 'I quit within the last year', score: 3 },
      { label: 'No, never / quit long ago', score: 4 },
    ],
  },
  {
    id: 'habits-alcohol',
    category: 'habits',
    icon: <Cigarette className="w-5 h-5" />,
    prompt: 'How often do you drink alcohol?',
    options: [
      { label: 'Most days', score: 0 },
      { label: 'A few times a week', score: 1 },
      { label: 'Occasionally', score: 3 },
      { label: 'Rarely or never', score: 4 },
    ],
  },
  {
    id: 'checkups',
    category: 'habits',
    icon: <Stethoscope className="w-5 h-5" />,
    prompt: 'When did you last have a general health check-up?',
    options: [
      { label: 'More than 2 years ago / never', score: 0 },
      { label: '1–2 years ago', score: 2 },
      { label: 'Within the last year', score: 4 },
    ],
  },
];

const CATEGORY_LABEL: Record<Category, string> = {
  sleep: 'Sleep',
  exercise: 'Activity',
  nutrition: 'Nutrition',
  stress: 'Stress & mind',
  hydration: 'Hydration',
  habits: 'Habits & care',
};

const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  sleep: <Moon className="w-4 h-4" />,
  exercise: <Dumbbell className="w-4 h-4" />,
  nutrition: <Utensils className="w-4 h-4" />,
  stress: <Brain className="w-4 h-4" />,
  hydration: <Droplets className="w-4 h-4" />,
  habits: <Cigarette className="w-4 h-4" />,
};

const CATEGORY_ADVICE: Record<Category, { good: string; poor: string }> = {
  sleep: {
    good: 'Your sleep pattern looks solid — keep a consistent bedtime to protect it.',
    poor: 'Aim for 7–8 hours a night on a consistent schedule; poor sleep affects nearly every other health marker.',
  },
  exercise: {
    good: 'Good activity levels — keep mixing cardio and strength work.',
    poor: 'Try to build up to 150 minutes of moderate activity a week, even short walks count.',
  },
  nutrition: {
    good: 'Your eating pattern is on track — variety and whole foods are paying off.',
    poor: 'Add more fruit and vegetables to meals and cut back on processed/fast food where you can.',
  },
  stress: {
    good: 'You seem to be managing stress well — keep up whatever helps you unwind.',
    poor: 'Chronic stress affects sleep, heart health, and immunity — consider building in a regular way to decompress.',
  },
  hydration: {
    good: "You're staying well hydrated.",
    poor: 'Try to work up to around 2–2.5 litres of water a day.',
  },
  habits: {
    good: 'Your habits and care routine look healthy.',
    poor: 'Consider cutting back on tobacco/alcohol and scheduling a routine check-up if it has been a while.',
  },
};

interface CategoryResult {
  category: Category;
  score: number;
  max: number;
  pct: number;
}

function scoreAssessment(answers: Record<string, number>): {
  total: number;
  max: number;
  pct: number;
  byCategory: CategoryResult[];
} {
  const byCategoryMap: Record<Category, { score: number; max: number }> = {
    sleep: { score: 0, max: 0 },
    exercise: { score: 0, max: 0 },
    nutrition: { score: 0, max: 0 },
    stress: { score: 0, max: 0 },
    hydration: { score: 0, max: 0 },
    habits: { score: 0, max: 0 },
  };

  let total = 0;
  let max = 0;

  for (const q of QUESTIONS) {
    const maxOption = Math.max(...q.options.map((o) => o.score));
    max += maxOption;
    byCategoryMap[q.category].max += maxOption;

    const answerScore = answers[q.id];
    if (typeof answerScore === 'number') {
      total += answerScore;
      byCategoryMap[q.category].score += answerScore;
    }
  }

  const byCategory: CategoryResult[] = (Object.keys(byCategoryMap) as Category[]).map((cat) => ({
    category: cat,
    score: byCategoryMap[cat].score,
    max: byCategoryMap[cat].max,
    pct: byCategoryMap[cat].max > 0 ? Math.round((byCategoryMap[cat].score / byCategoryMap[cat].max) * 100) : 0,
  }));

  return { total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0, byCategory };
}

function overallVerdict(pct: number): { label: string; description: string; color: string } {
  if (pct >= 80) {
    return {
      label: 'Excellent',
      description: 'Your lifestyle habits are strongly supporting your health. Keep it up.',
      color: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (pct >= 60) {
    return {
      label: 'Good',
      description: "You're doing well overall, with a few areas worth tightening up.",
      color: 'text-primary-600 dark:text-primary-400',
    };
  }
  if (pct >= 40) {
    return {
      label: 'Fair',
      description: 'There are clear opportunities to improve — start with the lowest-scoring area below.',
      color: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    label: 'Needs attention',
    description: 'Several habits may be putting your health at risk. Consider small, sustainable changes and talk to a doctor if anything concerns you.',
    color: 'text-error-600 dark:text-error-400',
  };
}

export const HealthAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // -1 = intro, QUESTIONS.length = results
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const started = step >= 0;
  const finished = step >= QUESTIONS.length;
  const question = !finished && started ? QUESTIONS[step] : null;
  const answeredCount = Object.keys(answers).length;

  const selectAnswer = (score: number) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: score }));
    // Auto-advance after a short beat so the selection is visible.
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 150);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const restart = () => {
    setAnswers({});
    setStep(-1);
  };

  const result = finished ? scoreAssessment(answers) : null;
  const verdict = result ? overallVerdict(result.pct) : null;

  return (
    <div className="min-h-screen py-12">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Health Assessment</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              A quick lifestyle check-in — sleep, activity, nutrition, stress, and more.
            </p>
          </div>

          {!started && (
            <Card padding="lg" shadow="lg">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {(['sleep', 'exercise', 'nutrition'] as Category[]).map((cat) => (
                    <div
                      key={cat}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                    >
                      <div className="text-primary-600">{CATEGORY_ICON[cat]}</div>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">{CATEGORY_LABEL[cat]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  {QUESTIONS.length} quick questions, about 3 minutes. Your answers stay in this browser session —
                  nothing is sent anywhere until you choose to talk to a doctor about your results.
                </p>
                <Button fullWidth size="lg" onClick={() => setStep(0)} rightIcon={<ChevronRight className="w-5 h-5" />}>
                  Start Assessment
                </Button>
              </div>
            </Card>
          )}

          {question && (
            <Card padding="lg" shadow="lg">
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
                  <span>
                    Question {step + 1} of {QUESTIONS.length}
                  </span>
                  <span>{Math.round(((step) / QUESTIONS.length) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-2">
                {question.icon}
                <span>{CATEGORY_LABEL[question.category]}</span>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">{question.prompt}</h2>

              <div className="space-y-3">
                {question.options.map((opt) => {
                  const selected = answers[question.id] === opt.score;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => selectAnswer(opt.score)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {step > 0 && (
                <button
                  onClick={goBack}
                  className="mt-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
            </Card>
          )}

          {result && verdict && (
            <div className="space-y-6">
              <Card padding="lg" shadow="lg">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                  <div className={`text-4xl font-bold ${verdict.color}`}>{result.pct}%</div>
                  <div className={`text-lg font-semibold ${verdict.color}`}>{verdict.label}</div>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md mx-auto">{verdict.description}</p>
                </div>

                <div className="space-y-4">
                  {result.byCategory
                    .slice()
                    .sort((a, b) => a.pct - b.pct)
                    .map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                            {CATEGORY_ICON[cat.category]}
                            {CATEGORY_LABEL[cat.category]}
                          </span>
                          <span className="text-neutral-500 tabular-nums">{cat.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mb-1">
                          <div
                            className={`h-full ${cat.pct >= 60 ? 'bg-emerald-500' : cat.pct >= 40 ? 'bg-amber-500' : 'bg-error-500'}`}
                            style={{ width: `${cat.pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500">
                          {cat.pct >= 60 ? CATEGORY_ADVICE[cat.category].good : CATEGORY_ADVICE[cat.category].poor}
                        </p>
                      </div>
                    ))}
                </div>
              </Card>

              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  fullWidth
                  variant="secondary"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={restart}
                >
                  Retake Assessment
                </Button>
                <Button
                  fullWidth
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => navigate('/chat')}
                >
                  Discuss with AI Assistant
                </Button>
              </div>

              <MedicalDisclaimer />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default HealthAssessment;
