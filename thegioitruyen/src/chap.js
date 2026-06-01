load("config.js");

function execute(url) {
    var html = httpGet(url);
    if (!html) return Response.error("Không tải được trang chương");

    // Giới hạn vùng reader để tránh ảnh ngoài nội dung
    var mSec = html.match(/tgt-reader-pages([\s\S]*?)(?:tgt-reader-nav|<\/main|<footer|tgt-comments)/i);
    var section = mSec ? mSec[1] : html;

    var images = [];
    var seen = {};
    // img.tgt-reader-page — src có thể đứng trước hoặc sau class
    var re = /<img\s+src="([^"]+)"[^>]*class="tgt-reader-page"/gi;
    var m;
    while ((m = re.exec(section)) !== null) {
        addImg(images, seen, m[1]);
    }
    if (images.length === 0) {
        // fallback: mọi img trong vùng reader
        var re2 = /<img\s+[^>]*src="([^"]+)"/gi;
        while ((m = re2.exec(section)) !== null) addImg(images, seen, m[1]);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}

function addImg(images, seen, src) {
    if (!src) return;
    src = src.trim();
    if (src.indexOf("data:image") >= 0) return;
    if (src.indexOf("logo") >= 0 || src.indexOf("/icon") >= 0) return;
    if (src.indexOf("//") === 0) src = "https:" + src;
    else if (src.indexOf("http") !== 0) src = resolveUrl(src);
    if (seen[src]) return;
    seen[src] = true;
    images.push(src); // URL gốc img1.thegioitruyen.vn — CDN VN nhanh, không proxy
}
