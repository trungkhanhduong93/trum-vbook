load("config.js");

function execute(url) {
    var html = httpGet(url);
    if (!html) return Response.error("Không tải được mục lục");

    var mSlug = String(url).match(/\/truyen\/([a-z0-9-]+)/i);
    var slug = mSlug ? mSlug[1] : "[a-z0-9-]+";

    var chapters = [];
    var seen = {};
    var re = new RegExp("/truyen/" + slug + "/chap-([0-9]+(?:[.-][0-9]+)?)/", "gi");
    var m;
    while ((m = re.exec(html)) !== null) {
        var numStr = m[1].replace("-", ".");
        if (seen[numStr]) continue;
        seen[numStr] = true;
        chapters.push({
            name: "Chapter " + numStr,
            url: BASE_URL + "/truyen/" + (mSlug ? mSlug[1] : "") + "/chap-" + m[1] + "/",
            num: parseFloat(numStr) || 0
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    chapters.sort(function (a, b) { return a.num - b.num; });
    var out = [];
    for (var j = 0; j < chapters.length; j++) {
        out.push({ name: chapters[j].name, url: chapters[j].url, host: HOST });
    }
    return Response.success(out);
}
