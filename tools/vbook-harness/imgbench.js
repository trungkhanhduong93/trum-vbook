// Đo thời gian tải ảnh 1 chương ở 1 luồng vs 4 luồng (đúng dải "Kết nối song song" của vBook).
// Lấy 12 ảnh đầu để không đốt băng thông; suy ra cả chương theo tỉ lệ.
const path = require('path'); const fs = require('fs');
const { runScript, Net } = require('./runtime');
const REPO = path.join(__dirname, '..', '..');
const name = process.argv[2];
const N = parseInt(process.argv[3] || '12', 10);
function srcDir(n) { const a = path.join(REPO, n, 'src', 'src');
  return fs.existsSync(path.join(a, 'config.js')) ? a : path.join(REPO, n, 'src'); }

async function get(url, ref) {
  const h = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' };
  if (ref) h.Referer = ref;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: h, redirect: 'follow' });
    const b = Buffer.from(await res.arrayBuffer());
    return { ok: res.status === 200, bytes: b.length, ms: Date.now() - t0, status: res.status };
  } catch (e) { return { ok: false, bytes: 0, ms: Date.now() - t0, status: 0 }; }
}

async function run(urls, conc, ref) {
  const t0 = Date.now(); let bytes = 0, ok = 0; let i = 0;
  const worker = async () => { while (i < urls.length) { const k = i++; const r = await get(urls[k], ref); bytes += r.bytes; if (r.ok) ok++; } };
  await Promise.all(Array.from({ length: conc }, worker));
  return { ms: Date.now() - t0, mb: +(bytes / 1048576).toFixed(2), ok };
}

(async () => {
  const DIR = srcDir(name); const net = new Net();
  const home = await runScript(DIR, 'home.js', [], { net });
  const cat = home.out.data[0];
  const gen = await runScript(DIR, cat.script || 'gen.js', [cat.input, 1], { net });
  const item = gen.out.data[0];
  const ref = (String(item.host || item.link).match(/^https?:\/\/[^/]+/) || [''])[0] + '/';
  const toc = await runScript(DIR, 'toc.js', [item.link], { net });
  const ch = toc.out.data[Math.min(1, toc.out.data.length - 1)];
  const chap = await runScript(DIR, 'chap.js', [ch.url], { net });
  if (!chap.out || !chap.out.ok) { console.log(name + ': chap loi'); return; }
  const all = chap.out.data;
  // Hai tập ảnh RỜI NHAU để lần đo sau không ăn ké cache của lần trước.
  const setA = all.slice(0, N);
  const setB = all.slice(N, N * 2).length === N ? all.slice(N, N * 2) : all.slice(0, N);
  const s1 = await run(setB, 1, ref);   // đo 1 luồng trên tập B (nguội)
  const s4 = await run(setA, 4, ref);   // đo 4 luồng trên tập A (nguội)
  const urls = setA;
  const scale = all.length / urls.length;
  console.log('%s | %d anh/chuong | %d anh do', name.padEnd(15), all.length, urls.length);
  console.log('   1 luong: %ss  %sMB  ok=%d/%d  -> ca chuong ~%ss',
    (s1.ms / 1000).toFixed(1), s1.mb, s1.ok, urls.length, (s1.ms * scale / 1000).toFixed(0));
  console.log('   4 luong: %ss  %sMB  ok=%d/%d  -> ca chuong ~%ss  (nhanh gap %sx)',
    (s4.ms / 1000).toFixed(1), s4.mb, s4.ok, urls.length, (s4.ms * scale / 1000).toFixed(0), (s1.ms / s4.ms).toFixed(1));
})().catch((e) => console.log(name + ' LOI: ' + e.message));
