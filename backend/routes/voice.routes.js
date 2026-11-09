
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'voice-analysis',
    timestamp: new Date().toISOString()
  });
});

// Main voice analysis endpoint
router.post('/analyze', upload.single('audio'), async (req, res) => {
  const tempFilePath = req.file?.path;
  const originalFileName = req.file?.originalname || 'audio.wav';

  if (!tempFilePath) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  try {
    console.log('🎤 Processing voice analysis request...');
    console.log('📁 File:', originalFileName);

    // Check if file exists and has content
    const stats = fs.statSync(tempFilePath);
    if (stats.size === 0) {
      throw new Error('Uploaded file is empty');
    }
    console.log(`📊 File size: ${stats.size} bytes`);

    // Check if Hume API key is configured
    if (!process.env.HUME_API_KEY) {
      console.error('❌ HUME_API_KEY not found in environment');
      
      // Use mock data for development if no API key
      console.log('⚠️ Using mock data (no API key)');
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      // Return mock response for testing
      return res.json({
        mentalState: 'Stable',
        emotions: [
          { emotion: 'Calmness', score: 75 },
          { emotion: 'Contentment', score: 65 },
          { emotion: 'Neutral', score: 45 },
          { emotion: 'Tiredness', score: 30 },
          { emotion: 'Distress', score: 15 }
        ],
        warning: 'Using demo mode. Add HUME_API_KEY to environment for real analysis.'
      });
    }

    // 1 — Send audio to Hume AI
    console.log('📤 Sending to Hume AI...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), originalFileName);

    const jobResponse = await axios.post(
      'https://api.hume.ai/v0/batch/jobs',
      formData,
      {
        headers: {
          'X-Hume-Api-Key': process.env.HUME_API_KEY,
          ...formData.getHeaders(),
        },
        params: { models: 'prosody' },
        timeout: 10000 // 10 second timeout for job creation
      }
    );

    const jobId = jobResponse.data.job_id;
    console.log('✅ Hume Job Created:', jobId);

    // 2 — Poll until job is complete
    let predictions = null;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts && !predictions) {
      attempts++;
      console.log(`⏳ Polling attempt ${attempts}/${maxAttempts}...`);
      
      try {
        // Wait 2 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusRes = await axios.get(
          `https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`,
          { 
            headers: { 'X-Hume-Api-Key': process.env.HUME_API_KEY },
            timeout: 5000
          }
        );

        if (statusRes.data && Array.isArray(statusRes.data) && statusRes.data.length > 0) {
          predictions = statusRes.data;
          console.log('✅ Predictions received!');
          break;
        }
      } catch (pollError) {
        // 400/404 means job still processing - continue polling
        console.log(`⏳ Job still processing... (attempt ${attempts})`);
        continue;
      }
    }

    // 3 — Clean up temp file
    fs.unlinkSync(tempFilePath);
    console.log('🧹 Temp file cleaned up');

    if (!predictions) {
      return res.status(504).json({ 
        error: 'Hume AI analysis timed out. Please try again.',
        details: 'The service is taking longer than expected to process your audio.'
      });
    }

    // 4 — Extract emotions
    const emotions = 
      predictions[0]?.results?.predictions[0]?.models?.prosody
        ?.grouped_predictions[0]?.predictions[0]?.emotions || [];

    // Define relevant emotions for mental health
    const relevantEmotions = [
      'Distress', 'Tiredness', 'Calmness', 'Anxiety', 'Sadness', 
      'Excitement', 'Contentment', 'Anger', 'Fear', 'Joy',
      'Boredom', 'Loneliness', 'Happiness', 'Stress'
    ];

    // Filter and sort emotions
    let filtered = emotions
      .filter((e) => relevantEmotions.includes(e.name))
      .sort((a, b) => b.score - a.score)
      .map((e) => ({
        emotion: e.name,
        score: Math.round(e.score * 100),
      }))
      .slice(0, 6); // Top 6 emotions

    // If no relevant emotions found, take top 6 of all
    if (filtered.length === 0) {
      filtered = emotions
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((e) => ({
          emotion: e.name,
          score: Math.round(e.score * 100),
        }));
    }

    // 5 — Determine overall mental state
    const topEmotion = filtered[0]?.emotion || 'Neutral';
    let mentalState = 'Stable';
    
    const stressEmotions = ['Distress', 'Anxiety', 'Anger', 'Fear', 'Stress'];
    const lowEmotions = ['Sadness', 'Tiredness', 'Boredom', 'Loneliness'];
    const positiveEmotions = ['Calmness', 'Contentment', 'Excitement', 'Joy', 'Happiness'];
    
    if (stressEmotions.includes(topEmotion)) mentalState = 'High Stress Detected';
    if (lowEmotions.includes(topEmotion)) mentalState = 'Low / Depressive Indicators';
    if (positiveEmotions.includes(topEmotion)) mentalState = 'Uplifted / Positive';

    console.log('🎯 Analysis complete:', { mentalState, emotionsCount: filtered.length });

    // 6 — Return results
    res.json({
      mentalState,
      emotions: filtered,
      warning: filtered.length < 3 
        ? 'Limited emotional data detected. For best results, speak clearly for at least 5-8 seconds.'
        : null
    });

  } catch (error) {
    console.error('❌ Voice analysis error:', error.message);
    
    // Clean up temp file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Return appropriate error message
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Hume AI service unavailable. Please try again later.' });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({ error: 'Request timed out. Please try again.' });
    } else {
      res.status(500).json({ 
        error: 'Voice analysis failed',
        details: error.message 
      });
    }
  }
});

module.exports = router;
