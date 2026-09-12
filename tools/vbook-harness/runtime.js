// Harness đo tốc độ nguồn VBook — mô phỏng core.js lấy từ chính vBook.apk
// (assets/composeResources/com.reader.resources/files/core.js).
//
// Http của VBook là ĐỒNG BỘ. Node thì không => chạy script nhiều vòng:
// vòng nào thiếu URL thì ném, harness tải về rồi chạy lại. Thời gian thật của
// một chặng = TỔNG thời gian các request nó gọi (vì app gọi tuần tự).

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cheerio = require('cheerio');
const crypto = require('crypto');

const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

// ── Jsoup shim (bám đúng surface của core.js) ──────────────────────────────
function makeEl($, node) {
  const el = {
    select(css) { return makeEls($, safeFind($, node, css)); },
    attr(name) { const v = $(node).attr(name); return v == null ? null : v; },
    attributes() { return $(node).attr() || {}; },
    text() { return norm($(node).text()); },
    html() { return $(node).html(); },
    outerHtml() { return $.html(node); },
    remove() { $(node).remove(); },
    toString() { return $.html(node); },
  };
  return el;
}
function safeFind($, node, css) {
  try { return $(node).find(css).toArray(); } catch (e) { return []; }
}
function makeEls($, arr) {
  return {
    length: arr.length,
    size() { return arr.length; },
    isEmpty() { return arr.length === 0; },
    get(i) { return makeEl($, arr[i]); },
    first() { return arr.length ? makeEl($, arr[0]) : null; },
    last() { return arr.length ? makeEl($, arr[arr.length - 1]) : null; },
    forEach(cb) { arr.forEach((n) => cb(makeEl($, n))); },
    map(cb) { return arr.map((n) => cb(makeEl($, n))); },
    select(css) {
      let out = [];
      for (const n of arr) out = out.concat(safeFind($, n, css));
      return makeEls($, out);
    },
    attr(name) { const v = arr.length ? $(arr[0]).attr(name) : null; return v == null ? null : v; },
    text() { return norm(arr.map((n) => $(n).text()).join(' ')); },
    html() { return arr.length ? $(arr[0]).html() : ''; },
    remove() { arr.forEach((n) => $(n).remove()); },
    toString() { return arr.map((n) => $.html(n)).join(''); },
  };
}
function makeDoc(html) {
  const $ = cheerio.load(html || '');
  return {
    select(css) { let a = []; try { a = $(css).toArray(); } catch (e) { a = []; } return makeEls($, a); },
    attr(n) { const v = $.root().attr(n); return v == null ? null : v; },
    text() { return norm($.root().text()); },
    html() { return $.html(); },
    outerHtml() { return $.html(); },
    remove() {},
    toString() { return $.html(); },
  };
}

