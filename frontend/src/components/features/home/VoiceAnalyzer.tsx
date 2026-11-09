import React, { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Mic, MicOff, Upload, Activity, Heart, Brain, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react'

interface Emotion {
  emotion: string
  score: number
}

interface AnalysisResult {
  mentalState: string
  emotions: Emotion[]
  warning: string | null
  patient_id?: string
  session_id?: string
  filename?: string
}

const VoiceAnalyzer: React.FC = () => {
  const [recording, setRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number>()
  const streamRef = useRef<MediaStream | null>(null)

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect() } catch (e) {}
      sourceRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop() } catch (e) {}
      })
      streamRef.current = null
    }
    analyserRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (recordingTimer) clearInterval(recordingTimer)
      cleanupAudio()
    }
  }, [recordingTimer, cleanupAudio])

  const startRecording = async () => {
    try {
      cleanupAudio()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const visualize = () => {
        if (!analyserRef.current || !audioContextRef.current || audioContextRef.current.state === 'closed') return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = Array.from(dataArray.slice(0, 10)).reduce((a, b) => a + b, 0) / 10
        setAudioLevel(prev => [...prev.slice(-19), average])
        animationFrameRef.current = requestAnimationFrame(visualize)
      }
      visualize()

      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        setUploadedFile(null)
        setAudioLevel([])
        cleanupAudio()
      }

      mediaRecorderRef.current.start()
      setRecording(true)
      setRecordingDuration(0)

      const timer = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000)
      setRecordingTimer(timer)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Microphone access denied. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    if (recordingDuration < 3) {
      alert(`Please record for at least 3 seconds. You've recorded ${recordingDuration}s.`)
      return
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    setRecording(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setAudioBlob(null)
    }
  }

  const analyzeVoice = async () => {
    const audioSource = audioBlob || uploadedFile
    if (!audioSource) {
      alert('Please record or upload audio first')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', audioSource, 'audio.wav')

      // Your FastAPI expects a separate 'request' field with JSON
      const requestData = {
        patient_id: 'patient-123',
        session_id: `session-${Date.now()}`
      }
      formData.append('request', JSON.stringify(requestData))

      console.log('📤 Sending to voice analysis API on port 3001...')

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api'}/voice/analyze`,
        formData,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        }
      )

      console.log('✅ Response received:', response.data)
      
      const data = response.data
      
      // Extract emotions from response
      const emotions = data.emotions || []
      
      // Determine mental state
      let mentalState = 'Stable'
      if (emotions.length > 0) {
        const topEmotion = emotions[0].emotion
        const stressEmotions = ['Distress', 'Anxiety', 'Anger', 'Fear', 'Stress']
        const lowEmotions = ['Sadness', 'Tiredness', 'Boredom', 'Loneliness', 'Depression']
        const positiveEmotions = ['Calmness', 'Contentment', 'Excitement', 'Joy', 'Happiness', 'Relaxed']
        
        if (stressEmotions.includes(topEmotion)) mentalState = 'High Stress Detected'
        else if (lowEmotions.includes(topEmotion)) mentalState = 'Low / Depressive Indicators'
        else if (positiveEmotions.includes(topEmotion)) mentalState = 'Uplifted / Positive'
      }

      setResult({
        mentalState: data.mental_state || mentalState,
        emotions: emotions,
        warning: data.warning || null,
        patient_id: data.patient_id,
        session_id: data.session_id
      })
      
    } catch (err: any) {
      console.error('❌ Analysis error:', err)
      
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Error response:', err.response.data)
        console.error('Error status:', err.response.status)
        setError(`Server error (${err.response.status}): ${err.response.data?.detail || 'Unknown error'}`)
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check if the voice analysis service is running.')
      } else {
        // Something happened in setting up the request
        setError(err.message || 'Analysis failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStateColor = (state: string) => {
    if (state === 'High Stress Detected') return '#ef4444'
    if (state === 'Low / Depressive Indicators') return '#f97316'
    if (state === 'Uplifted / Positive') return '#10b981'
    if (state === 'Stable') return '#00C2CB'
    return '#94a3b8'
  }

  const getBarColor = (emotion: string) => {
    const stressEmotions = ['Distress', 'Anxiety', 'Anger', 'Fear', 'Stress']
    const lowEmotions = ['Sadness', 'Tiredness', 'Boredom', 'Loneliness', 'Depression']
    const positiveEmotions = ['Calmness', 'Contentment', 'Excitement', 'Joy', 'Happiness', 'Relaxed']
    
    if (stressEmotions.includes(emotion)) return '#ef4444'
    if (lowEmotions.includes(emotion)) return '#f97316'
    if (positiveEmotions.includes(emotion)) return '#10b981'
    return '#00C2CB'
  }

  const getEmotionIcon = (emotion: string) => {
    const stressEmotions = ['Distress', 'Anxiety', 'Anger', 'Fear', 'Stress']
    const lowEmotions = ['Sadness', 'Tiredness', 'Boredom', 'Loneliness', 'Depression']
    const positiveEmotions = ['Calmness', 'Contentment', 'Excitement', 'Joy', 'Happiness', 'Relaxed']
    
    if (stressEmotions.includes(emotion)) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (lowEmotions.includes(emotion)) return <Activity className="w-4 h-4 text-orange-500" />
    if (positiveEmotions.includes(emotion)) return <Heart className="w-4 h-4 text-green-500" />
    return <Brain className="w-4 h-4 text-medical-cyan" />
  }

  return (
    <div className="bg-medical-navy/95 backdrop-blur-sm rounded-xl p-6 border border-medical-cyan/20 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-medical-cyan/10 rounded-lg">
          <Mic className="w-6 h-6 text-medical-cyan" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Voice Mental Health Analyzer</h2>
          <p className="text-sm text-gray-400">AI-powered emotion detection from speech</p>
        </div>
      </div>

      {recording && audioLevel.length > 0 && (
        <div className="mb-6 p-4 bg-medical-navy/50 rounded-lg border border-medical-cyan/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Recording... {recordingDuration}s / 3s min</span>
            <span className="text-xs text-red-400 animate-pulse">🔴 LIVE</span>
          </div>
          <div className="flex items-end h-16 gap-0.5">
            {audioLevel.map((level, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-medical-cyan to-medical-cyan/50 rounded-t"
                style={{ height: `${Math.min(level, 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-medical-navy/50 rounded-lg border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3">Option 1 — Record</p>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              recording 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-medical-cyan/10 text-medical-cyan border border-medical-cyan/50 hover:bg-medical-cyan/20'
            }`}
          >
            {recording ? (
              <>
                <MicOff className="w-5 h-5" />
                Stop Recording ({recordingDuration}s / 3s min)
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </button>
          {audioBlob && !recording && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Audio ready
            </p>
          )}
        </div>

        <div className="p-4 bg-medical-navy/50 rounded-lg border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3">Option 2 — Upload</p>
          <label className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-medical-navy border border-gray-600 hover:border-medical-cyan/50 flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-5 h-5 text-medical-cyan" />
            Choose Audio File
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadedFile && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1 truncate">
              <CheckCircle className="w-3 h-3" /> {uploadedFile.name}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={analyzeVoice}
        disabled={loading || (!audioBlob && !uploadedFile)}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          loading || (!audioBlob && !uploadedFile)
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-medical-cyan to-medical-cyan/80 text-white hover:shadow-lg hover:shadow-medical-cyan/20'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Analyzing...
          </>
        ) : (
          <>
            <BarChart3 className="w-5 h-5" />
            Analyze Voice
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className={`p-4 rounded-lg text-center font-bold text-lg ${
            result.mentalState === 'High Stress Detected' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
            result.mentalState === 'Low / Depressive Indicators' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
            result.mentalState === 'Uplifted / Positive' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
            'bg-medical-cyan/10 text-medical-cyan border border-medical-cyan/50'
          }`}>
            {result.mentalState}
          </div>

          {result.warning && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/50 rounded-lg text-sm text-orange-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {result.warning}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Emotion Analysis
            </h3>
            {result.emotions.map((e) => (
              <div key={e.emotion} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-300">
                    {getEmotionIcon(e.emotion)}
                    {e.emotion}
                  </span>
                  <span className="font-bold" style={{ color: getBarColor(e.emotion) }}>
                    {e.score}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${e.score}%`,
                      backgroundColor: getBarColor(e.emotion)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-700">
            ⚠️ Screening tool only. Not a medical diagnosis.
          </p>
        </div>
      )}
    </div>
  )
}

export default VoiceAnalyzer