const express = require('express');
const router = express.Router();
const axios = require('axios');

// Legacy route, only used by server.js. The main app (src/app.ts) uses Groq.
const OLLAMA_URL = `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api`;

// POST /api/ai/chat - Chat with Ollama
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid message is required'
      });
    }

    // Enhanced medical prompt
    const medicalPrompt = `You are Healthcare+ AI Assistant, a medical information assistant for Indian users. You are not a doctor.

IMPORTANT DISCLAIMER: I am an AI assistant and not a substitute for professional medical advice. Always consult with qualified healthcare providers for medical concerns.

User Query: "${message}"

Please provide:
1. Clear, concise medical information
2. Relevant to Indian healthcare context (mention Indian medicine names, hospitals, practices)
3. Practical advice with actionable steps
4. When to seek immediate medical attention
5. Suggest Indian healthcare resources if applicable

Format your response with clear sections using **bold** for headings.

Response:`;

    const response = await axios.post(`${OLLAMA_URL}/generate`, {
      model: 'phi3:mini',
      prompt: medicalPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1000
      }
    }, {
      timeout: 30000
    });

    res.json({
      success: true,
      response: response.data.response
    });
  } catch (error) {
    console.error('Ollama API error:', error.message);
    
    // Report the failure so the client can show that the AI is unavailable
    res.status(503).json({
      success: false,
      error: 'AI service is temporarily unavailable. Please try again shortly.'
    });
  }
});

// GET /api/ai/status - Check Ollama status
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/tags`, { timeout: 5000 });
    res.json({
      success: true,
      available: true,
      models: response.data.models
    });
  } catch (error) {
    res.json({
      success: true,
      available: false,
      message: 'Ollama server not available, using fallback mode'
    });
  }
});

module.exports = router;