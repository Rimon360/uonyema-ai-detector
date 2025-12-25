const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const pixelmatch = require('pixelmatch');
const app = express();
const port = 3000;
const cors = require("cors")
app.use(cors('*'))
// Configure multer for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Analyze image for AI generation indicators
async function analyzeImage(imageBuffer) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height, channels, density, hasAlpha } = metadata;

    // Get image statistics
    const stats = await image.stats();
    
    // Convert to raw pixel data for analysis
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 1. EXIF Analysis - AI images often lack camera EXIF data
    const exifScore = analyzeEXIF(metadata);

    // 2. Noise Analysis - AI images have unnatural noise patterns
    const noiseScore = analyzeNoise(data, info.width, info.height, info.channels);

    // 3. Compression Artifacts - AI images have different artifact patterns
    const compressionScore = await analyzeCompression(imageBuffer, metadata);

    // 4. Color Distribution - AI images have distinct color patterns
    const colorScore = analyzeColorDistribution(stats);

    // 5. Edge Analysis - AI images have overly smooth or sharp edges
    const edgeScore = await analyzeEdges(imageBuffer);

    // 6. Pattern Repetition - AI can create unnatural repetitions
    const repetitionScore = analyzeRepetition(data, info.width, info.height, info.channels);

    // 7. Frequency Analysis - AI images lack natural high-frequency content
    const frequencyScore = await analyzeFrequency(imageBuffer);

    // Calculate final AI probability
    const scores = {
      exif: exifScore,
      noise: noiseScore,
      compression: compressionScore,
      color: colorScore,
      edges: edgeScore,
      repetition: repetitionScore,
      frequency: frequencyScore
    };

    const weights = {
      exif: 0.10,
      noise: 0.20,
      compression: 0.15,
      color: 0.15,
      edges: 0.20,
      repetition: 0.10,
      frequency: 0.10
    };

    let aiProbability = 0;
    for (const [key, score] of Object.entries(scores)) {
      aiProbability += score * weights[key];
    }

    aiProbability = Math.round(Math.min(100, Math.max(0, aiProbability)));

    return {
      aiProbability,
      scores,
      metadata: {
        width,
        height,
        format: metadata.format,
        hasAlpha,
        size: imageBuffer.length
      }
    };
  } catch (error) {
    throw new Error(`Image analysis failed: ${error.message}`);
  }
}

// Analyze EXIF data
function analyzeEXIF(metadata) {
  let score = 50; // neutral

  // AI images rarely have camera EXIF data
  if (!metadata.exif || Object.keys(metadata.exif).length === 0) {
    score += 30;
  } else {
    // Check for camera-specific EXIF fields
    const cameraFields = ['Make', 'Model', 'LensModel', 'FocalLength'];
    const hasCameraData = metadata.exif && cameraFields.some(field => metadata.exif[field]);
    
    if (!hasCameraData) {
      score += 20;
    } else {
      score -= 20; // Real camera photo
    }
  }

  // Check for software tags (common in AI images)
  if (metadata.exif && metadata.exif.Software) {
    const software = metadata.exif.Software.toLowerCase();
    const aiKeywords = ['stable', 'diffusion', 'midjourney', 'dall', 'ai', 'generated'];
    if (aiKeywords.some(kw => software.includes(kw))) {
      score += 40;
    }
  }

  return Math.min(100, Math.max(0, score));
}

