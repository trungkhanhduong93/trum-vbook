load("config.js");

function execute() {
    var doc = fetchRetry(BASE_URL + "/");
    if (!doc) return Response.success([]);

    var genres = [];
    var seen = {};

    var links = doc.select(".book_tags_content a");
    if (!links || links.size() === 0) {
        links = doc.select("a[href*='/the-loai/']");
    }

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = a.text().trim();
        var href = a.attr("href") || "";
        if (!name || !href) continue;
        if (href.indexOf("/the-loai/") < 0) continue;
        if (seen[href]) continue;
        seen[href] = true;

        genres.push({
            title: name,
            input: resolveUrl(href),
            script: "gen.js"
        });
    }

    return Response.success(genres);
}
