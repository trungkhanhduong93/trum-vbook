load("config.js");

function execute(url) {
    // Extract StoryID from URL: e.g. /truyen-tranh/ten-truyen-12345 -> "12345"
    var storyId = url.replace(/\/$/, "").split("-").pop();

    // Use POST API like Tachiyomi (much faster than browser)
    var apiUrl = BASE_URL + "/Story/ListChapterByStoryID";

    var res = fetch(apiUrl, {
        method: "POST",
        headers: {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": url,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "text/html, */*; q=0.01"
        },
        body: "StoryID=" + storyId
    });

    if (!res || !res.ok) {
        // Fallback: try fetching the detail page and parsing chapter list from HTML
        return fallbackToc(url);
    }

    var doc = res.html();
    if (!doc) return fallbackToc(url);

    var chapters = parseChapterList(doc);

    if (chapters.length === 0) {
        // Fallback if POST API returns empty
        return fallbackToc(url);
    }

    // Reverse so oldest chapter is first (Vbook expects ascending order)
    chapters.reverse();
    return Response.success(chapters);
}

// Parse chapter list from HTML fragment (used by both POST API and fallback)
function parseChapterList(doc) {
    var chapters = [];

    // Selectors matching Tachiyomi: li.row:not(.heading)
    var el = doc.select("li.row");

    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);

        // Skip heading row
        var cls = e.attr("class") || "";
        if (cls.indexOf("heading") >= 0) continue;

        // Find chapter link: div.chapter a or just a
        var chapterLink = selFirst(e, "div.chapter a");
        if (!chapterLink) chapterLink = selFirst(e, "a");
        if (!chapterLink) continue;

        var chName = chapterLink.text().trim();
        if (!chName) continue;

        var chapterUrl = chapterLink.attr("href") || "";
        chapterUrl = resolveUrl(chapterUrl);

        chapters.push({
            name: chName,
            url: chapterUrl,
            host: HOST
        });
    }

    return chapters;
}

// Fallback: fetch the full detail page and parse chapter list from embedded HTML
function fallbackToc(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được mục lục");

    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    var chapters = [];

    // Try multiple selectors for embedded chapter list
    var el = doc.select("#nt_listchapter li.row");
    if (!el || el.size() === 0) {
        el = doc.select(".list-chapter li.row");
    }
    if (!el || el.size() === 0) {
        el = doc.select("#nt_listchapter li");
    }

    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);

        var cls = e.attr("class") || "";
        if (cls.indexOf("heading") >= 0) continue;

        var chapterLink = selFirst(e, ".chapter a");
        if (!chapterLink) chapterLink = selFirst(e, "a");
        if (!chapterLink) continue;

        var chName = chapterLink.text().trim();
        if (!chName) continue;

        var chapterUrl = chapterLink.attr("href") || "";
        chapterUrl = resolveUrl(chapterUrl);

        chapters.push({
            name: chName,
            url: chapterUrl,
            host: HOST
        });
    }

    chapters.reverse();
    return Response.success(chapters);
}