// ── Bộ nhớ request + đo thời gian ──────────────────────────────────────────
class Net {
  constructor() {
    this.cache = new Map();      // key -> {status, headers, body, url}
    this.pending = new Set();    // key JSON chờ tải
    this.log = [];               // {key, url, method, ms, bytes, status}
    this.browserCalls = [];
    this.sleepMs = 0;
  }
  keyOf(url, opts) {
    // KHÔNG đưa headers vào khoá: tcomic ký request bằng timestamp nên headers
    // đổi mỗi vòng -> cache không bao giờ trúng -> chạy vô hạn.
    const o = opts || {};
    return JSON.stringify([o.method || 'GET', url, o.body || '', o.queries || null]);
  }
  headersFor(url, opts) { return (opts || {}).headers || null; }
  need(url, opts) {
    const k = this.keyOf(url, opts);
    if (this.cache.has(k)) return this.cache.get(k);
    // Chỉ khám phá ĐÚNG MỘT request mỗi vòng. Nếu cho phép nhiều, mọi try/catch
    // trong plugin sẽ tưởng request đầu hỏng rồi nhảy sang mirror -> đo ra
    // những request app thật không bao giờ gọi.
    if (!this.aborted) {
      this.pending.add(k);
      if (!this.hdrs) this.hdrs = new Map();
      this.hdrs.set(k, (opts || {}).headers || null);
      this.aborted = true;
    }
    throw new Error('__PRELOAD__');
  }
  async load(k, defaultHeaders, timeoutMs) {
    const [method, url, body, queries] = JSON.parse(k);
    const headers = this.hdrs && this.hdrs.get(k) || null;
    let full = url;
    if (queries && typeof queries === 'object') {
      const qs = Object.keys(queries).map((x) => encodeURIComponent(x) + '=' + encodeURIComponent(queries[x])).join('&');
      if (qs) full += (full.indexOf('?') >= 0 ? '&' : '?') + qs;
    }
    const h = Object.assign({}, defaultHeaders, headers || {});
    // OkHttp không gửi Accept-Encoding br mặc định; undici thì có. Giữ mặc định.
    const t0 = process.hrtime.bigint();
    let rec = { status: 0, headers: {}, body: '', url: full };
    let ms = 0, bytes = 0;
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs || 20000);
      const res = await fetch(full, {
        method, headers: h, body: body || undefined, redirect: 'follow', signal: ac.signal,
      });
      const buf = Buffer.from(await res.arrayBuffer());
      clearTimeout(timer);
      ms = Number(process.hrtime.bigint() - t0) / 1e6;
      bytes = buf.length;
      const hh = {};
      res.headers.forEach((v, kk) => { hh[kk] = v; });
      rec = { status: res.status, headers: hh, body: buf.toString('utf8'), url: res.url };
    } catch (e) {
      ms = Number(process.hrtime.bigint() - t0) / 1e6;
      rec = { status: 0, headers: {}, body: '', url: full, err: String(e.message || e) };
    }
    this.cache.set(k, rec);
    this.log.push({ url: full, method, ms, bytes, status: rec.status, err: rec.err });
    return rec;
  }
}

