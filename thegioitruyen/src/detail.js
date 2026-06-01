load("config.js");

function meta(html, prop) {
    var m = html.match(new RegExp('<meta property="' + prop + '" content="([^"]*)"', "i"));
    if (!m) m = html.match(new RegExp('<meta name="' + prop + '" content="([^"]*)"', "i"));
    return m ? decodeEntities(m[1]) : "";
}

function execute(url) {
    var html = httpGet(url);
    if (!html) return Response.error("Không tải được trang truyện");

    // Title: h1 ưu tiên, fallback og:title (bỏ [..], | hậu tố, "Đọc ", "Full Mới Nhất")
    var name = "";
    var h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1) name = decodeEntities(h1[1]);
    if (!name) {
        name = meta(html, "og:title")
            .replace(/\s*\[[^\]]*\]\s*/g, " ")
            .replace(/\s*\|.*$/, "")
            .replace(/^Đọc\s+/i, "")
            .replace(/\s*(Full\s*)?Mới Nhất\s*$/i, "")
            .trim();
    }

    // Cover
    var cover = meta(html, "og:image");
    if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);

    // Description: #tgt-desc-wrap (đầy đủ), fallback og:description
    var description = "";
    var dw = html.match(/id="tgt-desc-wrap"[^>]*>([\s\S]*?)<\/div>/i);
    if (dw) description = decodeEntities(dw[1].replace(/<[^>]+>/g, " "));
    if (!description) description = meta(html, "og:description");

    // Genres
    var genres = [];
    var gSeen = {};
    var gre = /href="([^"]*\/the-loai\/([a-z0-9-]+)\/)"[^>]*>([^<]{1,200})</gi;
    var gm;
    while ((gm = gre.exec(html)) !== null) {
        var slug = gm[2];
        var gn = decodeEntities(gm[3]);
        if (!gn || !slug || gSeen[slug]) continue;
        if (gn.length > 25) continue; // bỏ link SEO mô tả dài, giữ tên thể loại ngắn
        gSeen[slug] = true;
        genres.push({ title: gn, input: resolveUrl(gm[1]), script: "gen.js" });
    }

    // Status
    var ongoing = true;
    var badge = html.match(/tgt-badge"[^>]*>([^<]+)</i);
    var statusText = badge ? decodeEntities(badge[1]) : "";
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0)) ongoing = false;

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (genres.length) {
        var gn2 = [];
        for (var k = 0; k < genres.length; k++) gn2.push(genres[k].title);
        detailParts.push("Thể loại: " + gn2.join(", "));
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: "",
        description: description,
        detail: detailParts.join("<br>"),
        ongoing: ongoing,
        genres: genres
    });
}
