load('config.js');

function execute(url) {
    // Lấy danh sách tag từ trang /search (các <a data-tag="...">)
    var html = httpGet(SITE_URL + "/search");
    var list = [];
    var seen = {};

    if (html) {
        var re = /data-tag="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        var m;
        while ((m = re.exec(html)) !== null) {
            var tag = m[1].trim();
            var label = strip(m[2]) || tag;
            if (!tag || seen[tag]) continue;
            seen[tag] = true;
            list.push({
                title: label,
                input: "/search?tag_query=" + encodeURIComponent(tag),
                script: "gen.js"
            });
        }
    }

    // Fallback nếu parse thất bại
    if (list.length === 0) {
        var fallback = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Romance",
                        "School Life","Sci-fi","Slice of Life","Sports","Supernatural"];
        for (var i = 0; i < fallback.length; i++) {
            list.push({
                title: fallback[i],
                input: "/search?tag_query=" + encodeURIComponent(fallback[i]),
                script: "gen.js"
            });
        }
    }

    return Response.success(list);
}
