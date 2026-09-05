load('config.js');

function execute(url) {
    if (url.indexOf('/') === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var doc = fetchRetry(url);
    if (!doc) return null;

    var html = doc.html();
    var comicDataMatch = html.match(/window\.comicData\s*=\s*(\{[\s\S]*?\});/);

    if (!comicDataMatch) return fallbackFromHtml(doc);

    var rawData = comicDataMatch[1];
    var apiMatch = rawData.match(/apiUrl:\s*['"]([^'"]+)['"]/);
    var routeMatch = rawData.match(/chapterRouteTemplate:\s*['"]([^'"]+)['"]/);
    if (!apiMatch || !routeMatch) return fallbackFromHtml(doc);

    var apiUrl = apiMatch[1];
    var routeTemplate = routeMatch[1];

    // Single fetch for the full chapter list (per_page=-1 returns ALL chapters).
    // Confirmed via zettruyen's own chapter.js. Replaces previous browser+Promise.all path.
    var str = fetchJson(apiUrl + "?per_page=-1&order=asc");
    if (!str) return Response.error("Không tải được mục lục");

    var json;
    try { json = JSON.parse(str); } catch (e) { return Response.error("Lỗi parse JSON: " + e.message); }
    if (!json || !json.data || !json.data.chapters) return Response.error("Phản hồi mục lục không hợp lệ");

    var chaps = json.data.chapters;
    var list = [];
    for (var i = 0; i < chaps.length; i++) {
        var c = chaps[i];
        list.push({
            name: c.chapter_name || ('Chapter ' + c.chapter_num),
            url: routeTemplate.replace('CHAPTER_NUM', c.chapter_num).replace('CHAPTER_SLUG', c.chapter_slug || c.chapter_num),
            host: BASE_URL
        });
    }
    return Response.success(list);
}

function fallbackFromHtml(doc) {
    var chapters = [];
    var els = doc.select("a").filter(function(e) {
        return e.attr('href') && e.attr('href').indexOf('/chuong-') !== -1;
    });
    if (els.size() === 0) {
        els = doc.select(".list-chapter a").filter(function(e) {
            return e.attr('href') && e.attr('href').indexOf('/chuong-') !== -1;
        });
    }
    var ne = els.size();
    for (var i = 0; i < ne; i++) {
        var e = els.get(i);
        var link = e.attr("href");
        if (link.indexOf("/") === 0) link = BASE_URL + link;
        chapters.push({
            name: e.text().trim(),
            url: link,
            host: BASE_URL
        });
    }
    return Response.success(chapters);
}
