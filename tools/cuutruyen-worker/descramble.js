// ============================================================
// descramble.js — lõi giải xáo trộn ảnh Cứu Truyện (DRM v4)
//
// Dùng chung cho cả 3 vỏ: api/index.js (Vercel), server.js (VPS/Render),
// worker.js (Cloudflare — CHỈ chạy nổi trên gói trả phí, xem README).
//
// Ảnh gốc trên CDN bị cắt thành dải ngang rồi đảo thứ tự. Mỗi trang kèm chuỗi
// drm_data = base64( XOR( "#v4|dy-h|dy-h|...", "3141592653589793" ) ).
// Dải thứ i ĐẾM TỪ TRÊN XUỐNG của ảnh tải về phải đặt vào toạ độ y = dy_i của
// ảnh đúng. Chiều ngược lại ra ảnh vỡ khung — đã dựng thử cả hai chiều rồi nhìn.
// ============================================================

'use strict';

const DRM_KEY = '3141592653589793';

// Chỉ nhận đường dẫn ảnh của chính Cứu Truyện. Không có danh sách này thì đây là
// một open proxy: ai cũng bơm được URL bất kỳ vào và ăn hết hạn mức của Trum.
const ALLOWED_HOSTS = [
    'storage-bravo.cuutruyen.net',
    'storage-ct.lrclib.net',
    'storage-ct-riften.site'
];

// Gương ảnh, xếp theo thứ tự thử. API luôn ghi lrclib nhưng tên miền đó đã
// NXDOMAIN; web thật tự dò và chọn bravo.
const MIRRORS = [
    'https://storage-bravo.cuutruyen.net',
    'https://storage-ct.lrclib.net',
    'https://storage-ct-riften.site'
];

const FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://www.cuutruyen.net/',
    'Accept': 'image/avif,image/webp,image/jpeg,*/*'
};

// ─── Giải chuỗi DRM ────────────────────────────────────────────────────
function decodeDrm(drmBase64) {
    if (!drmBase64) return null;
    const clean = String(drmBase64).replace(/\s/g, '');
    let raw;
    try {
        raw = Buffer.from(clean, 'base64');
    } catch (e) {
        return null;
    }
    let layout = '';
    for (let i = 0; i < raw.length; i++) {
        layout += String.fromCharCode(raw[i] ^ DRM_KEY.charCodeAt(i % DRM_KEY.length));
    }
    if (layout.indexOf('#v4|') !== 0) return null;

    const bands = [];
    for (const seg of layout.substring(4).split('|')) {
        const parts = seg.split('-');
        if (parts.length !== 2) continue;
        const dy = parseInt(parts[0], 10);
        const h = parseInt(parts[1], 10);
        if (isNaN(dy) || isNaN(h) || h <= 0 || dy < 0) continue;
        bands.push({ dy: dy, h: h });
    }
    return bands.length ? bands : null;
}

// Dải vốn đã đúng thứ tự thì khỏi vẽ lại.
function isIdentity(bands) {
    let y = 0;
    for (const b of bands) {
        if (b.dy !== y) return false;
        y += b.h;
    }
    return true;
}

// ─── Chuẩn hoá đường dẫn ảnh ───────────────────────────────────────────
// Nhận cả hai kiểu tham số:
//   ?p=/file/cuutruyen/uploads/page/.../scrambled-xxx.jpg   (gọn, plugin dùng cái này)
//   ?url=https://storage-bravo.cuutruyen.net/file/...       (kiểu cũ, giữ tương thích)
function toPath(p, fullUrl) {
    if (p) {
        const s = String(p);
        return s.charAt(0) === '/' ? s : '/' + s;
    }
    if (!fullUrl) return null;
    let u;
    try {
        u = new URL(String(fullUrl));
    } catch (e) {
        return null;
    }
    if (ALLOWED_HOSTS.indexOf(u.hostname) < 0) return null;
    return u.pathname + (u.search || '');
}

// ─── Tải ảnh gốc ───────────────────────────────────────────────────────
// Gương chính (bravo) thỉnh thoảng rớt một request giữa chừng, nên thử nó HAI
// lần trước khi đụng tới hai gương kia — hai gương kia phần lớn thời gian là
// chết, đi tới đó chỉ tổ mất thêm mấy giây.
const ATTEMPTS = [MIRRORS[0], MIRRORS[0]].concat(MIRRORS.slice(1));
const FETCH_TIMEOUT = 8000;

