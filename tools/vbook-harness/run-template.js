// Bộ 9 ca kiểm bắt buộc cho một nguồn Vbook.
// Sửa 3 hằng số dưới rồi chạy:  node run-template.js
//
// Mọi ca đều gọi ra site thật — chạy mất 1-3 phút là bình thường.

const path = require('path');
const { runScript } = require('./vbook');

// ─── Sửa 3 dòng này ────────────────────────────────────────────────────────
const PLUGIN = 'cuutruyen';                              // tên thư mục nguồn
const LIST_URL = 'https://cuutruyen.cc/newest';          // một URL danh sách có phân trang
const KEYWORD = 'one piece';                             // từ khoá tìm kiếm có thật
// ───────────────────────────────────────────────────────────────────────────

const DIR = path.join(__dirname, '..', '..', PLUGIN, 'src');
const NONSENSE = 'zzzzkhongcotruyennao';
let fail = 0;
const check = (dieuKien, nhan) => {
  console.log((dieuKien ? '  OK   ' : '  FAIL ') + nhan);
  if (!dieuKien) fail++;
};

(async () => {
  // 1. Home — mọi mục phải ra truyện
  const home = await runScript(DIR, 'home.js', []);
  console.log('\n[1] HOME:', home.out.data.length, 'muc');
  for (const m of home.out.data) {
    const r = await runScript(DIR, 'gen.js', [m.input, 1]);
    check(r.out.data.length > 0, `${m.title} -> ${r.out.data.length} truyen`);
  }

  // 2. Trang 1 vs trang 2 phải khác nhau
  const p1 = await runScript(DIR, 'gen.js', [LIST_URL, 1]);
  const p2 = await runScript(DIR, 'gen.js', [LIST_URL, 2]);
  const trung = p1.out.data.filter((a) => p2.out.data.some((b) => b.link === a.link)).length;
  console.log('\n[2] PHAN TRANG');
  check(p1.out.data.length > 0 && p2.out.data.length > 0, `p1=${p1.out.data.length} p2=${p2.out.data.length}`);
  check(trung === 0, `trung giua p1 va p2: ${trung}`);
  check(!!p1.out.next, `next cua p1 = ${p1.out.next}`);
  const item = p1.out.data[0];
  check(!!(item.name && item.link && item.cover && item.host), 'card du name/link/cover/host');

  // 3. Trang cuối phải trả next = null
  console.log('\n[3] TRANG CUOI');
  let page = 1, last = null;
  while (page < 30) {
    const r = await runScript(DIR, 'gen.js', [LIST_URL, page]);
    last = r.out;
    if (!r.out.next) break;
    page = parseInt(r.out.next, 10);
  }
  check(last.next === null || last.next === '', `dung o trang ${page}, next=${last.next}`);

  // 4-5. Tìm kiếm
  const s = await runScript(DIR, 'search.js', [KEYWORD, 1]);
  const s0 = await runScript(DIR, 'search.js', [NONSENSE, 1]);
  const sv = await runScript(DIR, 'search.js', ['thế giới', 1]);
  console.log('\n[4-5] TIM KIEM');
  check(s.out.data.length > 0, `"${KEYWORD}" -> ${s.out.data.length} ket qua`);
  check(s0.out.data.length === 0, `tu khoa vo nghia -> ${s0.out.data.length} ket qua (phai la 0)`);
  check(sv.out.data.length > 0, `tieng Viet co dau -> ${sv.out.data.length} ket qua`);

  // 6. Chi tiết
  const target = p1.out.data[0].link;
  const d = await runScript(DIR, 'detail.js', [target]);
  console.log('\n[6] CHI TIET:', target);
  check(d.out.ok, 'tra ve thanh cong');
  if (d.out.ok) {
    check(!!d.out.data.name, 'ten: ' + d.out.data.name);
    check(!!d.out.data.cover, 'co anh bia');
    check(!!d.out.data.description, 'co mo ta (' + String(d.out.data.description).length + ' ky tu)');
    check(d.out.data.genres.length > 0, 'the loai: ' + d.out.data.genres.length);
  }

  // 7. Mục lục
  const t = await runScript(DIR, 'toc.js', [target]);
  console.log('\n[7] MUC LUC');
  check(t.out.ok, t.out.ok ? t.out.data.length + ' chuong' : 'LOI: ' + t.out.error);
  if (t.out.ok) {
    const urls = t.out.data.map((c) => c.url);
    check(new Set(urls).size === urls.length, 'khong trung URL');
    check(t.out.data.every((c) => c.name && c.url && c.host), 'chuong nao cung du name/url/host');
    console.log('       dau :', t.out.data[0].name);
    console.log('       cuoi:', t.out.data[t.out.data.length - 1].name);
    console.log('       ^ kiem bang mat: chuong DAU phai la chuong so nho nhat');
  }

  // 8. Ảnh chương — đầu / giữa / cuối
  if (t.out.ok) {
    console.log('\n[8] ANH CHUONG');
    const moc = [0, Math.floor(t.out.data.length / 2), t.out.data.length - 1];
    for (const i of moc) {
      const c = await runScript(DIR, 'chap.js', [t.out.data[i].url]);
      if (!c.out.ok) { check(false, `${t.out.data[i].name}: ${c.out.error}`); continue; }
      const imgs = c.out.data;
      check(imgs.length > 0, `${t.out.data[i].name} -> ${imgs.length} anh`);
      check(new Set(imgs).size === imgs.length, '  khong trung anh');
      check(imgs.every((u) => u.indexOf('|Referer') < 0), '  khong noi |Referer vao URL anh');
      check(imgs.every((u) => u.indexOf('http') === 0), '  URL tuyet doi');
    }
  }

  // 9. URL không tồn tại — phải báo lỗi tử tế, không ném exception
  console.log('\n[9] URL KHONG TON TAI');
  try {
    const bad = await runScript(DIR, 'detail.js', [LIST_URL.replace(/\/[^/]*$/, '/khong-ton-tai-xyz')]);
    check(!bad.out.ok || !bad.out.data.name, 'bao loi tu te: ' + JSON.stringify(bad.out).slice(0, 90));
  } catch (e) {
    check(false, 'NEM EXCEPTION: ' + e.message.slice(0, 90));
  }

  console.log(fail === 0 ? '\n=== TAT CA PASS ===' : `\n=== ${fail} CA FAIL ===`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('HARNESS LOI:', e); process.exit(1); });
