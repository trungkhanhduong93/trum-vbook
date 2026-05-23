load('config.js');

function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    let doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang chương");

    // Live structure: div.chapter-images-container > div.w-full.mx-auto.center > img (src is direct CDN URL)
    let imgs = doc.select("div.chapter-images-container div.w-full img");
    if (!imgs || imgs.size() === 0) {
        imgs = doc.select("div.w-full.mx-auto.center img");
    }
    if (!imgs || imgs.size() === 0) {
        // Heuristic fallback: any img on the zetimage CDN
        let all = doc.select("img");
        let filtered = [];
        for (let i = 0; i < all.size(); i++) {
            let e = all.get(i);
            let s = e.attr("src") || "";
            if (s.indexOf("zetimage.com") !== -1 && s.indexOf("thumb") === -1) {
                filtered.push(e);
            }
        }
        imgs = filtered;
    }

    let data = [];
    let seen = {};
    let n = (imgs.size ? imgs.size() : imgs.length);
    for (let i = 0; i < n; i++) {
        let e = (imgs.get ? imgs.get(i) : imgs[i]);
        let link = e.attr("src") || e.attr("data-src") || "";
        if (!link) {
            let ss = e.attr("srcset") || "";
            if (ss && ss.indexOf(" ") > 0) link = ss.split(" ")[0];
            else link = ss;
        }
        if (!link) continue;
        link = link.trim();

        if (link.startsWith("//")) link = "https:" + link;
        if (link.indexOf("data:") === 0) continue;
        if (link.indexOf("logo") !== -1) continue;
        if (link.indexOf("/icons/") !== -1) continue;
        if (link.indexOf("thumb-default") !== -1) continue;
        if (link.indexOf("/thumb/") !== -1) continue;

        if (seen[link]) continue;
        seen[link] = true;
        data.push(link);
    }

    if (data.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(data);
}
