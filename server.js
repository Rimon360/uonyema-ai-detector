const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const cors = require("cors")
const dotenv = require('dotenv')
dotenv.config()
const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Hugging Face API configuration
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/umm-maybe/AI-image-detector';
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN || 'your_token_here';
 

// Middleware
app.use(cors({}))
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'AI Image Detector API is running',
    endpoints: {
      detect: 'POST /api/detect-ai-image'
    }
  });
});

// AI Image Detection endpoint
app.post('/api/detect-ai-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload an image file'
      });
    }

    const imagePath = req.file.path;

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);

    // Call Hugging Face API
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    });

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      return res.status(response.status).json({
        error: 'Failed to analyze image',
        details: errorText
      });
    }

    const result = await response.json();

    // Parse the result
    let aiProbability = 0;
    let artificialLabel = result.find(r => r.label === 'artificial');

    if (artificialLabel) {
      aiProbability = (artificialLabel.score * 100).toFixed(2);
    }

    // Return formatted response
    res.json({
      success: true,
      analysis: {
        isAIGenerated: aiProbability > 50,
        aiProbability: parseFloat(aiProbability),
        confidence: aiProbability > 70 ? 'High' : aiProbability > 40 ? 'Medium' : 'Low',
        details: result
      },
      message: aiProbability > 50
        ? `This image has a ${aiProbability}% chance of being AI-generated`
        : `This image has a ${aiProbability}% chance of being AI-generated (likely real)`
    });

  } catch (error) {
    console.error('Error processing image:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Image Detector API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 Detection endpoint: http://localhost:${PORT}/api/detect-ai-image`);

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
});