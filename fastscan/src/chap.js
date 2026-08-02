load("config.js");

// ─── Nén ảnh qua wsrv.nl ────────────────────────────────────────────────────
// Ảnh gốc nằm trên Backblaze B2 sau Cloudflare, không có bản webp/avif, không
// content-negotiation, không host dự phòng. Chỉ còn cách đổi codec.
//
// KHÔNG thu nhỏ ảnh. Ảnh gốc vốn chỉ rộng 800-900px, mà màn hình điện thoại
// ~1080px — v8 thu về 720px nên bị kéo giãn, nhìn thấy mờ rõ. w=900 kèm we
// (không phóng to) khiến mọi ảnh thường GIỮ NGUYÊN kích thước gốc: chỉ nén lại
// bằng WebP, không hề resample. Độ nét đến từ ĐỘ PHÂN GIẢI chứ không phải mức
// nén, nên hạ q xuống 62 vẫn sắc nét y hệt gốc khi dán lên 1080px, mà còn
// 40-56% dung lượng (q75 thì 46-65%).
//
// h=16000&fit=inside là CHỐT AN TOÀN, không được bỏ: WebP trần 16383px. Truyện
// webtoon có ảnh strip dọc 900x29180px, thiếu chốt này wsrv trả HTTP 400 và
// GÃY ẢNH TOÀN BỘ chương. Có chốt thì riêng strip co còn 493x16000 (25% dung
// lượng gốc) — ảnh thường không bị đụng tới. Lưu ý fit=inside cần CẢ w lẫn h;
// chỉ đưa mỗi h thì wsrv cũng trả 400.
var IMG_PROXY = "https://wsrv.nl/?url=";
var IMG_OPTS = "&w=900&h=16000&fit=inside&we&output=webp&q=62";

function stripScheme(u) {
    return String(u).replace(/^https?:\/\//, "");
}

function proxyUrl(u) {
    return IMG_PROXY + stripScheme(u) + IMG_OPTS;
}

// wsrv.nl chết mà vẫn trả URL proxy thì GÃY ẢNH TOÀN BỘ -> ping trước.
// Ping bằng ảnh demo của chính wsrv (~78B, nằm sẵn trong cache của nó): đo được
// 0,2-0,4s. Bản trước ping qua CDN gốc, bắt wsrv tải nguyên ảnh thật về nên tốn
// ~3,4s MỖI chương — đắt hơn cả phần tiết kiệm được.
// Đánh đổi đã biết: cách này bắt được ca wsrv sập, KHÔNG bắt được ca wsrv còn
// sống nhưng bị riêng CDN ảnh chặn IP. Ca đó nếu xảy ra sẽ gãy ảnh và phải vá tay.
var PROXY_PING = "https://wsrv.nl/?url=wsrv.nl/lichtenstein.jpg&w=8&output=webp&q=20";

function proxyAlive() {
    try {
        var res = fetch(PROXY_PING, {
            headers: { "User-Agent": FETCH_HEADERS["User-Agent"] }
        });
        return !!(res && res.ok);
    } catch (e) {
        return false;
    }
}

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    var images = [];
    var seen = {};

    // Ảnh chương nằm trong .chapter_content .page-chapter. Quét toàn bộ <img>
    // sẽ lọt avatar googleusercontent (URL không chứa chữ "avatar") và gif quảng cáo.
    // KHÔNG fallback về doc.select("img"): có chương rỗng thật (vd
    // /tuyet-the-vo-than/chuong-1136), fallback sẽ trả logo + favicon + gif
    // tracking ra làm "trang truyện" thay vì báo lỗi tử tế.
    var imgEls = doc.select(".chapter_content .page-chapter img");
    if (!imgEls || imgEls.size() === 0) imgEls = doc.select(".page-chapter img");

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("data-src") || img.attr("src") || img.attr("data-original") || "";
        if (!src) continue;
        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("avatar") >= 0) continue;
        if (src.indexOf("favicon") >= 0) continue;
        if (src.indexOf("user.jpg") >= 0) continue;
        if (src.indexOf("follow") >= 0) continue;

        if (src.indexOf("//") === 0) src = "https:" + src;
        else if (src.indexOf("http") !== 0) src = resolveUrl(src);

        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");

    if (proxyAlive()) {
        for (var j = 0; j < images.length; j++) {
            images[j] = proxyUrl(images[j]);
        }
    }

    return Response.success(images);
}
