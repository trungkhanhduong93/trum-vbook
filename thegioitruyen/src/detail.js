load("config.js");

function execute(url) {
    var slug = extractSlug(url);

    // Đường nhanh: API OTruyen theo slug
    if (slug) {
        var str = fetchJson(API_BASE + "/truyen-tranh/" + slug);
        var json = parseJson(str);
        if (json && json.status === "success" && json.data && json.data.item) {
            return Response.success(mapDetail(json.data));
        }
    }
    // Fallback: scrape trang WordPress thegioitruyen
    return scrapeDetail(url);
}

function mapDetail(data) {
    var item = data.item;
    var cdnImage = data.APP_DOMAIN_CDN_IMAGE || CDN_IMAGE;
    var name = trimText(item.name);
    var cover = buildCover(item.thumb_url || item.poster_url, cdnImage);

    var author = "Đang cập nhật";
    if (item.author && item.author.length > 0) {
        var as = [];
        for (var i = 0; i < item.author.length; i++) {
            var a = trimText(item.author[i]);
            if (a && a.toLowerCase().indexOf("cập nhật") < 0 && a.toLowerCase().indexOf("cap nhat") < 0) as.push(a);
        }
        if (as.length) author = as.join(", ");
    }

    var genres = [], seenG = {};
    var cats = item.category || [];
    for (var j = 0; j < cats.length; j++) {
        var c = cats[j];
        if (!c || !c.slug || !c.name || seenG[c.slug]) continue;
        seenG[c.slug] = true;
        genres.push({ title: trimText(c.name), input: API_BASE + "/the-loai/" + c.slug, script: "gen.js" });
    }

    var statusRaw = String(item.status || "").toLowerCase();
    var ongoing = statusRaw !== "completed" && statusRaw !== "complete" && statusRaw !== "done";
    var statusText = ongoing ? "Đang tiến hành" : "Đã hoàn thành";
    if (statusRaw === "coming_soon") statusText = "Sắp ra mắt";

    var chapterCount = 0;
    if (item.chapters && item.chapters.length > 0) chapterCount = (item.chapters[0].server_data || []).length;

    var infoParts = ["Tác giả: " + author];
    if (chapterCount > 0) infoParts.push("Số chương: " + chapterCount);
    infoParts.push("Trạng thái: " + statusText);
    if (genres.length) {
        var gn = []; for (var k = 0; k < genres.length; k++) gn.push(genres[k].title);
        infoParts.push("Thể loại: " + gn.join(", "));
    }

    return {
        name: name, cover: cover, host: HOST, author: author,
        description: stripHtml(item.content || ""),
        detail: infoParts.join("<br>"), ongoing: ongoing, genres: genres
    };
}

function meta(html, prop) {
    var m = html.match(new RegExp('<meta property="' + prop + '" content="([^"]*)"', "i"));
    return m ? stripHtml(m[1]) : "";
}

function scrapeDetail(url) {
    var html = httpGet(url);
    if (!html) return Response.error("Không tải được trang truyện");
    var name = "";
    var h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1) name = stripHtml(h1[1]);
    if (!name) name = meta(html, "og:title").replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/\s*\|.*$/, "").replace(/^Đọc\s+/i, "").replace(/\s*(Full\s*)?Mới Nhất\s*$/i, "").trim();
    var cover = meta(html, "og:image");
    if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
    var description = "";
    var dw = html.match(/id="tgt-desc-wrap"[^>]*>([\s\S]*?)<\/div>/i);
    if (dw) description = stripHtml(dw[1]);
    if (!description) description = meta(html, "og:description");
    var genres = [], gSeen = {};
    var gre = /href="([^"]*\/the-loai\/([a-z0-9-]+)\/)"[^>]*>([^<]{1,200})</gi, gm;
    while ((gm = gre.exec(html)) !== null) {
        var s = gm[2], gn = stripHtml(gm[3]);
        if (!gn || !s || gSeen[s] || gn.length > 25) continue;
        gSeen[s] = true;
        genres.push({ title: gn, input: API_BASE + "/the-loai/" + s, script: "gen.js" });
    }
    var ongoing = true;
    var badge = html.match(/tgt-badge"[^>]*>([^<]+)</i);
    var st = badge ? stripHtml(badge[1]) : "";
    if (st && (st.indexOf("Hoàn") >= 0 || st.indexOf("Full") >= 0)) ongoing = false;
    var parts = [];
    if (st) parts.push("Tình trạng: " + st);
    return { name: name, cover: cover, host: HOST, author: "", description: description, detail: parts.join("<br>"), ongoing: ongoing, genres: genres };
}
