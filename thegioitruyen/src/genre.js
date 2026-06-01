load("config.js");

function execute() {
    var html = httpGet(BASE_URL + "/the-loai/");
    if (!html) html = httpGet(BASE_URL + "/");
    if (!html) return Response.success([]);

    var genres = [];
    var seen = {};
    var re = /href="([^"]*\/the-loai\/([a-z0-9-]+)\/)"[^>]*>([^<]{1,200})</gi;
    var m;
    while ((m = re.exec(html)) !== null) {
        var slug = m[2];
        var name = decodeEntities(m[3]);
        if (!name || !slug || seen[slug]) continue;
        if (name.length > 25) continue;
        seen[slug] = true;
        genres.push({ title: name, input: resolveUrl(m[1]), script: "gen.js" });
    }
    return Response.success(genres);
}
