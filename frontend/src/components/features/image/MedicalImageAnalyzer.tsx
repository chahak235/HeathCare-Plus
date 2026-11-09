// frontend/src/components/image/MedicalImageAnalyzer.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

interface AnalysisResult {
  image_type: string;
  analyses: Array<{
    analysis_type: string;
    detected?: boolean;
    confidence: number;
    findings: string;
    recommendations?: string[];
  }>;
  heatmap: string;
  overall_assessment: {
    severity: 'critical' | 'warning' | 'normal';
    summary: string;
    urgency: string;
    recommended_specialist: string[];
  };
}

const MedicalImageAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageType, setImageType] = useState<'xray' | 'skin' | 'retina' | 'ultrasound' | 'ct' | 'mri'>('xray');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.dicom', '.dcm']
    },
    maxFiles: 1
  });

  const analyzeImage = async () => {
    if (!image || !user) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('image_type', imageType);
    formData.append('patient_id', user.id);

    try {
      const response = await axios.post('/api/image/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Image analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-image-analyzer">
      <h2>Medical Image Analysis</h2>
      
      <div className="image-type-selector">
        <label>Select Image Type:</label>
        <select value={imageType} onChange={(e) => setImageType(e.target.value as any)}>
          <option value="xray">Chest X-ray</option>
          <option value="skin">Skin Lesion</option>
          <option value="retina">Retinal Scan</option>
          <option value="ultrasound">Ultrasound</option>
          <option value="ct">CT Scan</option>
          <option value="mri">MRI Scan</option>
        </select>
      </div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here...</p>
        ) : (
          <p>Drag & drop a medical image, or click to select</p>
        )}
      </div>

      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button 
            onClick={analyzeImage} 
            disabled={loading}
            className="analyze-btn"
          >
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          
          <div className={`severity-banner severity-${analysis.overall_assessment.severity}`}>
            <h4>Overall Assessment: {analysis.overall_assessment.severity.toUpperCase()}</h4>
            <p>{analysis.overall_assessment.summary}</p>
            <p>Urgency: {analysis.overall_assessment.urgency}</p>
            <p>Recommended Specialist: {analysis.overall_assessment.recommended_specialist.join(', ')}</p>
          </div>

          <div className="analyses-grid">
            {analysis.analyses.map((item, index) => (
              <div key={index} className="analysis-card">
                <h5>{item.analysis_type.replace('_', ' ').toUpperCase()}</h5>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${item.confidence * 100}%` }}
                  />
                  <span>{Math.round(item.confidence * 100)}% Confidence</span>
                </div>
                <p className="findings">{item.findings}</p>
                {item.recommendations && (
                  <div className="recommendations">
                    <strong>Recommendations:</strong>
                    <ul>
                      {item.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {analysis.heatmap && (
            <div className="heatmap-section">
              <h5>Areas of Interest (Heatmap)</h5>
              <img 
                src={`data:image/png;base64,${analysis.heatmap}`} 
                alt="Heatmap" 
                className="heatmap-image"
              />
              <div className="heatmap-legend">
                <span className="low">Low Interest</span>
                <div className="gradient-bar" />
                <span className="high">High Interest</span>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="btn-primary">Save to Medical Record</button>
            <button className="btn-secondary">Share with Doctor</button>
            <button className="btn-outline">Get Second Opinion</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalImageAnalyzer;