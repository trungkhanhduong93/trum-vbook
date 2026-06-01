load("config.js");

// Trang search dùng theme WordPress mặc định: figure.wp-block-post-featured-image > a > img[alt]
function parseSearchItems(html) {
    var items = [];
    var seen = {};
    var re = /wp-block-post-featured-image[\s\S]{0,400}?href="(https:\/\/[^"]*\/truyen\/[a-z0-9-]+\/)"[\s\S]{0,300}?<img\s+[^>]*?src="([^"]+)"[^>]*?alt="([^"]*)"/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
        var link = resolveUrl(m[1]);
        if (seen[link]) continue;
        seen[link] = true;
        items.push({ name: decodeEntities(m[3]) || link, cover: resolveUrl(m[2]), link: link, description: "", host: HOST });
    }
    return items;
}

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);
    var kw = keyword.trim();
    var p = page ? parseInt(page) : 1;

    var url = withPage(BASE_URL + "/?s=" + encodeURIComponent(kw), p);
    var html = httpGet(url);
    if (!html) return Response.success([]);

    var items = parseSearchItems(html);
    if (items.length === 0) items = parseItems(html); // fallback nếu theme đổi
    var next = items.length > 0 ? String(p + 1) : null;
    return Response.success(items, next);
}
