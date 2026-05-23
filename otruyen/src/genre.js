load("config.js");

function execute() {
    var res = fetchRetry(BASE_URL + "/");
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    var genres = [];
    var seen = {};
    var links = doc.select("div.pills a.pill");

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = trimText(a.text());
        var href = a.attr("href") || "";
        if (!name || !href || seen[href]) continue;
        seen[href] = true;
        genres.push({
            title: name,
            input: resolveUrl(href),
            script: "gen.js"
        });
    }

    return Response.success(genres);
}
