load("config.js");

function execute(url) {
    var slug = extractSlug(url);
    if (!slug) return Response.error("URL truyện không hợp lệ");

    var str = fetchJson(API_BASE + "/truyen-tranh/" + slug);
    if (!str) return Response.error("Không tải được chi tiết truyện");

    var json = parseJson(str);
    if (!json || json.status !== "success" || !json.data || !json.data.item) {
        return Response.error("API trả về dữ liệu không hợp lệ");
    }

    var data = json.data;
    var item = data.item;
    var cdnImage = data.APP_DOMAIN_CDN_IMAGE || CDN_IMAGE;

    var name = trimText(item.name);
    if (!name) return Response.error("Truyện không có tên");

    var cover = buildCover(item.thumb_url || item.poster_url, cdnImage);

    // Author
    var author = "Đang cập nhật";
    if (item.author && item.author.length > 0) {
        var authors = [];
        for (var i = 0; i < item.author.length; i++) {
            var a = trimText(item.author[i]);
            if (a && a.toLowerCase() !== "đang cập nhật" && a.toLowerCase() !== "dang cap nhat") {
                authors.push(a);
            }
        }
        if (authors.length > 0) author = authors.join(", ");
    }

    // Genres
    var genres = [];
    var seenG = {};
    var cats = item.category || [];
    for (var j = 0; j < cats.length; j++) {
        var c = cats[j];
        if (!c || !c.slug || !c.name || seenG[c.slug]) continue;
        seenG[c.slug] = true;
        genres.push({
            title: trimText(c.name),
            input: API_BASE + "/the-loai/" + c.slug,
            script: "gen.js"
        });
    }

    // Status
    var statusRaw = String(item.status || "").toLowerCase();
    var ongoing = statusRaw !== "completed" && statusRaw !== "complete" && statusRaw !== "done";
    var statusText = "Đang tiến hành";
    if (statusRaw === "completed") statusText = "Đã hoàn thành";
    else if (statusRaw === "coming_soon") statusText = "Sắp ra mắt";

    // Chapter count (lấy từ server_data[0] đầu tiên)
    var chapterCount = 0;
    if (item.chapters && item.chapters.length > 0) {
        var sv = item.chapters[0].server_data || [];
        chapterCount = sv.length;
    }

    var description = stripHtml(item.content || "");

    var infoParts = [];
    infoParts.push("Tác giả: " + author);
    if (chapterCount > 0) infoParts.push("Số chương: " + chapterCount);
    infoParts.push("Trạng thái: " + statusText);
    if (genres.length > 0) {
        var gnames = [];
        for (var k = 0; k < genres.length; k++) gnames.push(genres[k].title);
        infoParts.push("Thể loại: " + gnames.join(", "));
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: infoParts.join("<br>"),
        ongoing: ongoing,
        genres: genres
    });
}
