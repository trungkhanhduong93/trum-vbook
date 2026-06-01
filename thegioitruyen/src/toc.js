load("config.js");

function execute(url) {
    var slug = extractSlug(url);

    // Đường nhanh: API OTruyen
    if (slug) {
        var str = fetchJson(API_BASE + "/truyen-tranh/" + slug);
        var json = parseJson(str);
        if (json && json.status === "success" && json.data && json.data.item && json.data.item.chapters) {
            var sd = (json.data.item.chapters[0] || {}).server_data || [];
            if (sd.length > 0) {
                var chapters = [];
                for (var i = 0; i < sd.length; i++) {
                    var ch = sd[i];
                    if (!ch.chapter_api_data) continue;
                    var cn = trimText(ch.chapter_name);
                    var nm = cn ? ("Chương " + cn) : trimText(ch.filename);
                    var ct = trimText(ch.chapter_title);
                    if (ct) nm += ": " + ct;
                    chapters.push({ name: nm || ("Chương " + (i + 1)), url: ch.chapter_api_data, host: HOST });
                }
                if (chapters.length > 0) {
                    var f = parseFloat(sd[0].chapter_name), l = parseFloat(sd[sd.length - 1].chapter_name);
                    if (!isNaN(f) && !isNaN(l) && f > l) chapters.reverse();
                    return Response.success(chapters);
                }
            }
        }
    }
    // Fallback: scrape chap links từ trang WordPress
    return scrapeToc(url);
}

function scrapeToc(url) {
    var html = httpGet(url);
    if (!html) return Response.error("Không tải được mục lục");
    var mSlug = String(url).match(/\/truyen\/([a-z0-9-]+)/i);
    var sg = mSlug ? mSlug[1] : "[a-z0-9-]+";
    var chapters = [], seen = {};
    var re = new RegExp("/truyen/" + sg + "/chap-([0-9]+(?:[.-][0-9]+)?)/", "gi"), m;
    while ((m = re.exec(html)) !== null) {
        var n = m[1].replace("-", ".");
        if (seen[n]) continue; seen[n] = true;
        chapters.push({ name: "Chapter " + n, url: BASE_URL + "/truyen/" + (mSlug ? mSlug[1] : "") + "/chap-" + m[1] + "/", num: parseFloat(n) || 0 });
    }
    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");
    chapters.sort(function (a, b) { return a.num - b.num; });
    var out = [];
    for (var j = 0; j < chapters.length; j++) out.push({ name: chapters[j].name, url: chapters[j].url, host: HOST });
    return Response.success(out);
}
