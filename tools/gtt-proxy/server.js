const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BASE_URL = 'https://goctruyentranhvui41.com';
const UA = process.env.CUSTOM_UA || 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

// Session Cookie storage
let cookies = {
  usid: '',
  xtoken: ''
};
let lastCookieFetch = 0;

async function refreshSession() {
  const now = Date.now();
  if (cookies.usid && cookies.xtoken && (now - lastCookieFetch < 12 * 3600 * 1000)) {
    return;
  }
  try {
    const res = await axios.get(`${BASE_URL}/lien-he`, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      timeout: 10000
    });
    const setCookie = res.headers['set-cookie'] || [];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);

    const mUsid = cookieStr.match(/usid=([^;]+)/);
    if (mUsid) cookies.usid = mUsid[1];

    const mToken = cookieStr.match(/X-TOKEN=([^;]+)/);
    if (mToken) cookies.xtoken = mToken[1];

    lastCookieFetch = now;
    console.log('[SESSION] Cookie refreshed:', cookies);
  } catch (err) {
    console.error('[SESSION] Failed to refresh cookie:', err.message);
  }
}

function getHeaders(customHeaders = {}) {
  // Support manual COOKIE_OVERRIDE env if specified
  if (process.env.COOKIE_OVERRIDE) {
    return {
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
      'Referer': `${BASE_URL}/`,
      'Cookie': process.env.COOKIE_OVERRIDE,
      ...customHeaders
    };
  }

  const cookieHeader = [
    cookies.usid ? `usid=${cookies.usid}` : '',
    cookies.xtoken ? `X-TOKEN=${cookies.xtoken}` : ''
  ].filter(Boolean).join('; ');

  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Referer': `${BASE_URL}/`,
    ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    ...customHeaders
  };
}

// Convert CDN URLs (gtt-bk.pro) to SITE_URL so VBook ImageLoader sends matching Referer
function transformImageUrls(dataArr) {
  if (!Array.isArray(dataArr)) return dataArr;
  return dataArr.map(url => {
    const s = String(url || '').trim();
    if (!s) return s;
    if (s.indexOf('gtt-bk.pro') !== -1) {
      const match = s.match(/^https?:\/\/[^\/]+(\/.*)$/);
      return match ? `${BASE_URL}${match[1]}` : s;
    }
    return s;
  });
}

// In-Memory Cache
const cache = new Map();
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.exp) {
    cache.delete(key);
    return null;
  }
  return item.data;
}
function setCache(key, data, ttlMs = 30 * 60 * 1000) {
  cache.set(key, { data, exp: Date.now() + ttlMs });
}

// ── ENDPOINTS ────────────────────────────────────────────────────────────────

// Health check / Keep-alive endpoint for UptimeRobot (Fix Blind Spot 2: Cold Start)
app.get(['/', '/ping', '/health'], (req, res) => {
  res.json({
    status: true,
    service: 'GocTruyenTranh Micro-Proxy',
    timestamp: new Date().toISOString(),
    sessionReady: Boolean(cookies.usid && cookies.xtoken)
  });
});

// 1. Home / Listing: /api/proxy/v2/search
app.get('/api/proxy/v2/search', async (req, res) => {
  const cacheKey = `search_${req.url}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const apiRes = await axios.get(`${BASE_URL}/api/v2/search`, {
      params: req.query,
      headers: getHeaders(),
      timeout: 10000
    });
    setCache(cacheKey, apiRes.data);
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// 2. Detail: /api/proxy/comic/:slug
app.get('/api/proxy/comic/:slug', async (req, res) => {
  const slug = req.params.slug;
  const cacheKey = `detail_${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const apiRes = await axios.get(`${BASE_URL}/api/comic/${slug}`, {
      headers: getHeaders(),
      timeout: 10000
    });
    setCache(cacheKey, apiRes.data);
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// 3. Search: /api/proxy/comic/search
app.get('/api/proxy/comic/search', async (req, res) => {
  try {
    const apiRes = await axios.get(`${BASE_URL}/api/comic/search`, {
      params: req.query,
      headers: getHeaders(),
      timeout: 10000
    });
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// 4. TOC (Chapters): /api/proxy/comic/:id/chapter
app.get('/api/proxy/comic/:id/chapter', async (req, res) => {
  const id = req.params.id;
  const cacheKey = `toc_${id}_${req.query.offset || 0}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  await refreshSession();
  try {
    const apiRes = await axios.get(`${BASE_URL}/api/comic/${id}/chapter`, {
      params: req.query,
      headers: getHeaders(),
      timeout: 10000
    });
    setCache(cacheKey, apiRes.data);
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// 5. Chapter Images: /api/proxy/chapter/loadAll
app.post('/api/proxy/chapter/loadAll', async (req, res) => {
  const { comicId, chapterNumber, nameEn } = req.body;
  const cacheKey = `chap_${comicId}_${chapterNumber}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  await refreshSession();
  try {
    const postData = new URLSearchParams({ comicId, chapterNumber, nameEn }).toString();
    const apiRes = await axios.post(`${BASE_URL}/api/chapter/loadAll`, postData, {
      headers: getHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }),
      timeout: 12000
    });

    let respData = apiRes.data;
    // Transform CDN URLs so VBook ImageLoader sends matching Referer (Fix Blind Spot 3)
    if (respData && respData.status && respData.result && respData.result.data) {
      respData.result.data = transformImageUrls(respData.result.data);
      setCache(cacheKey, respData, 60 * 60 * 1000);
    }

    res.json(respData);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GocTruyenTranh Micro-Proxy listening on port ${PORT}`);
});
