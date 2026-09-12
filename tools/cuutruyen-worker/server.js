const http = require('http');
const https = require('https');
const url = require('url');
const jpeg = require('jpeg-js');

const DRM_KEY = '3141592653589793';
const PORT = process.env.PORT || 3000;

function decodeDrm(drmBase64) {
  if (!drmBase64) return null;
  const clean = drmBase64.replace(/[\r\n\s]/g, '');
  const rawStr = Buffer.from(clean, 'base64').toString('binary');
  let layout = '';
  for (let i = 0; i < rawStr.length; i++) {
    const b = rawStr.charCodeAt(i);
    const k = DRM_KEY.charCodeAt(i % DRM_KEY.length);
    layout += String.fromCharCode(b ^ k);
  }
  if (!layout.startsWith('#v4|')) return null;
  return layout;
}

function fetchBuffer(imgUrl) {
  return new Promise((resolve, reject) => {
    https.get(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.cuutruyen.net/'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch image: status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/health' || parsed.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('CuuTruyen Descrambler Worker is running!');
  }

  const targetUrl = parsed.query.url;
  const drmData = parsed.query.drm;

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing "url" query parameter' }));
  }

  try {
    const imgBuffer = await fetchBuffer(targetUrl);

    if (!drmData) {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000, immutable'
      });
      return res.end(imgBuffer);
    }

    const layout = decodeDrm(drmData);
    if (!layout) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid DRM format' }));
    }

    const decoded = jpeg.decode(imgBuffer, { useTArray: true });
    const w = decoded.width;
    const h = decoded.height;
    const rowSize = w * 4;
    const srcBuffer = decoded.data;
    const dstBuffer = new Uint8Array(w * h * 4);

    let sy = 0;
    const segments = layout.split('|').slice(1);
    for (const seg of segments) {
      const parts = seg.split('-');
      if (parts.length !== 2) continue;
      const dy = parseInt(parts[0], 10);
      const partH = parseInt(parts[1], 10);

      const srcStart = sy * rowSize;
      const dstStart = dy * rowSize;
      const copyLen = partH * rowSize;

      if (srcStart + copyLen <= srcBuffer.length && dstStart + copyLen <= dstBuffer.length) {
        dstBuffer.set(srcBuffer.subarray(srcStart, srcStart + copyLen), dstStart);
      }
      sy += partH;
    }

    const encoded = jpeg.encode({ data: dstBuffer, width: w, height: h }, 85);

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': encoded.data.length,
      'Cache-Control': 'public, max-age=2592000, immutable',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(encoded.data);

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`CuuTruyen Descrambler Server running on port ${PORT}`);
});
