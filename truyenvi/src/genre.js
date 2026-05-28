load('config.js');

function execute(url) {
    // Lấy danh sách thể loại từ trang A-Z
    var html = httpGet(SITE_URL + "/danh-sach-truyen/a-z/1");
    if (!html) return null;

    var list = [];
    var seen = {};

    // Parse genre từ <meta content="/the-loai/{slug}/1" itemprop="url">
    // Kèm headline để lấy tên: <meta content="{name}" itemprop="headline">
    var re = /itemprop="category"[\s\S]{0,300}?<meta content="(\/the-loai\/[a-z0-9-]+\/1)" itemprop="url">\s*<meta content="([^"]+)" itemprop="headline">/g;
    var m;
    while ((m = re.exec(html)) !== null) {
        var input = m[1];
        var title = m[2].trim();
        var slug = input.replace(/^\/the-loai\//, "").replace(/\/1$/, "");
        if (!slug || seen[slug]) continue;
        seen[slug] = true;
        list.push({ title: title, input: input, script: "gen.js" });
    }

    if (list.length === 0) return null;
    return Response.success(list);
}
