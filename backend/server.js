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

// Proxy all requests to Python backend
app.use((req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8001,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
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