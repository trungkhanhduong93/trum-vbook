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
                list.push({ title: name, input: API_BASE + "/the-loai/" + slug, script: "gen.js" });
            }
        }
    }
    if (list.length === 0) {
        var fb = [["action","Action"],["adventure","Adventure"],["comedy","Comedy"],["drama","Drama"],
            ["fantasy","Fantasy"],["manhua","Manhua"],["manhwa","Manhwa"],["martial-arts","Martial Arts"],
            ["ngon-tinh","Ngôn Tình"],["romance","Romance"],["chuyen-sinh","Chuyển Sinh"],["xuyen-khong","Xuyên Không"],
            ["truyen-mau","Truyện Màu"],["webtoon","Webtoon"],["tu-tien","Tu Tiên"]];
        for (var j = 0; j < fb.length; j++) list.push({ title: fb[j][1], input: API_BASE + "/the-loai/" + fb[j][0], script: "gen.js" });
    }
    return Response.success(list);
}
