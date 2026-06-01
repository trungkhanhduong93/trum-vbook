load("config.js");

function execute(url) {
    var sUrl = String(url || "").trim();
    if (!sUrl) return Response.error("URL chương không hợp lệ");

    // URL từ trang WordPress (fallback toc) → scrape ảnh tgt-reader-page
    if (sUrl.indexOf("/truyen/") !== -1 && /thegioitruyen|\/chap-/.test(sUrl)) {
        return scrapeChap(sUrl);
    }

    // Đường nhanh: chapter_api_data của OTruyen → JSON ảnh
    var str = fetchJson(sUrl);
    var json = parseJson(str);
    if (json && json.status === "success" && json.data && json.data.item) {
        var data = json.data, item = data.item;
        var domainCdn = data.domain_cdn || "https://sv1.otruyencdn.com";
        var chapterPath = item.chapter_path || "";
        var imgs = item.chapter_image || [];
        var out = [], seen = {};
        for (var i = 0; i < imgs.length; i++) {
            var file = imgs[i] && imgs[i].image_file ? String(imgs[i].image_file).trim() : "";
            if (!file) continue;
            var link = file.indexOf("http") === 0 ? file : (chapterPath ? domainCdn + "/" + chapterPath + "/" + file : domainCdn + "/" + file);
            if (seen[link]) continue;
            seen[link] = true;
            out.push(link);
        }
        if (out.length > 0) return Response.success(out);
    }
    // Nếu không phải API → thử scrape như trang WP
    return scrapeChap(sUrl);
}

function scrapeChap(url) {
    var html = httpGet(url);
    if (!html) return Response.error("Không tải được trang chương");
    var mSec = html.match(/tgt-reader-pages([\s\S]*?)(?:tgt-reader-nav|<\/main|<footer|tgt-comments)/i);
    var section = mSec ? mSec[1] : html;
    var images = [], seen = {}, m;
    var re = /<img\s+src="([^"]+)"[^>]*class="tgt-reader-page"/gi;
    while ((m = re.exec(section)) !== null) addImg(images, seen, m[1]);
    if (images.length === 0) {
        var re2 = /<img\s+[^>]*src="([^"]+)"/gi;
        while ((m = re2.exec(section)) !== null) addImg(images, seen, m[1]);
    }
    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}

function addImg(images, seen, src) {
    if (!src) return;
    src = src.trim();
    if (src.indexOf("data:image") >= 0 || src.indexOf("logo") >= 0 || src.indexOf("/icon") >= 0) return;
    if (src.indexOf("//") === 0) src = "https:" + src;
    else if (src.indexOf("http") !== 0) src = resolveUrl(src);
    if (seen[src]) return;
    seen[src] = true;
    images.push(src);
}
