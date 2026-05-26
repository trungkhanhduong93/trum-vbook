load("config.js");

function execute(url) {
    var slugMatch = url.match(/\/truyen-tranh\/([^\/]+)/);
    if (!slugMatch) return Response.error("URL không hợp lệ");
    var slug = slugMatch[1];

    var fetchUrl = API_BASE + "/truyen-tranh/" + slug;
    var str = fetchJson(fetchUrl);
    if (!str) return Response.error("Không tải được chi tiết truyện");

    try {
        var json = JSON.parse(str);
        if (json.status !== "success") return Response.error("Lỗi API: " + json.status);

        var data = json.data;
        var item = data.item || {};
        var cdnImage = data.APP_DOMAIN_CDN_IMAGE || "https://img.otruyenapi.com";

        var name = trimText(item.name);
        
        var cover = "";
        var thumb = item.thumb_url || item.poster_url || "";
        if (thumb) {
            if (thumb.indexOf("http") === 0) cover = thumb;
            else cover = cdnImage + "/uploads/comics/" + thumb;
        }

        var author = "Đang cập nhật";
        var authors = item.author || [];
        if (authors.length > 0 && authors[0]) {
            author = trimText(authors.join(", "));
        }

        var genres = [];
        var categories = item.category || [];
        for (var i = 0; i < categories.length; i++) {
            var g = trimText(categories[i].name);
            if (g) genres.push(g);
        }

        var description = trimText(item.content).replace(/<[^>]+>/g, "");

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: "Thể loại: " + genres.join(", "),
            host: BASE_URL
        });
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }
}