async function fetchSource(path, timeoutMs) {
    let lastErr = 'khong ro';
    for (let i = 0; i < ATTEMPTS.length; i++) {
        const base = ATTEMPTS[i];
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs || FETCH_TIMEOUT);
        try {
            const r = await fetch(base + path, { headers: FETCH_HEADERS, signal: ctrl.signal });
            if (!r.ok) { lastErr = base + ' -> HTTP ' + r.status; continue; }
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length < 1024) { lastErr = base + ' -> chi ' + buf.length + ' byte'; continue; }
            return buf;
        } catch (e) {
            lastErr = base + ' -> ' + (e.name === 'AbortError' ? 'qua han' : (e.message || e));
        } finally {
            clearTimeout(timer);
        }
    }
    const err = new Error('Khong tai duoc anh goc: ' + lastErr);
    err.status = 502;
    throw err;
}

// ─── Hoán vị dải ───────────────────────────────────────────────────────
// Chạy trên pixel thô nên chỉ là chép từng khối dòng, gần như không tốn CPU.
// Toàn bộ chi phí nằm ở giải nén và nén lại JPEG.
function permute(pixels, width, height, channels, bands) {
    const rowBytes = width * channels;
    const out = Buffer.alloc(pixels.length);
    let sy = 0;
    for (const b of bands) {
        const from = sy * rowBytes;
        const to = b.dy * rowBytes;
        const len = b.h * rowBytes;
        if (from + len <= pixels.length && to + len <= out.length) {
            pixels.copy(out, to, from, from + len);
        }
        sy += b.h;
    }
    // Ảnh cao hơn tổng chiều cao các dải thì phần đuôi bê nguyên sang.
    const tail = sy * rowBytes;
    if (tail < pixels.length) pixels.copy(out, tail, tail);
    return out;
}

// ─── Bộ nén: sharp nếu có, không thì jpeg-js ───────────────────────────
let sharp = null;
try { sharp = require('sharp'); } catch (e) { /* chưa cài thì rơi về jpeg-js */ }

async function processWithSharp(src, bands, quality, maxWidth) {
    const { data, info } = await sharp(src, { failOn: 'none', limitInputPixels: 268402689 })
        .raw().toBuffer({ resolveWithObject: true });
    const fixed = bands.length ? permute(data, info.width, info.height, info.channels, bands) : data;

    let out = sharp(fixed, {
        raw: { width: info.width, height: info.height, channels: info.channels }
    });
    if (maxWidth && info.width > maxWidth) {
        out = out.resize({ width: maxWidth, kernel: 'lanczos3' });
    }
    return {
        buf: await out.jpeg({ quality: quality, chromaSubsampling: '4:2:0' }).toBuffer(),
        engine: 'sharp'
    };
}

async function processWithJpegJs(src, bands, quality) {
    const jpeg = require('jpeg-js');
    const dec = jpeg.decode(src, { useTArray: true, maxMemoryUsageInMB: 512 });
    const px = Buffer.from(dec.data.buffer, dec.data.byteOffset, dec.data.length);
    const fixed = permute(px, dec.width, dec.height, 4, bands);
    const enc = jpeg.encode({ data: fixed, width: dec.width, height: dec.height }, quality);
    return { buf: Buffer.from(enc.data), engine: 'jpeg-js' };
}

// ─── Hàm chính ─────────────────────────────────────────────────────────
// query: { p | url, d | drm, q, w }
// Trả { buf, contentType, engine }; lỗi thì ném Error có .status
async function handle(query) {
    const path = toPath(query.p, query.url || query.u);
    if (!path) {
        const err = new Error('Thieu tham so p= (duong dan anh), hoac url= khong thuoc CDN Cuu Truyen');
        err.status = 400;
        throw err;
    }

    const quality = Math.min(95, Math.max(40, parseInt(query.q, 10) || 85));
    const maxWidth = parseInt(query.w, 10) || 0;
    const bands = decodeDrm(query.d || query.drm);

    const src = await fetchSource(path);

    // Không xáo trộn và không cần thu nhỏ: trả nguyên byte gốc.
    // Không giải nén lại thì không mất chất lượng và không tốn CPU.
    if ((!bands || isIdentity(bands)) && !maxWidth) {
        return { buf: src, contentType: 'image/jpeg', engine: 'passthrough' };
    }

    const r = sharp
        ? await processWithSharp(src, bands || [], quality, maxWidth)
        : await processWithJpegJs(src, bands || [], quality);
    return { buf: r.buf, contentType: 'image/jpeg', engine: r.engine };
}

module.exports = { handle, decodeDrm, isIdentity, permute, MIRRORS, ALLOWED_HOSTS };
