const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PythonShell } = require('python-shell');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Import routes
const doctorsRoutes = require('./routes/doctors.routes');
const authRoutes = require('./routes/auth.routes');
const indianHospitalsRoutes = require('./routes/indian-hospitals.routes');
const aiAssistantRoutes = require('./routes/ai-assistant.routes');  
const appointmentRoutes = require('./routes/appointments.routes');

// Create a single Express app
const app = express();

// Ensure we use a valid HTTP port, not a database port
let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
// Safety check: if PORT is a common database port, use default
if (PORT === 5432 || PORT === 3306 || PORT === 27017) {
  console.warn(`⚠️  Warning: PORT ${PORT} is typically used for databases. Using 3001 instead.`);
  PORT = 3001;
}

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'audio') {
      cb(null, 'uploads/audio/');
    } else if (file.fieldname === 'image') {
      cb(null, 'uploads/images/');
    } else {
      cb(new Error('Invalid fieldname'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ========== API ROUTES ==========
// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      voice_analysis: 'available',
      image_analysis: 'available',
      authentication: 'available',
      hospitals: 'available'
    }
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/india/hospitals', indianHospitalsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/appointments', appointmentRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API working',
    version: '1.0.0',
    features: ['voice-analysis', 'image-analysis', 'hospitals', 'doctors', 'ai-assistant']
  });
});

// ========== VOICE & IMAGE ANALYSIS ENDPOINTS ==========

// Voice Analysis Endpoint
app.post('/api/voice/analyze', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file uploaded' 
      });
    }

    console.log(`🎤 Voice analysis requested: ${req.file.filename}`);
    
    // For demo/hackathon - return mock response
    // In production, call Python script
    
    const mockVoiceAnalysis = {
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        stress_level: Math.floor(Math.random() * 10) + 1,
        emotion: ['calm', 'anxious', 'happy', 'sad', 'neutral'][Math.floor(Math.random() * 5)],
        energy: (Math.random() * 100).toFixed(1),
        speech_rate: Math.floor(Math.random() * 200) + 80,
        pitch_stability: (Math.random() * 100).toFixed(1),
        health_risk: Math.floor(Math.random() * 100),
        confidence: (Math.random() * 0.5 + 0.5).toFixed(2)
      },
      recommendations: [
        'Practice deep breathing exercises for 5 minutes daily',
        'Ensure 7-8 hours of quality sleep',
        'Stay hydrated throughout the day'
      ]
    };

    // Uncomment for Python integration
    /*
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      scriptPath: './python_services',
      args: [req.file.path, req.body.patient_id || 'anonymous']
    };

    PythonShell.run('voice_analysis.py', options, (err, results) => {
      if (err) {
        console.error('Voice analysis error:', err);
        return res.status(500).json({ error: 'Analysis failed' });
      }
      
      const analysisResult = JSON.parse(results[0]);
      res.json(analysisResult);
    });
    */
    
    res.json(mockVoiceAnalysis);
    
  } catch (error) {
    console.error('Voice analysis endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Medical Image Analysis Endpoint
app.post('/api/image/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file uploaded' 
      });
    }

    const { image_type = 'xray', patient_id } = req.body;
    
    console.log(`🖼️ Image analysis requested: ${req.file.filename}, type: ${image_type}`);

    // For demo/hackathon - return mock response
    // In production, call Python script
    
    const mockImageAnalysis = {
      success: true,
      timestamp: new Date().toISOString(),
      image_type: image_type,
      analysis: {
        detected_conditions: ['Normal' + (Math.random() > 0.7 ? ', Mild Abnormality' : '')],
        confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
        severity: Math.random() > 0.8 ? 'moderate' : 'low',
        findings: 'Image analysis completed successfully',
        risk_level: Math.random() > 0.7 ? 'elevated' : 'normal'
      },
      recommendations: [
        'Consult with a specialist for detailed review',
        'Follow up in 6 months for routine check',
        'Maintain regular health screenings'
      ]
    };

    // Uncomment for Python integration
    /*
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      scriptPath: './python_services',
      args: [req.file.path, image_type, patient_id || 'anonymous']
    };

    PythonShell.run('image_analysis.py', options, (err, results) => {
      if (err) {
        console.error('Image analysis error:', err);
        return res.status(500).json({ error: 'Analysis failed' });
      }
      
      const analysisResult = JSON.parse(results[0]);
      res.json(analysisResult);
    });
    */
    
    res.json(mockImageAnalysis);
    
  } catch (error) {
    console.error('Image analysis endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Combined Health Analysis (Voice + Image)
app.post('/api/health/comprehensive-analysis', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { patient_id, symptoms } = req.body;
    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];

    console.log(`🔬 Comprehensive analysis requested for patient: ${patient_id || 'anonymous'}`);

    // For demo - return mock comprehensive analysis
    const comprehensiveAnalysis = {
      success: true,
      timestamp: new Date().toISOString(),
      patient_id: patient_id || 'anonymous',
      voice_analysis: audioFile ? {
        stress_level: Math.floor(Math.random() * 10) + 1,
        emotion: ['calm', 'anxious'][Math.floor(Math.random() * 2)],
        analyzed: true
      } : null,
      image_analysis: imageFile ? {
        conditions_detected: ['Normal'],
        analyzed: true
      } : null,
      symptoms: symptoms ? symptoms.split(',') : [],
      overall_health_score: Math.floor(Math.random() * 40) + 60,
      recommendations: [
        'Schedule a follow-up appointment with your primary care physician',
        'Consider lifestyle modifications for better health outcomes',
        'Monitor your symptoms and report any changes'
      ]
    };

    res.json(comprehensiveAnalysis);
    
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Helper functions (keep for when Python integration is ready)
async function analyzeVoice(audioPath, patientId) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      scriptPath: './python_services',
      args: [audioPath, patientId]
    };

    PythonShell.run('voice_analysis.py', options, (err, results) => {
      if (err) reject(err);
      else resolve(JSON.parse(results[0]));
    });
  });
}

async function analyzeImage(imagePath, imageType, patientId) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      scriptPath: './python_services',
      args: [imagePath, imageType, patientId]
    };

    PythonShell.run('image_analysis.py', options, (err, results) => {
      if (err) reject(err);
      else resolve(JSON.parse(results[0]));
    });
  });
}

// ========== 404 HANDLER ==========
// MUST be last
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    available_endpoints: [
      'POST /api/voice/analyze',
      'POST /api/image/analyze',
      'POST /api/health/comprehensive-analysis',
      'GET  /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET  /api/india/hospitals',
      'GET  /api/test'
    ]
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`\n🚀 Healthcare+ Server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n🎤 Voice Analysis:`);
  console.log(`   POST http://localhost:${PORT}/api/voice/analyze`);
  console.log(`\n🖼️ Image Analysis:`);
  console.log(`   POST http://localhost:${PORT}/api/image/analyze`);
  console.log(`\n🔬 Comprehensive Analysis:`);
  console.log(`   POST http://localhost:${PORT}/api/health/comprehensive-analysis`);
  console.log(`\n🔐 Authentication:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`\n🏥 Indian Hospitals:`);
  console.log(`   GET  http://localhost:${PORT}/api/india/hospitals`);
  console.log(`\n🔗 Test endpoint: http://localhost:${PORT}/api/test\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});





