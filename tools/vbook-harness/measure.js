// Đo tốc độ 1 nguồn: home -> gen -> detail -> toc -> chap -> ảnh
// Dùng: node measure.js <ten-nguon> [json-out]
const path = require('path');
const fs = require('fs');
const { runScript, Net } = require('./runtime');

const REPO = path.join(__dirname, '..', '..');
const name = process.argv[2];
const outFile = process.argv[3];

function srcDir(n) {
  const a = path.join(REPO, n, 'src', 'src');
  return fs.existsSync(path.join(a, 'config.js')) ? a : path.join(REPO, n, 'src');
}

const IMG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};
let REFERER = '';

async function timeImage(url, timeoutMs) {
  // Đo 2 lần: URL trần (đúng thứ app nhận được) và có Referer (kiểu trình duyệt).
  const bare = await timeImageWith(url, IMG_HEADERS, timeoutMs);
  if (bare.ok || !REFERER) return bare;
  const withRef = await timeImageWith(url, Object.assign({ Referer: REFERER }, IMG_HEADERS), timeoutMs);
  withRef.neededReferer = withRef.ok;
  withRef.bareStatus = bare.status;
  return withRef;
}

async function timeImageWith(url, H, timeoutMs) {
  const t0 = process.hrtime.bigint();
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs || 25000);
    const res = await fetch(url, { headers: H, signal: ac.signal, redirect: 'follow' });
    const reader = res.body.getReader();
    let first = null, total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (first === null) first = Number(process.hrtime.bigint() - t0) / 1e6;
      total += value.length;
    }
    clearTimeout(timer);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    return { url, ok: res.status >= 200 && res.status < 300, status: res.status, ttfb: first, ms, bytes: total,
             type: res.headers.get('content-type') || '' };
  } catch (e) {
    return { url, ok: false, status: 0, ms: Number(process.hrtime.bigint() - t0) / 1e6, bytes: 0, err: String(e.message || e) };
  }
}

(async () => {
  const DIR = srcDir(name);
  const R = { source: name, stages: {}, notes: [] };
  const net = new Net();
  const T = async (label, file, args) => {
    const t0 = Date.now();
    const r = await runScript(DIR, file, args, { net, timeoutMs: 20000 });
    R.stages[label] = {
      reqs: r.reqCount, netMs: Math.round(r.netMs), bytes: r.bytes,
      wall: Date.now() - t0,
      browser: r.browser,
      err: r.err ? String(r.err.message || r.err).slice(0, 160) : null,
      ok: !!(r.out && r.out.ok),
      urls: r.reqs.map((x) => ({ u: x.url.slice(0, 120), ms: Math.round(x.ms), b: x.bytes, s: x.status })),
    };
    return r;
  };

  try {
    // 1. HOME
    const home = await T('home', 'home.js', []);
    if (!home.out || !home.out.ok || !home.out.data.length) throw new Error('home rong: ' + JSON.stringify(home.out).slice(0, 120));
    const cat = home.out.data[0];

    // 2. GEN trang 1
    const genScript = cat.script || 'gen.js';
    const gen = await T('gen', genScript, [cat.input, 1]);
    if (!gen.out || !gen.out.ok || !gen.out.data.length) throw new Error('gen rong');
    const item = gen.out.data[0];
    R.sample = { cat: cat.title, book: item.name, link: item.link, cover: item.cover };
    try { const m = String(item.host || item.link).match(/^https?:\/\/[^/]+/); REFERER = m ? m[0] + '/' : ''; } catch (e) {}
    R.referer = REFERER;

    // 3. DETAIL
    await T('detail', 'detail.js', [item.link]);

    // 4. TOC
    const toc = await T('toc', 'toc.js', [item.link]);
    if (!toc.out || !toc.out.ok || !toc.out.data.length) throw new Error('toc rong');
    R.chapters = toc.out.data.length;
    const mid = toc.out.data[Math.min(1, toc.out.data.length - 1)];
    R.sample.chapter = mid.name;

    // 5. CHAP
    const chap = await T('chap', 'chap.js', [mid.url]);
    const imgs = (chap.out && chap.out.ok) ? chap.out.data : [];
    R.imageCount = imgs.length;
    R.imageSample = imgs.slice(0, 3);

    // 6. ẢNH: đo 5 ảnh đầu tuần tự (giống app tải lần lượt khi cuộn)
    const probe = imgs.slice(0, 5);
    const res = [];
    for (const u of probe) res.push(await timeImage(u));
    R.images = res.map((x) => ({ ok: x.ok, status: x.status, ttfb: Math.round(x.ttfb || 0), ms: Math.round(x.ms), kb: Math.round(x.bytes / 1024), type: x.type, err: x.err, needRef: !!x.neededReferer, bareStatus: x.bareStatus }));
    R.needReferer = res.filter((x) => x.neededReferer).length;
    const good = res.filter((x) => x.ok && x.bytes > 0);
    R.imgOk = good.length;
    R.imgAvgMs = good.length ? Math.round(good.reduce((a, b) => a + b.ms, 0) / good.length) : null;
    R.imgAvgKb = good.length ? Math.round(good.reduce((a, b) => a + b.bytes, 0) / good.length / 1024) : null;
    R.chapterEstMb = (good.length && imgs.length) ? +(good.reduce((a, b) => a + b.bytes, 0) / good.length * imgs.length / 1048576).toFixed(2) : null;

    // 7. Ảnh bìa danh sách (ảnh hiện đầu tiên khi mở nguồn)
    if (item.cover) {
      const c = await timeImage(item.cover);
      R.cover = { ok: c.ok, status: c.status, ms: Math.round(c.ms), kb: Math.round(c.bytes / 1024) };
    }
  } catch (e) {
    R.fatal = String(e.message || e).slice(0, 300);
  }

  const s = JSON.stringify(R, null, 1);
  if (outFile) fs.writeFileSync(outFile, s);
  console.log(s);
})();
