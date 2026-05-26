load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    // Tên truyện
    var titleEl = selFirst(doc, "h1");
    var name = titleEl ? trimText(titleEl.text()) : "";
    // Loại bỏ phần " - Chapter xxx" nếu có
    if (name.indexOf(" - Chapter") > 0) {
        name = name.substring(0, name.indexOf(" - Chapter"));
    }

    // Ảnh bìa
    var cover = "";
    var coverEl = selFirst(doc, ".book_avatar img");
    if (!coverEl) coverEl = selFirst(doc, ".book_detail img");
    if (coverEl) {
        cover = coverEl.attr("src") || coverEl.attr("data-original") || "";
        if (cover && cover.indexOf("http") !== 0) {
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else cover = resolveUrl(cover);
        }
    }

    // Tác giả
    var author = "Đang cập nhật";
    var infoItems = doc.select(".book_info .book_other .org-size");
    for (var i = 0; i < infoItems.size(); i++) {
        var item = infoItems.get(i);
        var label = item.text();
        if (label.indexOf("Tác giả") >= 0 || label.indexOf("Author") >= 0) {
            var authorA = selFirst(item, "a");
            if (authorA) {
                author = trimText(authorA.text());
            }
            break;
        }
    }
    // Fallback tìm author từ detail-info
    if (author === "Đang cập nhật") {
        var storyInfo = doc.select(".story-detail-info p");
        for (var j = 0; j < storyInfo.size(); j++) {
            var pText = storyInfo.get(j).text();
            if (pText.indexOf("Tác giả") >= 0) {
                var aEl = selFirst(storyInfo.get(j), "a");
                if (aEl) author = trimText(aEl.text());
                break;
            }
        }
    }

    // Thể loại
    var genres = [];
    var genreEls = doc.select(".book_tags_content a");
    if (genreEls.size() === 0) genreEls = doc.select(".book_tags a");
    for (var k = 0; k < genreEls.size(); k++) {
        var gText = trimText(genreEls.get(k).text());
        if (gText) genres.push(gText);
    }

    // Mô tả
    var description = "";
    var descEl = selFirst(doc, ".detail-content");
    if (!descEl) descEl = selFirst(doc, ".story-detail-info");
    if (descEl) {
        description = trimText(descEl.text());
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: genres.length > 0 ? "Thể loại: " + genres.join(", ") : "",
        host: HOST
    });
}
