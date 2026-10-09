const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const subjectsHandler = require('./api/subjects');
const questionsHandler = require('./api/questions');
const manageHandler = require('./api/manage');

const PORT = process.env.PORT || 3030;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Helper to provide express-like response helpers for Vercel functions
function wrapRes(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  wrapRes(res);

  // Enable CORS for development servers (like VS Code Live Server on port 5500)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin, Authorization');

  // Cache Control - Disable caching completely
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  req.query = parsedUrl.query;

  // API Routes
  if (pathname === '/api/subjects') {
    return subjectsHandler(req, res);
  }
  if (pathname === '/api/questions') {
    return questionsHandler(req, res);
  }
  if (pathname === '/api/manage') {
    return manageHandler(req, res);
  }

  // Static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  // Prevent serving sensitive files like .env or server files
  const forbiddenFiles = ['.env', 'atlas-credentials.env', '.git', 'server.js', 'package.json'];
  if (forbiddenFiles.some(f => safePath.includes(f))) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  // If path doesn't have an extension, try appending .html (cleanUrls)
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not found
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.status(404).end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`\n🚀 Server đang chạy:`);
  console.log(`- Trên máy tính:              http://localhost:${PORT}`);
  console.log(`- Trên điện thoại (cùng WiFi): http://${localIp}:${PORT}`);
  console.log(`- Quản lý đề:                 http://${localIp}:${PORT}/manage.html\n`);
});