// Analyze noise patterns
function analyzeNoise(pixels, width, height, channels) {
  let score = 50;

  // Sample random patches and calculate local variance
  const patchSize = 8;
  const numSamples = 50;
  const variances = [];

  for (let i = 0; i < numSamples; i++) {
    const x = Math.floor(Math.random() * (width - patchSize));
    const y = Math.floor(Math.random() * (height - patchSize));

    const patch = [];
    for (let py = 0; py < patchSize; py++) {
      for (let px = 0; px < patchSize; px++) {
        const idx = ((y + py) * width + (x + px)) * channels;
        const gray = channels >= 3 
          ? (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
          : pixels[idx];
        patch.push(gray);
      }
    }

    const mean = patch.reduce((a, b) => a + b) / patch.length;
    const variance = patch.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / patch.length;
    variances.push(variance);
  }

  const avgVariance = variances.reduce((a, b) => a + b) / variances.length;
  const stdVariance = Math.sqrt(
    variances.reduce((sum, v) => sum + Math.pow(v - avgVariance, 2), 0) / variances.length
  );

  // AI images tend to have very uniform noise (low std) or no noise at all
  if (avgVariance < 50) score += 30; // Very low noise
  if (stdVariance < 20) score += 20; // Very uniform noise

  // Natural photos have moderate, varied noise
  if (avgVariance > 100 && avgVariance < 500 && stdVariance > 50) {
    score -= 20;
  }

  return Math.min(100, Math.max(0, score));
}

// Analyze compression artifacts
async function analyzeCompression(buffer, metadata) {
  let score = 50;

  // Check file size relative to resolution
  const pixels = metadata.width * metadata.height;
  const bytesPerPixel = buffer.length / pixels;

  // AI images are often saved with specific compression ratios
  if (metadata.format === 'jpeg') {
    if (bytesPerPixel < 0.5) score += 15; // Very high compression
    if (bytesPerPixel > 3) score -= 10; // Low compression (more like photo)
  }

  // PNG format is common for AI-generated images
  if (metadata.format === 'png') {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

// Analyze color distribution
function analyzeColorDistribution(stats) {
  let score = 50;

  // Check if color channels are too uniform or have unusual distributions
  const channels = stats.channels;
  
  for (let i = 0; i < Math.min(3, channels.length); i++) {
    const { mean, std } = channels[i];
    
    // AI images sometimes have overly balanced color channels
    if (std < 30) score += 10; // Very low variance
    if (std > 70) score -= 5; // High variance (natural)
    
    // Check for unusual mean values
    if (mean < 50 || mean > 200) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

// Analyze edge characteristics
async function analyzeEdges(buffer) {
  let score = 50;

  try {
    // Apply edge detection (Sobel-like filter)
    const edges = await sharp(buffer)
      .greyscale()
      .normalise()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .raw()
      .toBuffer();

    // Calculate edge density
    let edgePixels = 0;
    const threshold = 50;
    
    for (let i = 0; i < edges.length; i++) {
      if (edges[i] > threshold) edgePixels++;
    }

    const edgeDensity = edgePixels / edges.length;

    // AI images often have either too few or too many sharp edges
    if (edgeDensity < 0.05) score += 20; // Too smooth
    if (edgeDensity > 0.25) score += 15; // Too sharp/detailed

    // Natural photos have moderate edge density
    if (edgeDensity > 0.08 && edgeDensity < 0.18) score -= 15;

  } catch (error) {
    console.log('Edge analysis warning:', error.message);
  }

  return Math.min(100, Math.max(0, score));
}

// Analyze pattern repetition
function analyzeRepetition(pixels, width, height, channels) {
  let score = 50;

  // Check for unusual pattern repetitions in small regions
  const blockSize = 16;
  const blocks = [];

  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const block = [];
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const idx = ((y + by) * width + (x + bx)) * channels;
          block.push(pixels[idx]);
        }
      }
      blocks.push(block);
    }
  }

  // Simple similarity check between blocks
  let highSimilarity = 0;
  const sampleSize = Math.min(20, blocks.length);

  for (let i = 0; i < sampleSize; i++) {
    for (let j = i + 1; j < sampleSize; j++) {
      let diff = 0;
      for (let k = 0; k < blocks[i].length; k++) {
        diff += Math.abs(blocks[i][k] - blocks[j][k]);
      }
      diff /= blocks[i].length;
      
      if (diff < 10) highSimilarity++;
    }
  }

  const repetitionRatio = highSimilarity / (sampleSize * (sampleSize - 1) / 2);
  
  // High repetition suggests AI generation
  if (repetitionRatio > 0.3) score += 20;
  if (repetitionRatio > 0.5) score += 30;

  return Math.min(100, Math.max(0, score));
}

// Analyze frequency content
async function analyzeFrequency(buffer) {
  let score = 50;

  try {
    // Get high-frequency content by subtracting blurred version
    const original = await sharp(buffer)
      .greyscale()
      .raw()
      .toBuffer();

    const blurred = await sharp(buffer)
      .greyscale()
      .blur(5)
      .raw()
      .toBuffer();

    // Calculate high-frequency energy
    let highFreqEnergy = 0;
    for (let i = 0; i < original.length; i++) {
      highFreqEnergy += Math.abs(original[i] - blurred[i]);
    }
    highFreqEnergy /= original.length;

    // AI images often lack natural high-frequency content
    if (highFreqEnergy < 10) score += 30;
    if (highFreqEnergy < 5) score += 20;

    // Natural photos have more high-frequency detail
    if (highFreqEnergy > 20) score -= 15;

  } catch (error) {
    console.log('Frequency analysis warning:', error.message);
  }

  return Math.min(100, Math.max(0, score));
}

// API endpoint for image detection
app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log(`Processing image: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await analyzeImage(req.file.buffer);

    // Determine confidence level
    let confidence = 'low';
    if (result.aiProbability > 70 || result.aiProbability < 30) confidence = 'high';
    else if (result.aiProbability > 60 || result.aiProbability < 40) confidence = 'medium';

    res.json({
      success: true,
      aiProbability: result.aiProbability,
      confidence,
      isLikelyAI: result.aiProbability > 50,
      analysis: {
        exifData: result.scores.exif > 60 ? 'suspicious' : 'normal',
        noisePattern: result.scores.noise > 60 ? 'unnatural' : 'natural',
        compression: result.scores.compression > 60 ? 'unusual' : 'normal',
        colorDistribution: result.scores.color > 60 ? 'unusual' : 'normal',
        edges: result.scores.edges > 60 ? 'unnatural' : 'natural',
        repetition: result.scores.repetition > 60 ? 'high' : 'low',
        frequency: result.scores.frequency > 60 ? 'unusual' : 'normal'
      },
      scores: result.scores,
      imageInfo: result.metadata
    });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({
      error: 'Failed to process image',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Image Detection API is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Image Detection API',
    version: '2.0',
    endpoints: {
      detect: 'POST /api/detect (multipart/form-data with "image" field)',
      health: 'GET /api/health'
    },
    supportedFormats: ['JPEG', 'PNG', 'WebP', 'TIFF', 'GIF']
  });
});

// Start server
app.listen(port, () => {
  console.log(`AI Image Detection Server running on http://localhost:${port}`);
  console.log(`Test with: curl -X POST -F "image=@your-image.jpg" http://localhost:${port}/api/detect`);
});