load('config.js');

function execute(url) {
    var html = httpGet(SITE_URL + "/");
    if (!html) return null;

    var list = [];
    var seen = {};

    // Parse tất cả link the-loai từ header dropdown
    var re = /href="(\/\/metruyen18\.net\/the-loai\/([a-z0-9-]+))"[^>]*title="([^"]+)"/g;
    var m;
    while ((m = re.exec(html)) !== null) {
        var slug = m[2];
        var title = m[3];
        if (!slug || seen[slug]) continue;
        seen[slug] = true;
        list.push({
            title: title,
            input: "/the-loai/" + slug,
            script: "gen.js"
        });
    }

    if (list.length === 0) return null;
    return Response.success(list);
}
