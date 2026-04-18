const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

let pythonProcess = null;

// Start Python FastAPI backend
function startPythonBackend() {
  console.log('🚀 Starting Python FastAPI backend...');
  
  pythonProcess = spawn('python', [
    '-m', 'uvicorn', 'app.main:app',
    '--host', '0.0.0.0',
    '--port', '8001',
    '--reload'
  ], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  pythonProcess.on('error', (err) => {
    console.error('❌ Failed to start Python backend:', err);
    process.exit(1);
  });

  pythonProcess.on('exit', (code) => {
    console.log(`⚠️  Python backend exited with code ${code}`);
    process.exit(code || 1);
  });
}

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from localhost on any port
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Proxy all requests to Python backend
app.use((req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8001,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'host': 'localhost:8001'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Ensure CORS headers are passed through
    const headers = { ...proxyRes.headers };
    const origin = req.headers.origin;
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
      headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token';
    }
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend service unavailable' }));
  });

  req.pipe(proxyReq);
});

// Start the Node.js proxy server
const server = app.listen(PORT, () => {
  console.log(`✅ Node.js proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to Python FastAPI on port 8001`);
  startPythonBackend();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Interrupted, shutting down...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});