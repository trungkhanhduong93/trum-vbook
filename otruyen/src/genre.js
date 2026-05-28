load("config.js");

function execute() {
    var str = fetchJson(API_BASE + "/the-loai");
    var list = [];
    var seen = {};

    if (str) {
        var json = parseJson(str);
        if (json && json.status === "success" && json.data && json.data.items) {
            var arr = json.data.items;
            for (var i = 0; i < arr.length; i++) {
                var g = arr[i];
                var slug = g && g.slug ? String(g.slug) : "";
                var name = g && g.name ? trimText(g.name) : "";
                if (!slug || !name || seen[slug]) continue;
                seen[slug] = true;
                list.push({
                    title: name,
                    input: API_BASE + "/the-loai/" + slug,
                    script: "gen.js"
                });
            }
        }
    }

    // Fallback nếu API thất bại — danh sách thể loại hay dùng
    if (list.length === 0) {
        var fallback = [
            ["action","Action"], ["adventure","Adventure"], ["comedy","Comedy"],
            ["drama","Drama"], ["fantasy","Fantasy"], ["harem","Harem"],
            ["historical","Historical"], ["horror","Horror"], ["manhua","Manhua"],
            ["manhwa","Manhwa"], ["martial-arts","Martial Arts"], ["mystery","Mystery"],
            ["ngon-tinh","Ngôn Tình"], ["romance","Romance"], ["school-life","School Life"],
            ["sci-fi","Sci-fi"], ["seinen","Seinen"], ["shounen","Shounen"],
            ["slice-of-life","Slice of Life"], ["supernatural","Supernatural"],
            ["truyen-mau","Truyện Màu"], ["webtoon","Webtoon"], ["xuyen-khong","Xuyên Không"]
        ];
        for (var j = 0; j < fallback.length; j++) {
            list.push({
                title: fallback[j][1],
                input: API_BASE + "/the-loai/" + fallback[j][0],
                script: "gen.js"
            });
        }
    }

    return Response.success(list);
}
