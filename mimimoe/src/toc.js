load("config.js");

function execute(url) {
    var id = extractMangaId(url);
    if (!id) return Response.error("URL truyện không hợp lệ");

    var res = apiFetch("/manga/" + id + "/chapters");
    if (!res || !res.ok) return Response.error("Không tải được mục lục");

    var chapters = [];
    try {
        var data = JSON.parse(res.text());
        if (!data || !data.length) return Response.error("Mục lục trống");

        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            if (!c || !c.id) continue;
            var nm = "";
            if (c.order || c.order === 0) nm = "Chapter " + c.order;
            if (c.title) {
                if (nm) nm = nm + " - " + c.title;
                else nm = c.title;
            }
            if (!nm) nm = "Chapter " + c.id;

            chapters.push({
                name: nm,
                url: BASE_URL + "/manga/" + id + "/chapter/" + c.id,
                host: HOST
            });
        }
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }

    // Reverse so oldest first
    chapters.reverse();
    return Response.success(chapters);
}
