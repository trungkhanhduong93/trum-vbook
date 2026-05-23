load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var links = doc.select(".list-chapter a, #list-chapter a, .chapter a, a.chapter");
    var seen = {};

    // Extract path segment to filter out ads or other story links (e.g. /truyen-tranh/dai-quan-gia/)
    var pathMatch = url.match(/\/truyen-tranh\/([^\/]+)/);
    var filterPath = pathMatch ? pathMatch[1] : "";

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;

        href = resolveUrl(href);

        // Filters out suggestions/ads by ensuring chapter belongs to the current story
        if (filterPath && href.indexOf("/" + filterPath + "/") === -1) {
            continue;
        }

        // Must be a chapter link
        if (href.indexOf("/chapter-") === -1 && href.indexOf("/chuong-") === -1) {
            continue;
        }

        if (seen[href]) continue;
        seen[href] = true;

        var nm = a.text().trim();
        if (!nm) continue;

        chapters.push({
            name: nm,
            url: href,
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương truyện");

    // The site lists chapters latest-first; reverse to get chronological order for VBook
    chapters.reverse();
    return Response.success(chapters);
}
