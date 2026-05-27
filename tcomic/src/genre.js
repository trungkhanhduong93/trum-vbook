load('config.js');

function execute() {
    var url = API_URL + "/api/web/categories";
    var json = null;
    try {
        var s = Http.get(url).headers(REQ_HEADERS()).string();
        if (s) json = JSON.parse(s);
    } catch (e) {}

    var list = [];
    var seen = {};
    if (json && json.length) {
        for (var i = 0; i < json.length; i++) {
            var g = json[i];
            if (!g || !g.id || !g.name) continue;
            if (seen[g.id]) continue;
            seen[g.id] = true;
            list.push({
                title: g.name,
                input: "/api/web/comic/genres/" + g.id,
                script: "gen.js"
            });
        }
    }

    if (list.length === 0) {
        var fallback = [
            ["Action", "action"], ["Adventure", "adventure"], ["Comedy", "comedy"],
            ["Drama", "drama"], ["Fantasy", "fantasy"], ["Horror", "horror"],
            ["Manhua", "manhua"], ["Manhwa", "manhwa"], ["Manga", "manga"],
            ["Romance", "romance"], ["Shounen", "shounen"], ["Shoujo", "shoujo"],
            ["Truyện Màu", "truyen-mau"], ["Webtoon", "webtoon"], ["Xuyên Không", "xuyen-khong"]
        ];
        for (var j = 0; j < fallback.length; j++) {
            list.push({
                title: fallback[j][0],
                input: "/api/web/comic/genres/" + fallback[j][1],
                script: "gen.js"
            });
        }
    }

    return Response.success(list);
}
