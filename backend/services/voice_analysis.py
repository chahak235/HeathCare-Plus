# backend/services/voice_analysis.py
import numpy as np
import librosa
import parselmouth
from parselmouth.praat import call
import opensmile
from typing import Dict, Any
import tempfile
import os

class VoiceHealthAnalyzer:
    def __init__(self):
        # Initialize OpenSmile for feature extraction
        self.smile = opensmile.Smile(
            feature_set=opensmile.FeatureSet.ComParE_2016,
            feature_level=opensmile.FeatureLevel.Functionals,
        )
        
    def analyze_audio(self, audio_path: str) -> Dict[str, Any]:
        """Analyze voice for health parameters"""
        
        # Load audio file
        y, sr = librosa.load(audio_path, sr=16000)
        
        # 1. Extract features using OpenSmile
        features = self.smile.process_file(audio_path)
        
        # 2. Analyze with Praat for medical parameters
        praat_analysis = self._praat_analysis(audio_path)
        
        # 3. Extract custom features
        custom_features = self._extract_custom_features(y, sr)
        
        # 4. Calculate health scores
        results = self._calculate_health_scores(features, praat_analysis, custom_features)
        
        return results
    
    def _praat_analysis(self, audio_path: str) -> Dict[str, Any]:
        """Use Praat for voice analysis"""
        sound = parselmouth.Sound(audio_path)
        
        # Fundamental frequency (pitch)
        pitch = call(sound, "To Pitch", 0.0, 75, 600)
        mean_pitch = call(pitch, "Get mean", 0, 0, "Hertz")
        pitch_variability = call(pitch, "Get standard deviation", 0, 0)
        
        # Jitter and shimmer (voice quality measures)
        point_process = call(sound, "To PointProcess (periodic, cc)", 75, 600)
        jitter = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
        shimmer = call([sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        
        # Harmonic-to-noise ratio (HNR)
        hnr = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        mean_hnr = call(hnr, "Get mean", 0, 0)
        
        return {
            'mean_pitch': mean_pitch,
            'pitch_variability': pitch_variability,
            'jitter': jitter,  # Higher = more stress
            'shimmer': shimmer, # Higher = vocal fatigue
            'hnr': mean_hnr,    # Lower = vocal pathology
        }
    
    def _extract_custom_features(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract custom voice features"""
        
        # Energy and loudness
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = np.mean(rms)
        energy_variability = np.std(rms)
        
        # Speech rate (words per minute estimation)
        # Using syllable detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        pulses = librosa.beat.plp(onset_envelope=onset_env, sr=sr)
        speech_rate = np.sum(pulses) * 60 / (len(y) / sr)  # Approx syllables per minute
        
        # Mel-frequency cepstral coefficients (MFCCs) for voice quality
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1)
        
        # Voice breaks detection
        # Using zero crossing rate for breath detection
        zcr = librosa.feature.zero_crossing_rate(y)
        voice_breaks = np.sum(zcr > 0.1) / len(zcr[0])
        
        return {
            'energy_mean': energy_mean,
            'energy_variability': energy_variability,
            'speech_rate': speech_rate,
            'mfcc_features': mfcc_mean.tolist(),
            'voice_breaks': voice_breaks,
        }
    
    def _calculate_health_scores(self, features, praat_analysis, custom_features):
        """Calculate health scores from all features"""
        
        # Stress score calculation (based on jitter, shimmer, pitch variability)
        stress_score = (
            praat_analysis['jitter'] * 1000 * 0.4 +
            praat_analysis['shimmer'] * 100 * 0.3 +
            praat_analysis['pitch_variability'] / 50 * 0.3
        ) * 10  # Scale to 0-10
        
        # Fatigue score (based on energy and HNR)
        fatigue_score = (
            (1 - custom_features['energy_mean']) * 0.5 +
            (1 - praat_analysis['hnr'] / 20) * 0.5
        ) * 10
        
        # Depression/anxiety indicators
        # Lower pitch, slower speech, less energy variability
        depression_score = (
            (100 - praat_analysis['mean_pitch']) / 100 * 0.4 +
            (200 - custom_features['speech_rate']) / 200 * 0.4 +
            (1 - custom_features['energy_variability']) * 0.2
        ) * 10
        
        # Overall health risk score
        health_risk = min(100, (
            stress_score * 4 +
            fatigue_score * 3 +
            depression_score * 3
        ))
        
        # Emotion detection (simplified)
        emotions = self._detect_emotion(features, custom_features)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            stress_score, fatigue_score, depression_score
        )
        
        return {
            'stress_level': round(stress_score, 1),
            'fatigue_level': round(fatigue_score, 1),
            'depression_indicators': round(depression_score, 1),
            'health_risk': round(health_risk, 1),
            'emotion': emotions['dominant'],
            'energy': round(custom_features['energy_mean'], 2),
            'speech_rate': round(custom_features['speech_rate']),
            'pitch_stability': round(100 - praat_analysis['pitch_variability'], 1),
            'voice_quality': round(praat_analysis['hnr'], 1),
            'detailed_analysis': {
                'pitch_analysis': praat_analysis,
                'energy_analysis': custom_features,
                'emotion_breakdown': emotions['breakdown']
            },
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        }
    
    def _detect_emotion(self, features, custom_features):
        """Detect emotion from voice features"""
        # Simplified emotion detection
        # In production, use a trained emotion recognition model
        
        emotion_scores = {
            'happy': 0,
            'sad': 0,
            'angry': 0,
            'neutral': 0,
            'anxious': 0
        }
        
        # Based on pitch, energy, speech rate
        pitch = custom_features.get('mfcc_features', [0])[0] if 'mfcc_features' in custom_features else 0
        energy = custom_features.get('energy_mean', 0)
        speech_rate = custom_features.get('speech_rate', 0)
        
        # Simple heuristic rules (replace with ML model in production)
        if pitch > 0.5 and energy > 0.7 and speech_rate > 150:
            emotion_scores['happy'] = 0.8
        elif pitch < 0.3 and energy < 0.5 and speech_rate < 100:
            emotion_scores['sad'] = 0.7
        elif pitch > 0.7 and energy > 0.8 and speech_rate > 180:
            emotion_scores['angry'] = 0.6
        elif abs(pitch - 0.5) < 0.2 and abs(energy - 0.5) < 0.2:
            emotion_scores['neutral'] = 0.9
        elif pitch_variability > 0.3 and energy_variability > 0.3:
            emotion_scores['anxious'] = 0.7
        
        dominant = max(emotion_scores, key=emotion_scores.get)
        
        return {
            'dominant': dominant,
            'breakdown': emotion_scores
        }
    
    def _generate_recommendations(self, stress, fatigue, depression):
        """Generate personalized recommendations"""
        recommendations = []
        
        if stress > 7:
            recommendations.append("High stress detected. Consider practicing 5 minutes of deep breathing exercises daily.")
            recommendations.append("Try to reduce caffeine intake and ensure 7-8 hours of sleep.")
        
        if fatigue > 6:
            recommendations.append("Voice fatigue detected. Stay hydrated and avoid shouting or whispering.")
            recommendations.append("Consider vocal rest for 1-2 hours if possible.")
        
        if depression > 6:
            recommendations.append("Voice patterns suggest low mood. Consider talking to a trusted friend or professional.")
            recommendations.append("Regular physical activity can help improve mood and energy levels.")
        
        if stress > 5 or fatigue > 5:
            recommendations.append("Practice mindful speaking: pause between sentences, breathe deeply.")
        
        if len(recommendations) < 2:
            recommendations.append("Voice patterns are within normal range. Maintain good hydration and vocal hygiene.")
        
        return recommendations