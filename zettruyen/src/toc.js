load('config.js');

function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    let doc = fetchRetry(url);
    if (!doc) return null;

    let html = doc.html();
    let comicDataMatch = html.match(/window\.comicData\s*=\s*(\{.*?\});/s);

    if (!comicDataMatch) return fallbackFromHtml(doc);

    let rawData = comicDataMatch[1];
    let apiMatch = rawData.match(/apiUrl:\s*['"]([^'"]+)['"]/);
    let routeMatch = rawData.match(/chapterRouteTemplate:\s*['"]([^'"]+)['"]/);
    if (!apiMatch || !routeMatch) return fallbackFromHtml(doc);

    let apiUrl = apiMatch[1];
    let routeTemplate = routeMatch[1];

    // Single fetch for the full chapter list (per_page=-1 returns ALL chapters).
    // Confirmed via zettruyen's own chapter.js. Replaces previous browser+Promise.all path.
    let str = fetchJson(apiUrl + "?per_page=-1&order=asc");
    if (!str) return Response.error("Không tải được mục lục");

    let json;
    try { json = JSON.parse(str); } catch (e) { return Response.error("Lỗi parse JSON: " + e.message); }
    if (!json || !json.data || !json.data.chapters) return Response.error("Phản hồi mục lục không hợp lệ");

    let chaps = json.data.chapters;
    let list = [];
    for (let i = 0; i < chaps.length; i++) {
        let c = chaps[i];
        list.push({
            name: c.chapter_name || ('Chapter ' + c.chapter_num),
            url: routeTemplate.replace('CHAPTER_NUM', c.chapter_num).replace('CHAPTER_SLUG', c.chapter_slug || c.chapter_num),
            host: BASE_URL
        });
    }
    return Response.success(list);
}

function fallbackFromHtml(doc) {
    let chapters = [];
    var els = doc.select("a").filter(function(e) {
        return e.attr('href') && e.attr('href').indexOf('/chuong-') !== -1;
    });
    if (els.size() === 0) {
        els = doc.select(".list-chapter a").filter(function(e) {
            return e.attr('href') && e.attr('href').indexOf('/chuong-') !== -1;
        });
    }
    for (let i = 0; i < els.size(); i++) {
        let e = els.get(i);
        let link = e.attr("href");
        if (link.startsWith("/")) link = BASE_URL + link;
        chapters.push({
            name: e.text().trim(),
            url: link,
            host: BASE_URL
        });
    }
    return Response.success(chapters);
}
