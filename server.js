import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ScreenshotDocumenter from './src/main.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (PNG, JPG, WEBP, GIF)'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/output', express.static('output'));

// History storage
const HISTORY_FILE = path.join(__dirname, 'data', 'history.json');

async function loadHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveHistory(history) {
  await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

async function addToHistory(entry) {
  const history = await loadHistory();
  history.unshift(entry); // Add to beginning
  await saveHistory(history);
  return history;
}

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get history
app.get('/api/history', async (req, res) => {
  try {
    const history = await loadHistory();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload and process screenshot
app.post('/api/process', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { appName, description, vendor, links, notes } = req.body;

    if (!appName) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, error: 'App name is required' });
    }

    // Process the screenshot
    const documenter = new ScreenshotDocumenter();
    await documenter.initialize();

    const context = {
      appName: appName || 'Application',
      description: description || 'User interface screenshot',
      vendor: vendor || undefined,
      links: links ? links.split(',').map(l => l.trim()) : undefined,
      notes: notes || undefined
    };

    console.log(`\n📸 Processing: ${req.file.originalname}`);
    console.log(`📝 App: ${context.appName}`);

    const result = await documenter.processScreenshot(req.file.path, context);

    if (result.success) {
      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        appName: context.appName,
        description: context.description,
        vendor: context.vendor,
        originalFilename: req.file.originalname,
        outputPath: result.outputPath,
        outputFilename: path.basename(result.outputPath),
        metadata: result.metadata,
        validation: result.validation,
        costEstimate: result.costEstimate
      };

      await addToHistory(historyEntry);

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json({
        success: true,
        message: 'Documentation generated successfully',
        entry: historyEntry
      });
    } else {
      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate documentation',
        details: result
      });
    }
  } catch (error) {
    console.error('Error processing screenshot:', error);

    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.DEBUG ? error.stack : undefined
    });
  }
});

// Download artifact
app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'output', filename);

    // Check if file exists
    await fs.access(filepath);

    res.download(filepath);
  } catch (error) {
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

// Delete history entry
app.delete('/api/history/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const history = await loadHistory();

    const entry = history.find(e => e.id === id);
    if (entry) {
      // Delete the output file
      try {
        await fs.unlink(path.join(__dirname, entry.outputPath));
      } catch (error) {
        console.warn('Could not delete output file:', error.message);
      }
    }

    const newHistory = history.filter(e => e.id !== id);
    await saveHistory(newHistory);

    res.json({ success: true, history: newHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   Screenshot Documenter - Multi-Agent System                  ║
║   Web Interface Running                                        ║
║                                                                ║
║   🌐 URL: http://localhost:${PORT}                               ║
║   📁 Output: ./output/                                         ║
║   🔑 API Key: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Not set'}                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Warning: ANTHROPIC_API_KEY not found in .env file');
    console.log('   Please set it to use the documentation generator\n');
  }
});
