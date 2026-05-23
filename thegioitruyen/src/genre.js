load("config.js");

function execute() {
    var res = fetchRetry(BASE_URL + "/truyen/");
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    var genres = [];
    var seen = {};

    var links = doc.select("a.tgt-filter-tag");
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
