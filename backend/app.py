# backend/app.py (FastAPI for voice analysis)
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
from services.voice_analysis import VoiceHealthAnalyzer

app = FastAPI(title="Healthcare+ Voice Analysis API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzer
voice_analyzer = VoiceHealthAnalyzer()

class VoiceAnalysisRequest(BaseModel):
    patient_id: str
    session_id: Optional[str] = None

@app.post("/api/voice/analyze")
async def analyze_voice(
    file: UploadFile = File(...),
    request: VoiceAnalysisRequest = None
):
    """
    Analyze voice for stress, emotion, and health parameters
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Analyze voice
        results = voice_analyzer.analyze_audio(tmp_path)
        
        # Add metadata
        results['patient_id'] = request.patient_id if request else 'anonymous'
        results['session_id'] = request.session_id if request else None
        results['filename'] = file.filename
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/voice/history/{patient_id}")
async def get_voice_history(patient_id: str, limit: int = 10):
    """
    Get voice analysis history for a patient
    """
    # In production, fetch from database
    return {"patient_id": patient_id, "history": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)








import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import io
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow requests from your React frontend

# Load the trained model
MODEL_PATH = 'xray_pneumonia_final.h5'
model = load_model(MODEL_PATH)

# Class names (must match training order)
CLASS_NAMES = ['NORMAL', 'PNEUMONIA']

# Model metadata (for frontend display)
MODEL_INFO = {
    'id': 'xray-resnet50',
    'name': 'Chest X‑ray Classifier (ResNet50)',
    'description': 'Detects pneumonia in chest X‑rays',
    'accuracy': 0.96,          # Example – replace with your actual validation accuracy
    'inputSize': '224×224',
    'specialty': ['xray']
}

def prepare_image(img_bytes):
    """Convert uploaded file bytes to model‑ready array."""
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array.astype(np.float32)

@app.route('/api/status', methods=['GET'])
def status():
    """Check if backend and models are available."""
    return jsonify({
        'available': True,
        'models': ['xray']
    })

@app.route('/api/models', methods=['GET'])
def get_models():
    """Return list of available AI models."""
    return jsonify([MODEL_INFO])

@app.route('/api/analyze/xray', methods=['POST'])
def analyze_xray():
    """Handle X‑ray image analysis."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty file'}), 400

    try:
        img_bytes = file.read()
        input_array = prepare_image(img_bytes)

        # Predict
        pred_prob = model.predict(input_array)[0][0]   # probability of PNEUMONIA
        pred_class = CLASS_NAMES[int(pred_prob >= 0.5)]
        confidence = float(pred_prob) if pred_class == 'PNEUMONIA' else 1.0 - float(pred_prob)

        # Simulate additional findings (you can expand this)
        findings = []
        if pred_class == 'PNEUMONIA':
            findings.append({
                'name': 'Pneumonia',
                'confidence': confidence,
                'description': 'Signs consistent with pneumonia detected.'
            })
        else:
            findings.append({
                'name': 'Normal',
                'confidence': confidence,
                'description': 'No clear signs of pneumonia.'
            })

        # Severity placeholder – you can implement a separate model or rule‑based logic
        severity = 'high' if pred_class == 'PNEUMONIA' and confidence > 0.8 else 'medium' if pred_class == 'PNEUMONIA' else 'low'

        # Recommendations based on result
        recommendations = []
        if pred_class == 'PNEUMONIA':
            recommendations.append({
                'type': 'medical',
                'title': 'Consult a doctor',
                'description': 'Please see a healthcare provider for confirmation and treatment.'
            })
        else:
            recommendations.append({
                'type': 'preventive',
                'title': 'Routine check‑up',
                'description': 'Your X‑ray appears normal. Continue regular health monitoring.'
            })

        # Build response matching your frontend's AnalysisResult type
        result = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'aiModel': MODEL_INFO['name'],
            'confidence': confidence,
            'severity': severity,
            'findings': findings,
            'recommendations': recommendations
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

