load("config.js");

function execute() {
    var res = fetchRetry(BASE_URL + "/");
    var genres = [];
    if (res && res.ok) {
        var doc = res.html();
        if (doc) {
            var links = doc.select("a[href*='/the-loai/']");
            var seen = {};
            for (var i = 0; i < links.size(); i++) {
                var a = links.get(i);
                var href = a.attr("href") || "";
                var name = txt(a);
                var m = href.match(/\/the-loai\/([a-z0-9-]+)\//i);
                if (!m) continue;
                var slug = m[1];
                if (!name || seen[slug]) continue;
                seen[slug] = true;
                genres.push({
                    title: name,
                    input: resolveUrl("/the-loai/" + slug + "/"),
                    script: "gen.js"
                });
            }
        }
    }
    return Response.success(genres);
}
