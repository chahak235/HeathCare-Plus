import React, { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  Mic, Square, Upload, Activity, Brain, AlertCircle, CheckCircle, BarChart3, Download, Phone, RotateCcw, FileAudio,
} from 'lucide-react'
import { extractVoiceFeatures, VoiceFeatures } from '../../../services/voice-features'

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api'
const MIN_SECONDS = 10
const MAX_SECONDS = 120

interface Report {
  overallState: string
  summary: string
  scores: { stress: number; anxiety: number; lowMood: number; energy: number; calm: number } | null
  emotions: { emotion: string; score: number }[]
  voiceObservations: string[]
  suggestions: string[]
  seekHelp: boolean
  seekHelpReason: string
}

interface AnalysisResponse {
  transcript: string
  features: VoiceFeatures | null
  report: Report
  crisisResources: { name: string; phone: string }[]
  generatedAt: string
}

const SCORE_LABELS: { key: keyof NonNullable<Report['scores']>; label: string; good: 'low' | 'high' }[] = [
  { key: 'stress', label: 'Stress', good: 'low' },
  { key: 'anxiety', label: 'Anxiety', good: 'low' },
  { key: 'lowMood', label: 'Low mood', good: 'low' },
  { key: 'energy', label: 'Energy', good: 'high' },
  { key: 'calm', label: 'Calm', good: 'high' },
]

