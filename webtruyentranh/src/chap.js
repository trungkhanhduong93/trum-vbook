load('config.js');

function execute(url) {
    if (url.startsWith("/")) url = BASE_URL + url;

    let doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    let imgs = doc.select("img.max-w-full");
    if (!imgs || imgs.size() === 0) {
        // Fallback: any image from the otruyencdn CDN
        let all = doc.select("img");
        let filtered = [];
        for (let i = 0; i < all.size(); i++) {
            let s = all.get(i).attr("src") || "";
            if (s.indexOf("otruyencdn.com") !== -1 && s.indexOf("/thumb") === -1) {
                filtered.push(all.get(i));
            }
        }
        imgs = filtered;
    }

    let data = [];
    let seen = {};
    let n = imgs.size ? imgs.size() : imgs.length;

    for (let i = 0; i < n; i++) {
        let el = imgs.get ? imgs.get(i) : imgs[i];
        let src = el.attr("src") || el.attr("data-src") || "";
        if (!src) continue;
        src = src.trim();
        if (src.startsWith("//")) src = "https:" + src;
        if (src.indexOf("data:") === 0) continue;
        if (src.indexOf("logo") !== -1 || src.indexOf("/icons/") !== -1) continue;
        if (seen[src]) continue;
        seen[src] = true;
        data.push(src);
    }

    if (data.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(data);
}
