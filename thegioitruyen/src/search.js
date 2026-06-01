load("config.js");

// Trang search dùng theme WordPress mặc định: mỗi kết quả là figure.wp-block-post-featured-image > a > img[alt]
function parseSearchItems(doc) {
    var items = [];
    var seen = {};
    var anchors = doc.select(".wp-block-post-featured-image a");
    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var href = a.attr("href") || "";
        if (!/\/truyen\/[a-z0-9-]+\/?$/i.test(href)) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var cover = "";
        var name = "";
        var img = selFirst(a, "img");
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
            if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
            name = (img.attr("alt") || "").trim();
        }
        if (!name) name = a.text().trim();
        if (!name) continue;

        items.push({ name: name, cover: cover, link: link, description: "", host: HOST });
    }
    return items;
}

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);
    var kw = keyword.trim();
    var p = page ? parseInt(page) : 1;

    var url = BASE_URL + "/?s=" + encodeURIComponent(kw);
    url = withPage(url, p);

    var doc = fetchRetry(url);
    if (!doc) return Response.success([]);

    var items = parseSearchItems(doc);
    if (items.length === 0) items = parseItems(doc); // fallback nếu theme đổi
    var next = items.length > 0 ? String(p + 1) : null;
    return Response.success(items, next);
}
