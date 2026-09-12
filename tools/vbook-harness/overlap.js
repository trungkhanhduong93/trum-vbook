// So trùng catalog giữa các nguồn: lấy trang 1 "Mới cập nhật" của từng nguồn,
// chuẩn hoá tên truyện rồi tính giao nhau. Kèm host ảnh chương của 1 truyện.
const path = require('path'); const fs = require('fs');
const { runScript, Net } = require('./runtime');
const REPO = path.join(__dirname, '..', '..');
function srcDir(n) { const a = path.join(REPO, n, 'src', 'src');
  return fs.existsSync(path.join(a, 'config.js')) ? a : path.join(REPO, n, 'src'); }

const SRC = process.argv.slice(2);
const norm = (s) => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  .replace(/^truyen tranh /, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const data = {};
  for (const s of SRC) {
    try {
      const DIR = srcDir(s); const net = new Net();
      const home = await runScript(DIR, 'home.js', [], { net });
      const cat = home.out.data[0];
      const gen = await runScript(DIR, cat.script || 'gen.js', [cat.input, 1], { net });
      const items = (gen.out && gen.out.ok) ? gen.out.data : [];
      // host ảnh: lấy chương của truyện đầu
      let imgHost = '', nimg = 0;
      try {
        const toc = await runScript(DIR, 'toc.js', [items[0].link], { net });
        const ch = toc.out.data[Math.min(1, toc.out.data.length - 1)];
        const chap = await runScript(DIR, 'chap.js', [ch.url], { net });
        if (chap.out && chap.out.ok) {
          nimg = chap.out.data.length;
          imgHost = (String(chap.out.data[0]).match(/^https?:\/\/([^/]+)/) || ['', ''])[1];
        }
      } catch (e) {}
      data[s] = { names: items.map((x) => norm(x.name)).filter(Boolean), imgHost, nimg,
                  first: items[0] ? items[0].name : '' };
      console.log('%-15s %3d truyen | anh: %s (%d)', s, data[s].names.length, imgHost || '-', nimg);
    } catch (e) { console.log('%-15s LOI %s', s, e.message); data[s] = { names: [], imgHost: '', nimg: 0 }; }
  }
  console.log('\n=== TRUNG CATALOG (trang 1 "Moi cap nhat") ===');
  const ks = Object.keys(data).filter((k) => data[k].names.length);
  process.stdout.write('               ' + ks.map((k) => k.slice(0, 7).padStart(8)).join('') + '\n');
  for (const a of ks) {
    const A = new Set(data[a].names);
    let row = a.padEnd(15);
    for (const b of ks) {
      if (a === b) { row += '       -'; continue; }
      const B = new Set(data[b].names);
      const inter = [...A].filter((x) => B.has(x)).length;
      row += String(Math.round(inter * 100 / A.size) + '%').padStart(8);
    }
    console.log(row);
  }
  fs.writeFileSync('overlap.json', JSON.stringify(data, null, 1));
})();
