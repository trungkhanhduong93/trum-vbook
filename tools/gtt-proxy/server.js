const express = require('express');
const cors = require('cors');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BASE_URL = 'https://goctruyentranhvui41.com';
const UA = process.env.CUSTOM_UA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let cookies = {
  cf_clearance: '',
  usid: '',
  xtoken: ''
};
let lastCookieFetch = 0;
let isRefreshing = false;

async function solveCloudflareSession() {
  if (isRefreshing) return;
  const now = Date.now();
  if (cookies.cf_clearance && cookies.usid && cookies.xtoken && (now - lastCookieFetch < 2 * 3600 * 1000)) {
    return;
  }

  isRefreshing = true;
  console.log('[PUPPETEER] Launching headless browser to solve Cloudflare Turnstile on Render IP...');
  let browser = null;

  try {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setUserAgent(UA);

    console.log('[PUPPETEER] Navigating to /lien-he ...');
    await page.goto(`${BASE_URL}/lien-he`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait 5 seconds for Turnstile JS challenge auto-solve
    await new Promise(r => setTimeout(r, 5000));

    const pageCookies = await page.cookies();
    for (const c of pageCookies) {
      if (c.name === 'cf_clearance') cookies.cf_clearance = c.value;
      if (c.name === 'usid') cookies.usid = c.value;
      if (c.name === 'X-TOKEN') cookies.xtoken = c.value;
    }

    lastCookieFetch = Date.now();
    console.log('[PUPPETEER] Session solved successfully! Cookies:', cookies);
  } catch (err) {
    console.error('[PUPPETEER] Error solving Cloudflare session:', err.message);
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    isRefreshing = false;
  }
}

function getHeaders(customHeaders = {}) {
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
    cookies.cf_clearance ? `cf_clearance=${cookies.cf_clearance}` : '',
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

app.get(['/', '/ping', '/health'], (req, res) => {
  res.json({
    status: true,
    service: 'GocTruyenTranh Puppeteer Stealth Proxy',
    timestamp: new Date().toISOString(),
    sessionReady: Boolean(cookies.cf_clearance && cookies.usid && cookies.xtoken)
  });
});

app.get('/api/proxy/v2/search', async (req, res) => {
  const cacheKey = `search_${req.url}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (!process.env.COOKIE_OVERRIDE) {
    await solveCloudflareSession();
  }
  try {
    const apiRes = await axios.get(`${BASE_URL}/api/v2/search`, {
      params: req.query,
      headers: getHeaders(),
      timeout: 12000
    });
    setCache(cacheKey, apiRes.data);
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

app.get('/api/proxy/comic/:slug', async (req, res) => {
  const slug = req.params.slug;
  const cacheKey = `detail_${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (!process.env.COOKIE_OVERRIDE) {
    await solveCloudflareSession();
  }
  try {
    const apiRes = await axios.get(`${BASE_URL}/api/comic/${slug}`, {
      headers: getHeaders(),
      timeout: 12000
    });
    setCache(cacheKey, apiRes.data);
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

app.get('/api/proxy/comic/search', async (req, res) => {
  if (!process.env.COOKIE_OVERRIDE) {
    await solveCloudflareSession();
  }
  try {
    const apiRes = await axios.get(`${BASE_URL}/api/comic/search`, {
      params: req.query,
      headers: getHeaders(),
      timeout: 12000
    });
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

app.get('/api/proxy/comic/:id/chapter', async (req, res) => {
  const id = req.params.id;
  const cacheKey = `toc_${id}_${req.query.offset || 0}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (!process.env.COOKIE_OVERRIDE) {
    await solveCloudflareSession();
  }
  try {
    const apiRes = await axios.get(`${BASE_URL}/api/comic/${id}/chapter`, {
      params: req.query,
      headers: getHeaders(),
      timeout: 12000
    });
    setCache(cacheKey, apiRes.data);
    res.json(apiRes.data);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

app.post('/api/proxy/chapter/loadAll', async (req, res) => {
  const { comicId, chapterNumber, nameEn } = req.body;
  const cacheKey = `chap_${comicId}_${chapterNumber}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (!process.env.COOKIE_OVERRIDE) {
    await solveCloudflareSession();
  }
  try {
    const postData = new URLSearchParams({ comicId, chapterNumber, nameEn }).toString();
    const apiRes = await axios.post(`${BASE_URL}/api/chapter/loadAll`, postData, {
      headers: getHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }),
      timeout: 15000
    });

    let respData = apiRes.data;
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
  console.log(`GocTruyenTranh Puppeteer Stealth Proxy listening on port ${PORT}`);
});