// ── Sandbox ────────────────────────────────────────────────────────────────
function buildContext(pluginDir, net) {
  const mkResponse = (rec) => ({
    get headers() { return rec.headers; },
    header: (k) => rec.headers[String(k).toLowerCase()] || null,
    get status() { return rec.status; },
    get statusText() { return ''; },
    get ok() { return rec.status >= 200 && rec.status < 300; },
    get url() { return rec.url; },
    get request() { return { headers: {}, url: rec.url }; },
    html: () => makeDoc(rec.body),
    text: () => rec.body,
    string: () => rec.body,
    json: () => JSON.parse(rec.body),
    base64: () => Buffer.from(rec.body, 'utf8').toString('base64'),
    blob: () => ({ _isBlob: true, base64: () => Buffer.from(rec.body).toString('base64') }),
    readLine: () => null,
  });

  const doFetch = (url, options) => {
    let o = options || {};
    if (typeof o === 'string') { try { o = JSON.parse(o); } catch (e) { o = {}; } }
    return mkResponse(net.need(url, o));
  };

  const chain = (url, method) => {
    const o = { method };
    const c = {
      headers(d) { o.headers = d; return c; },
      params(d) { o.queries = d; return c; },
      queries(d) { o.queries = d; return c; },
      body(d) { o.body = d; return c; },
      binary(d) { o.body = d; return c; },
      contentType() { return c; },
      timeout(t) { o.timeout = t; return c; },
      url() { return url; },
      string(cs) { return doFetch(url, o).text(cs); },
      text(cs) { return doFetch(url, o).text(cs); },
      html(cs) { return doFetch(url, o).html(cs); },
      json() { return doFetch(url, o).json(); },
      blob() { return doFetch(url, o).blob(); },
      execute() { return doFetch(url, o); },
    };
    return c;
  };

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    String, Number, Boolean, RegExp, Array, Object, Error, Math, Date, JSON, Map, Set,
    parseInt, parseFloat, isNaN, isFinite, decodeURI, encodeURI,
    decodeURIComponent, encodeURIComponent, escape, unescape,
    setTimeout: () => {}, clearTimeout: () => {},

    fetch: doFetch,
    Http: { get: (u) => chain(u, 'GET'), post: (u) => chain(u, 'POST') },
    Html: { parse: (h) => makeDoc(h) },
    Log: { log: () => {} },
    Console: { log: () => {} },
    Response: {
      success: (d, d2) => ({ ok: true, data: d, next: d2 === undefined ? null : d2 }),
      error: (m) => ({ ok: false, error: String(m) }),
    },
    Engine: {
      newBrowser() {
        net.browserCalls.push(new Error().stack.split('\n')[2] || '?');
        throw new Error('__BROWSER__');
      },
    },
    UserAgent: {
      system: () => 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36',
      chrome: () => 'Mozilla/5.0 Chrome/125.0.0.0',
      android: () => 'Mozilla/5.0 (Linux; Android 13)',
      ios: () => 'Mozilla/5.0 (iPhone)',
    },
    Crypto: {
      md5: (s) => crypto.createHash('md5').update(String(s)).digest('hex'),
      sha1: (s) => crypto.createHash('sha1').update(String(s)).digest('hex'),
      sha256: (s) => crypto.createHash('sha256').update(String(s)).digest('hex'),
      sha512: (s) => crypto.createHash('sha512').update(String(s)).digest('hex'),
      base64Encode: (s) => Buffer.from(String(s), 'utf8').toString('base64'),
      base64Decode: (s) => Buffer.from(String(s), 'base64').toString('utf8'),
      hmacSha256: (s, k) => crypto.createHmac('sha256', String(k)).update(String(s)).digest('hex'),
      hmacMd5: (s, k) => crypto.createHmac('md5', String(k)).update(String(s)).digest('hex'),
      aesDecrypt: () => { throw new Error('__CRYPTO_AES__'); },
      aesEncrypt: () => { throw new Error('__CRYPTO_AES__'); },
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
    cacheStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
    localCookie: { getCookie: () => '', setCookie: () => {} },
    localConfig: { getItem: () => null },
    localBook: { getInfo: () => null, getTableOfContent: () => [], getChapterContent: () => null },
    sleep: (t) => { net.sleepMs += Number(t) || 0; },
  };
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);
  sandbox.load = function (file) {
    vm.runInContext(fs.readFileSync(path.join(pluginDir, file), 'utf8'), ctx, { filename: file });
  };
  return ctx;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.5',
};

// Chạy 1 script, trả {out, stats}
async function runScript(pluginDir, file, args, opts) {
  opts = opts || {};
  const net = opts.net || new Net();
  const before = net.log.length;
  let out = null, err = null;
  for (let round = 0; round < 200; round++) {
    net.pending.clear();
    net.aborted = false;
    try {
      const ctx = buildContext(pluginDir, net);
      vm.runInContext(fs.readFileSync(path.join(pluginDir, file), 'utf8'), ctx, { filename: file });
      out = vm.runInContext('execute', ctx).apply(null, args);
      err = null;
    } catch (e) {
      err = e;
      out = null;
    }
    if (net.pending.size === 0) break;
    for (const k of Array.from(net.pending)) await net.load(k, DEFAULT_HEADERS, opts.timeoutMs);
    err = null;
  }
  const reqs = net.log.slice(before);
  return {
    out, err,
    net,
    reqs,
    reqCount: reqs.length,
    netMs: reqs.reduce((a, b) => a + b.ms, 0),
    bytes: reqs.reduce((a, b) => a + b.bytes, 0),
    browser: net.browserCalls.length,
  };
}

module.exports = { runScript, Net, makeDoc, DEFAULT_HEADERS };
