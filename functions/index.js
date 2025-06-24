const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

// Define the secret reference
const deepseekApiKey = defineSecret('DEEPSEEK_API_KEY');
const client = new SecretManagerServiceClient(); // Initialize client here

const app = express();

// Configure trust proxy for Firebase
app.set('trust proxy', true);

// Rate limiter configuration
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many requests, try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  validate: { trustProxy: true }
});

// CORS configuration
app.use(cors({ origin: true }));

app.use(express.json());
app.use(apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Middleware to inject API key into request
app.use(async (req, res, next) => {
  try {
    // Access the secret value
    const [version] = await client.accessSecretVersion({
      name: `projects/guide-gen/secrets/DEEPSEEK_API_KEY/versions/latest`
    });
    
    // Attach to request
    req.deepseekApiKey = version.payload.data.toString();
    next();
  } catch (error) {
    console.error("Failed to load API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/generate-guide-text", async (req, res) => {
  try {
    const {generateGuideText} = require("./gpt.js");
    const apiKey = req.deepseekApiKey; // Fixed variable name
    
    if (!apiKey) {
      return res.status(500).json({error: "API key not configured"});
    }
    
    const {prompt} = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({error: "Valid prompt required (min 3 characters)"});
    }
    
    const TIMEOUT_MS = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
      const guideText = await generateGuideText(apiKey, prompt, controller.signal);
      clearTimeout(timeoutId);
      res.json({guideText});
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`AI response timed out after ${TIMEOUT_MS/1000} seconds`);
      }
      throw error;
    }
  } catch (error) {
    console.error("Guide generation error:", error.message);
    const status = error.message.includes('timed out') ? 504 : 500;
    res.status(status).json({
      error: error.message || "Failed to generate guide",
      code: status === 504 ? 'timeout' : 'server_error'
    });
  }
});

app.post("/explain-step", async (req, res) => {
  try {
    const {generateExplanation} = require("./gpt.js");
    const apiKey = req.deepseekApiKey; // Fixed variable name
    
    if (!apiKey) {
      return res.status(500).json({error: "API key not configured"});
    }
    
    const {prompt, stepText} = req.body;
    if (!prompt || !stepText) {
      return res.status(400).json({error: "Missing prompt or stepText"});
    }
    
    const explanation = await generateExplanation(apiKey, `Explain this step: "${stepText}" for topic: "${prompt}"`);
    res.json({explanation});
  } catch (error) {
    console.error("Error generating explanation:", error);
    res.status(500).json({error: error.message || "Failed to generate explanation"});
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Function configuration
const functionOptions = {
  region: "us-central1",
  cors: true,
  maxInstances: 10,
  invoker: "public",
  secrets: [deepseekApiKey]
};

exports.api = onRequest(functionOptions, app);