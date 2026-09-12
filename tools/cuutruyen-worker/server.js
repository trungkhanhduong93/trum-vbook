// ============================================================
// server.js — bản chạy trên máy chủ Node thường (VPS, Render, Fly, Docker).
// Cùng lõi với bản Vercel. Chạy: node server.js  (nghe cổng PORT, mặc định 3000)
// ============================================================

'use strict';

const http = require('http');
const { handle } = require('./descramble.js');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const q = {};
    u.searchParams.forEach((v, k) => { q[k] = v; });

    if (u.pathname === '/health' || (!q.p && !q.url && !q.u)) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end('CuuTruyen descrambler dang chay.\n');
    }

    try {
        const out = await handle(q);
        res.writeHead(200, {
            'Content-Type': out.contentType,
            'Content-Length': String(out.buf.length),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'X-Descrambler': out.engine
        });
        res.end(out.buf);
    } catch (err) {
        res.writeHead(err.status || 500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end('Loi: ' + (err.message || String(err)));
    }
});

server.listen(PORT, () => {
    console.log('CuuTruyen descrambler nghe cong ' + PORT);
});
