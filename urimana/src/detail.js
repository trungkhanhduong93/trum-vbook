load("config.js");

function execute(url) {
    if (url.startsWith("/")) url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    var titleEl = doc.selectFirst("h1");
    var name = titleEl ? trimText(titleEl.text()) : "";

    var cover = "";
    var coverEl = doc.selectFirst(".thumb-main img");
    if (!coverEl) coverEl = doc.selectFirst(".truyen-thumbnail-wrapper img");
    if (coverEl) {
        cover = resolveUrl(coverEl.attr("data-src") || coverEl.attr("src") || "");
    }
    
    // Lọc bỏ ảnh logo làm cover lỗi
    if (cover && (cover.indexOf("logo") !== -1 || cover.indexOf("icon") !== -1 || cover.indexOf("default") !== -1)) {
        cover = "";
    }

    var author = "Đang cập nhật";
    var authorEl = doc.selectFirst(".info-author");
    if (authorEl) {
        var authorText = authorEl.text();
        author = trimText(authorText.replace(/T\u00e1c gi\u1ea3:/i, "")); // Unicode cho Tác giả:
        if (!author) author = "Đang cập nhật";
    }

    var genres = [];
    var genreEls = doc.select(".info-genre a.genre-link");
    for (var i = 0; i < genreEls.size(); i++) {
        var gText = trimText(genreEls.get(i).text());
        if (gText) genres.push(gText);
    }

    var description = "";
    var descEl = doc.selectFirst(".truyen-content");
    if (descEl) {
        description = trimText(descEl.text());
        // Dọn dẹp tiêu đề con trong description nếu cần thiết, ví dụ: "Giới thiệu truyện..."
        if (description.indexOf("Gi\u1edbi thi\u1ec7u truy\u1ec7n") === 0) { // Giới thiệu truyện
            var lines = description.split("\n");
            if (lines.length > 1) {
                lines.shift();
                description = trimText(lines.join("\n"));
            }
        }
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: "Thể loại: " + genres.join(", "),
        host: BASE_URL
    });
}
