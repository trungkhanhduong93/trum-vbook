// ============================================================
// Vercel Serverless Function — giải xáo trộn ảnh Cứu Truyện.
//
// Đây là bản ĐANG KHUYẾN NGHỊ. Cloudflare Workers gói miễn phí không chạy nổi:
// đo 12/09/2026 thì đến ảnh thứ 4 là dính "error code: 1102 — exceeded CPU
// time limit", kể cả khi tải tuần tự từng ảnh một. Chi tiết trong README.
//
// GET /?p=<duong-dan-anh>&d=<drm_data>[&q=85][&w=0]
// ============================================================

'use strict';

const { handle } = require('../descramble.js');

module.exports = async (req, res) => {
    const q = {};
    try {
        const u = new URL(req.url, 'http://x');
        u.searchParams.forEach((v, k) => { q[k] = v; });
    } catch (e) { /* để rỗng, handle() sẽ báo thiếu tham số */ }

    // Không tham số nào: trang kiểm tra sống, tiện dán vào trình duyệt.
    if (!q.p && !q.url && !q.u) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 200;
        return res.end('CuuTruyen descrambler dang chay.\n'
            + 'Cach goi: /?p=/file/cuutruyen/uploads/page/<id>/image/scrambled-<hash>.jpg&d=<drm_data>\n');
    }

    try {
        const out = await handle(q);
        res.setHeader('Content-Type', out.contentType);
        res.setHeader('Content-Length', String(out.buf.length));
        // Ảnh đã giải không bao giờ đổi -> cache vĩnh viễn ở CDN.
        // Lần đọc thứ hai của cùng một chương không đụng tới hàm nữa.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Descrambler', out.engine);
        res.statusCode = 200;
        return res.end(out.buf);
    } catch (err) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = err.status || 500;
        return res.end('Loi: ' + (err.message || String(err)));
    }
};