const scoreColor = (value: number, good: 'low' | 'high') => {
  const concern = good === 'low' ? value : 100 - value
  if (concern >= 65) return 'bg-red-500'
  if (concern >= 40) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const VoiceAnalyzer: React.FC = () => {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audio, setAudio] = useState<{ blob: Blob; name: string } | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [levels, setLevels] = useState<number[]>([])
  const [stage, setStage] = useState<'idle' | 'measuring' | 'analysing'>('idle')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number>()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopMeters = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopMeters(), [stopMeters])
  useEffect(() => {
    if (!audio) {
      setAudioUrl(null)
      return
    }
    const url = URL.createObjectURL(audio.blob)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audio])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    setRecording(false)
  }, [])

  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) stopRecording()
  }, [recording, seconds, stopRecording])

  const startRecording = async () => {
    setError(null)
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream

      const ctx = new AudioContext()
      ctxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.slice(0, 24).reduce((a, b) => a + b, 0) / 24
        setLevels((prev) => [...prev.slice(-39), avg])
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        setAudio({ blob: new Blob(chunksRef.current, { type }), name: 'Recording' })
        setLevels([])
        stopMeters()
      }
      recorder.start()
      setSeconds(0)
      setRecording(true)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setError('Microphone access was blocked. Allow microphone access in your browser, or upload an audio file instead.')
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      setError('That file is larger than 25 MB. Please upload a shorter clip.')
      return
    }
    setError(null)
    setResult(null)
    setAudio({ blob: file, name: file.name })
  }

  const analyse = async () => {
    if (!audio) return
    setError(null)
    setResult(null)
    try {
      setStage('measuring')
      let features: VoiceFeatures | null = null
      try {
        features = await extractVoiceFeatures(audio.blob)
      } catch (err) {
        console.warn('Could not measure voice features:', err)
      }
      if (features && features.speechSec < 3) {
        setError('We could hardly hear any speech. Please speak closer to the microphone for at least 20 seconds.')
        return
      }

      setStage('analysing')
      const form = new FormData()
      const ext = (audio.blob.type.split('/')[1] || 'webm').split(';')[0]
      form.append('file', audio.blob, audio.name.includes('.') ? audio.name : `recording.${ext}`)
      if (features) form.append('features', JSON.stringify(features))
      const { data } = await axios.post<AnalysisResponse>(`${API_URL}/voice/analyze`, form, { timeout: 90000 })
      setResult(data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Voice analysis failed. Please check your connection and try again.')
    } finally {
      setStage('idle')
    }
  }

  const downloadReport = () => {
    if (!result) return
    const r = result.report
    const f = result.features
    const lines = [
      'HEALTHCARE+ VOICE WELLBEING SCREENING REPORT',
      `Generated: ${new Date(result.generatedAt).toLocaleString()}`,
      '',
      `Overall: ${r.overallState}`,
      r.summary,
      '',
      ...(r.scores ? ['SCORES (0-100)', ...SCORE_LABELS.map((s) => `  ${s.label}: ${r.scores![s.key]}`), ''] : []),
      ...(r.emotions.length ? ['EMOTIONS', ...r.emotions.map((e) => `  ${e.emotion}: ${e.score}`), ''] : []),
      ...(f
        ? [
            'VOICE MEASUREMENTS',
            `  Length: ${f.durationSec}s (speech ${f.speechSec}s)`,
            `  Silence: ${Math.round(f.pauseRatio * 100)}%, long pauses per minute: ${f.pausesPerMin}`,
            `  Pitch: ${f.pitchHz ?? 'n/a'} Hz, variation ${f.pitchVariationSemitones ?? 'n/a'} semitones`,
            `  Loudness variation: ${f.loudnessVariationDb} dB`,
            '',
          ]
        : []),
      ...(r.voiceObservations.length ? ['OBSERVATIONS', ...r.voiceObservations.map((o) => `  - ${o}`), ''] : []),
      ...(r.suggestions.length ? ['SUGGESTIONS', ...r.suggestions.map((s) => `  - ${s}`), ''] : []),
      ...(result.crisisResources.length ? ['SUPPORT', ...result.crisisResources.map((c) => `  ${c.name}: ${c.phone}`), ''] : []),
      'TRANSCRIPT',
      result.transcript,
      '',
      'This is a wellbeing screening, not a medical diagnosis. Please talk to a qualified professional about your mental health.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `voice-wellbeing-report-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const reset = () => {
    setAudio(null)
    setResult(null)
    setError(null)
  }

  const busy = stage !== 'idle'
  const card = 'p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white via-white to-primary-50/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-950/30 p-6 md:p-8 shadow-sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-primary-100 dark:bg-primary-900/40">
          <Mic className="w-7 h-7 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Voice Mental Health Analyzer</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Talk for 20 to 60 seconds about how you've been feeling. We look at what you say and how you say it.
          </p>
        </div>
      </div>

      {!result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className={card}>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Record your voice</p>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={busy || (recording && seconds < MIN_SECONDS)}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                  recording ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {recording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
                {recording ? (seconds < MIN_SECONDS ? `Keep talking… ${MIN_SECONDS - seconds}s` : `Stop (${seconds}s)`) : 'Start recording'}
              </button>
              {recording && (
                <div className="mt-3 flex items-end gap-0.5 h-12" aria-hidden>
                  {levels.map((l, i) => (
                    <div key={i} className="flex-1 rounded-t bg-primary-500/80" style={{ height: `${Math.max(4, Math.min(100, l))}%` }} />
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Minimum {MIN_SECONDS}s, stops at {MAX_SECONDS / 60} min.</p>
            </div>

            <div className={card}>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Or upload a file</p>
              <label className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:border-primary-500 cursor-pointer ${busy || recording ? 'pointer-events-none opacity-60' : ''}`}>
                <Upload className="w-5 h-5 text-primary-600" />
                Choose audio file
                <input type="file" accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg" onChange={handleUpload} className="hidden" />
              </label>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">MP3, M4A, WAV, WEBM or OGG, up to 25 MB.</p>
            </div>
          </div>

          {audio && !recording && (
            <div className={`${card} mb-5 flex flex-col sm:flex-row sm:items-center gap-3`}>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 min-w-0">
                <FileAudio className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <span className="truncate">{audio.name}</span>
              </div>
              {audioUrl && <audio controls src={audioUrl} className="w-full sm:flex-1 h-10" />}
            </div>
          )}

          <button
            type="button"
            onClick={analyse}
            disabled={!audio || busy || recording}
            className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-cyan-500 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                {stage === 'measuring' ? 'Measuring your voice…' : 'Listening and writing your report…'}
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" /> Analyze my voice
              </>
            )}
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.report.seekHelp && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Please reach out for support</p>
              {result.report.seekHelpReason && <p className="text-sm text-red-700 dark:text-red-300 mb-2">{result.report.seekHelpReason}</p>}
              <div className="flex flex-wrap gap-2">
                {result.crisisResources.map((c) => (
                  <a key={c.phone} href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
                    <Phone className="w-4 h-4" /> {c.name}: {c.phone}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={card}>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Overall</p>
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">{result.report.overallState}</p>
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">{result.report.summary}</p>
          </div>

          {result.report.scores && (
            <div className={card}>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Wellbeing indicators</h3>
              <div className="space-y-3">
                {SCORE_LABELS.map((s) => {
                  const v = Math.max(0, Math.min(100, Math.round(result.report.scores![s.key] ?? 0)))
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between text-sm mb-1 text-neutral-700 dark:text-neutral-300">
                        <span>{s.label}</span>
                        <span className="font-semibold">{v}</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor(v, s.good)}`} style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.report.emotions.length > 0 && (
              <div className={card}>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><Brain className="w-4 h-4" /> Emotions noticed</h3>
                <div className="flex flex-wrap gap-2">
                  {result.report.emotions.map((e) => (
                    <span key={e.emotion} className="px-3 py-1 rounded-full text-sm bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                      {e.emotion} · {e.score}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.features && (
              <div className={card}>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">How you spoke</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-neutral-500">Speaking time</dt><dd className="text-neutral-800 dark:text-neutral-200">{result.features.speechSec}s of {result.features.durationSec}s</dd>
                  <dt className="text-neutral-500">Silence</dt><dd className="text-neutral-800 dark:text-neutral-200">{Math.round(result.features.pauseRatio * 100)}%</dd>
                  <dt className="text-neutral-500">Long pauses</dt><dd className="text-neutral-800 dark:text-neutral-200">{result.features.pausesPerMin} per min</dd>
                  <dt className="text-neutral-500">Pitch variation</dt><dd className="text-neutral-800 dark:text-neutral-200">{result.features.pitchVariationSemitones ?? 'n/a'} semitones</dd>
                </dl>
              </div>
            )}
          </div>

          {(result.report.voiceObservations.length > 0 || result.report.suggestions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.report.voiceObservations.length > 0 && (
                <div className={card}>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Observations</h3>
                  <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                    {result.report.voiceObservations.map((o) => <li key={o}>• {o}</li>)}
                  </ul>
                </div>
              )}
              {result.report.suggestions.length > 0 && (
                <div className={card}>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Suggestions</h3>
                  <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                    {result.report.suggestions.map((s) => <li key={s}>• {s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <details className={card}>
            <summary className="cursor-pointer font-semibold text-neutral-900 dark:text-white">What we heard (transcript)</summary>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{result.transcript || '(no speech recognised)'}</p>
          </details>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={downloadReport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700">
              <Download className="w-4 h-4" /> Download report
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200">
              <RotateCcw className="w-4 h-4" /> New analysis
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-4">
        Wellbeing screening, not a diagnosis. Your recording is sent to our AI provider (Groq) to transcribe and analyse, and is not stored.
        If you are in distress, call Tele-MANAS on 14416 (free, 24x7).
      </p>
    </div>
  )
}

export default VoiceAnalyzer
