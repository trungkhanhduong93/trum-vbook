load("config.js");

function execute() {
    var doc = fetchRetry(BASE_URL + "/");
    if (!doc) return Response.success([]);

    var genres = [];
    var seen = {};
    var links = doc.select("a[href*='/the-loai/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = a.text().trim();
        var href = a.attr("href") || "";
        if (!name || !href) continue;
        if (href.indexOf("/the-loai/") < 0) continue;
        if (/\/the-loai\/?$/.test(href)) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        genres.push({ title: name, input: link, script: "gen.js" });
    }
    return Response.success(genres);
}
