import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { networkInterfaces } from 'os';
import JSZip from 'jszip';
import ScreenshotDocumenter from './src/main.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Artifact server management
const activeServers = new Map(); // Map<entryId, { server, port, url }>
let nextPort = 9000;

// Debug clients management (for Agent Watch)
const debugClients = new Map(); // Map<jobId, response object>

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

// Debug Event Helpers

function emitDebugEvent(jobId, type, agent, message, meta = null) {
  const client = debugClients.get(jobId);
  if (client) {
    const eventData = JSON.stringify({ type, agent, message, meta });
    client.write(`data: ${eventData}\n\n`);
  }
}

// Artifact Server Helpers

function getLocalNetworkIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function extractZipToTemp(zipPath, entryId) {
  const tempDir = path.join(__dirname, 'temp', entryId);
  await fs.mkdir(tempDir, { recursive: true });

  // Read ZIP file
  const zipData = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(zipData);

  // Extract all files
  for (const [filename, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      const content = await file.async('nodebuffer');
      const filePath = path.join(tempDir, filename);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
    }
  }

  return tempDir;
}

async function startArtifactServer(entryId, zipPath) {
  // Check if already serving
  if (activeServers.has(entryId)) {
    return activeServers.get(entryId);
  }

  // Extract ZIP to temp directory
  const tempDir = await extractZipToTemp(zipPath, entryId);

  // Determine port
  const port = nextPort++;

  // Create simple HTTP server
  const server = http.createServer(async (req, res) => {
    try {
      // Default to guide.html
      let filePath = path.join(tempDir, req.url === '/' ? 'guide.html' : req.url);

      // Security: prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(tempDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      // Read and serve file
      const content = await fs.readFile(filePath);

      // Set content type based on extension
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
        '.md': 'text/markdown'
      };

      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
      res.end(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    }
  });

  // Start server
  await new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`📡 Artifact server started for ${entryId} on port ${port}`);
      resolve();
    });
    server.on('error', reject);
  });

  const localIP = getLocalNetworkIP();
  const url = `http://${localIP}:${port}`;

  const serverInfo = {
    server,
    port,
    url,
    tempDir
  };

  activeServers.set(entryId, serverInfo);
  return serverInfo;
}

async function stopArtifactServer(entryId) {
  const serverInfo = activeServers.get(entryId);
  if (!serverInfo) {
    return false;
  }

  // Close server
  await new Promise((resolve) => {
    serverInfo.server.close(() => {
      console.log(`🛑 Artifact server stopped for ${entryId} (port ${serverInfo.port})`);
      resolve();
    });
  });

  // Clean up temp directory
  try {
    await fs.rm(serverInfo.tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Warning: Could not delete temp directory: ${error.message}`);
  }

  activeServers.delete(entryId);
  return true;
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

    const { appName, description, vendor, links, notes, jobId } = req.body;

    if (!appName) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, error: 'App name is required' });
    }

    // Emit initial debug event
    if (jobId) {
      emitDebugEvent(jobId, 'start', 'Server', 'Starting documentation generation', {
        appName,
        filename: req.file.originalname,
        size: `${(req.file.size / 1024).toFixed(2)} KB`
      });
    }

    // Process the screenshot
    const documenter = new ScreenshotDocumenter();

    if (jobId) {
      emitDebugEvent(jobId, 'info', 'Server', 'Initializing multi-agent system');
    }

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

    if (jobId) {
      emitDebugEvent(jobId, 'info', 'Orchestrator', 'Starting workflow planning', {
        appName: context.appName
      });
    }

    const result = await documenter.processScreenshot(req.file.path, context, jobId ? (type, agent, message, meta) => {
      emitDebugEvent(jobId, type, agent, message, meta);
    } : null);

    if (result.success) {
      if (jobId) {
        emitDebugEvent(jobId, 'complete', 'Server', 'Documentation generated successfully', {
          processingTime: `${(result.metadata.processing_time / 1000).toFixed(1)}s`,
          validationScore: `${result.validation.overall_score}/100`,
          estimatedCost: `$${result.costEstimate.toFixed(4)}`
        });
      }

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
      if (jobId) {
        emitDebugEvent(jobId, 'error', 'Server', 'Documentation generation failed', {
          error: result.error || 'Unknown error'
        });
      }

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

    const { jobId } = req.body;
    if (jobId) {
      emitDebugEvent(jobId, 'error', 'Server', 'Unexpected error during processing', {
        error: error.message
      });
    }

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
      // Stop artifact server if running
      if (activeServers.has(id)) {
        await stopArtifactServer(id);
      }

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

// Start serving artifact
app.post('/api/serve/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const history = await loadHistory();
    const entry = history.find(e => e.id === id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    const zipPath = path.join(__dirname, entry.outputPath);

    // Check if ZIP exists
    try {
      await fs.access(zipPath);
    } catch (error) {
      return res.status(404).json({ success: false, error: 'Artifact file not found' });
    }

    // Start server
    const serverInfo = await startArtifactServer(id, zipPath);

    res.json({
      success: true,
      serving: true,
      port: serverInfo.port,
      url: serverInfo.url
    });
  } catch (error) {
    console.error('Error starting artifact server:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop serving artifact
app.post('/api/stop/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const stopped = await stopArtifactServer(id);

    if (stopped) {
      res.json({ success: true, serving: false });
    } else {
      res.status(404).json({ success: false, error: 'Server not found or already stopped' });
    }
  } catch (error) {
    console.error('Error stopping artifact server:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active servers
app.get('/api/servers', (req, res) => {
  const servers = {};
  for (const [id, info] of activeServers.entries()) {
    servers[id] = {
      port: info.port,
      url: info.url
    };
  }
  res.json({ success: true, servers });
});

// SSE endpoint for agent debug feed
app.get('/api/debug/:jobId', (req, res) => {
  const jobId = req.params.jobId;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Store the response object for this job
  debugClients.set(jobId, res);

  console.log(`🔍 Agent Watch connected for job ${jobId}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'start',
    agent: 'System',
    message: 'Agent Watch connected',
    meta: { jobId }
  })}\n\n`);

  // Remove client on disconnect
  req.on('close', () => {
    debugClients.delete(jobId);
    console.log(`🔍 Agent Watch disconnected for job ${jobId}`);
  });
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
