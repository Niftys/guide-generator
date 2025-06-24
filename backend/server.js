import express from 'express';
import cors from 'cors';
import { generateGuideText, generateExplanation } from './gpt.js';
import { htmlToPdf } from './pdf.js';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const requiredEnvVars = ['OPENROUTER_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL ERROR: ${envVar} environment variable is not set`);
    process.exit(1);
  }
}

// NEW: Log API key status (masked for security)
console.log(`OpenRouter API key is ${process.env.OPENROUTER_API_KEY ? 'set' : 'MISSING'}`);
console.log(`Using model: mistralai/mistral-small-3.2-24b-instruct:free`);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS for local development
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Increased limit
  message: JSON.stringify({ error: 'Too many requests, please try again later' }),
  skip: (req) => req.path === '/api/health' // Skip rate limiting for health checks
});

// Apply to all API routes
app.use('/api/', apiLimiter);

// Helper to format AI text into a clean HTML step-by-step guide
function formatGuideAsHTML(guideText) {
  const lines = guideText.trim().split('\n').filter(line => line.trim().length > 0);
  const title = lines[0] || 'Guide';
  const steps = lines.slice(1).map(line => line.replace(/^\d+[\.\)]\s*/, '').trim());
  const stepItems = steps.map(step => `<li>${step}</li>`).join('\n');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            padding: 2rem;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #222;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
          }
          ol {
            padding-left: 1.5rem;
            font-size: 1.1rem;
          }
          li {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <ol>${stepItems}</ol>
      </body>
    </html>
  `;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Generate PDF guide
app.post('/api/generate-guide', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const guideText = await generateGuideText(prompt);
    const html = formatGuideAsHTML(guideText);
    const pdf = await htmlToPdf(html);

    // Parse title for filename
    const lines = guideText.trim().split('\n').filter(line => line.trim().length > 0);
    const title = lines[0] || 'Guide';
    const filename = slugify(title) + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);

  } catch (error) {
    console.error('Error generating guide:', error);
    res.status(500).json({ error: error.message || 'Failed to generate guide' });
  }
});

// Generate raw guide text (title + steps)
app.post('/api/generate-guide-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const guideText = await generateGuideText(prompt);
    res.json({ guideText });
  } catch (error) {
    console.error('Error generating guide text:', error);
    res.status(500).json({ error: error.message || 'Failed to generate guide' });
  }
});

// Generate explanation for a single step
app.post('/api/explain-step', async (req, res) => {
  try {
    const { prompt, stepText } = req.body;
    if (!prompt || !stepText) {
      return res.status(400).json({ error: 'Missing prompt or stepText' });
    }

    const explanationPrompt = `Given the overall guide topic: "${prompt}"
Explain this step in simple, clear language: "${stepText}"
Respond with one concise paragraph only.`;

    // Use the new generateExplanation function
    const explanation = await generateExplanation(explanationPrompt);
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: error.message || 'Failed to generate explanation' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});