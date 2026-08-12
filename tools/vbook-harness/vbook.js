// Harness chạy thật script plugin Vbook trên Node, dựng bằng cheerio để giả lập Rhino + Jsoup.
//
// Dùng khi máy không có Java (không dựng được Rhino thật). Nó xác nhận LOGIC PARSE trên HTML
// sống của site — KHÔNG xác nhận được cú pháp Rhino, .parent()/selectFirst(), hay việc ảnh có
// tải nổi trên mạng di động hay không. Đọc docs/03-bay-da-tra-gia.md mục 16 trước khi kết luận.
//
// Cài: npm install   (trong thư mục này)
// Dùng: xem run-template.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cheerio = require('cheerio');

const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

// ── Giả lập Jsoup ──────────────────────────────────────────────────────────
// Cố ý KHÔNG cài .parent(): Vbook ném TypeError ở hàm đó, harness phải vỡ theo
// để lỗi lộ ra ngay trên máy dev thay vì lộ ra trên điện thoại người dùng.
function makeEl($, node) {
  return {
    select(css) { return makeEls($, $(node).find(css).toArray()); },
    attr(name) { const v = $(node).attr(name); return v == null ? null : v; },
    text() { return norm($(node).text()); },
    html() { return $(node).html(); },
    outerHtml() { return $.html(node); }
  };
}

function makeEls($, arr) {
  return {
    size() { return arr.length; },
    get(i) { return makeEl($, arr[i]); },
    first() { return arr.length ? makeEl($, arr[0]) : null; },
    text() { return norm(arr.map((n) => $(n).text()).join(' ')); }
  };
}

function makeDoc(html) {
  const $ = cheerio.load(html);
  return {
    select(css) { return makeEls($, $(css).toArray()); },
    text() { return norm($.root().text()); }
  };
}

// ── Http đồng bộ giả lập ───────────────────────────────────────────────────
// Http của Vbook đồng bộ, fetch của Node thì không. Cách giải: chạy script, gom URL nó
// đòi, tải về, chạy lại — lặp tới khi không còn URL thiếu.
const cache = new Map();
const pending = new Set();
const state = { browserCalled: false };

async function preload(url, headers) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url, { headers, redirect: 'follow' });
  const text = await res.text();
  cache.set(url, text);
  return text;
}

function buildContext(pluginDir, log) {
  const sandbox = {
    console, String, RegExp, parseInt, parseFloat, Math, Date, JSON,
    encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,

    Http: {
      get(url) { return chainFor(url, log); },
      post(url) { return chainFor(url, log); }
    },

    Html: { parse(html) { return makeDoc(html); } },

    Engine: {
      newBrowser() {
        state.browserCalled = true;
        throw new Error('Engine.newBrowser() duoc goi — harness khong chay browser');
      }
    },

    Response: {
      success(data, next) { return { ok: true, data: data, next: next === undefined ? null : next }; },
      error(msg) { return { ok: false, error: msg }; }
    }
  };

  sandbox.load = function (file) {
    vm.runInContext(fs.readFileSync(path.join(pluginDir, file), 'utf8'), ctx, { filename: file });
  };

  const ctx = vm.createContext(sandbox);
  return ctx;
}

function chainFor(url, log) {
  const chain = {
    headers() { return chain; },
    body() { return chain; },
    contentType() { return chain; },
    html() { return makeDoc(need(url, log)); },
    string() { return need(url, log); },
    json() { return JSON.parse(need(url, log)); }
  };
  return chain;
}

function need(url, log) {
  if (!cache.has(url)) { pending.add(url); throw new Error('CHUA PRELOAD: ' + url); }
  if (log) log('GET ' + url);
  return cache.get(url);
}

// ── Chạy một script plugin ─────────────────────────────────────────────────
function runOnce(pluginDir, file, args, log) {
  const ctx = buildContext(pluginDir, log);
  vm.runInContext(fs.readFileSync(path.join(pluginDir, file), 'utf8'), ctx, { filename: file });
  return vm.runInContext('execute', ctx).apply(null, args);
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.5'
};

async function runScript(pluginDir, file, args, opts) {
  opts = opts || {};
  const headers = opts.headers || DEFAULT_HEADERS;
  for (let round = 0; round < 6; round++) {
    pending.clear();
    state.browserCalled = false;
    const out = runOnce(pluginDir, file, args, opts.log);
    if (pending.size === 0) return { out: out, browserCalled: state.browserCalled };
    for (const u of Array.from(pending)) await preload(u, headers);
  }
  throw new Error('Qua nhieu vong preload cho ' + file + ' — script co the dang goi URL dong vo han');
}

module.exports = { runScript, preload, makeDoc, cache, state, DEFAULT_HEADERS };
