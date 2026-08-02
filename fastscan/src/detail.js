load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang truyện");

    // Title
    var titleEl = selFirst(doc, "h1");
    if (!titleEl) titleEl = selFirst(doc, ".book_info h1");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".book_avatar img");
    if (!coverEl) coverEl = selFirst(doc, ".thumb img");
    if (!coverEl) coverEl = selFirst(doc, "img");
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        cover = resolveUrl(cover);
    }

    // Author
    var author = "";
    var authorEl = selFirst(doc, ".author a, .org_author a");
    if (!authorEl) authorEl = selFirst(doc, ".author");
    if (authorEl) author = authorEl.text().trim();

    // Status — trang ghi "Hoàn Thành" (T hoa), so sánh phải hạ chữ thường.
    var statusText = "Đang cập nhật";
    var ongoing = true;
    var statusEl = selFirst(doc, "li.status");
    if (!statusEl) statusEl = selFirst(doc, ".list-info");
    if (statusEl) {
        var infoTxt = String(statusEl.text()).toLowerCase();
        if (infoTxt.indexOf("hoàn thành") >= 0 || infoTxt.indexOf("full") >= 0) {
            statusText = "Hoàn thành";
            ongoing = false;
        }
    }

    // Genres — chỉ lấy trong .list01 của truyện. KHÔNG fallback quét toàn trang:
    // có truyện thật sự không gắn thể loại nào (vd em-san-long-lam-ban-gai-thu-hai-7619),
    // fallback sẽ nuốt nguyên mega-menu 62 thể loại của site gán vào truyện đó.
    var genreLinks = doc.select(".list01 a[href*='/the-loai/']");
    var genres = [];
    var gSeen = {};
    for (var i = 0; i < genreLinks.size(); i++) {
        var gl = genreLinks.get(i);
        var gn = gl.text().trim();
        var gh = gl.attr("href") || "";
        if (!gn || !gh) continue;
        gh = resolveUrl(gh);
        if (gSeen[gh]) continue;
        gSeen[gh] = true;
        genres.push({
            title: gn,
            input: gh,
            script: "gen.js"
        });
    }

    // Description
    var description = "";
    var descEl = selFirst(doc, ".detail-content, .story-detail-info, .book_description");
    if (descEl) description = descEl.text().trim();

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);

    var chapLinks = doc.select(".list_chapter a[href*='/chuong-']");
    if (chapLinks) {
        var totalChaps = 0;
        var cSeen = {};
        for (var k = 0; k < chapLinks.size(); k++) {
            var chHref = chapLinks.get(k).attr("href") || "";
            var chTxt = chapLinks.get(k).text().trim();
            if (chHref && chTxt && chTxt !== "Đọc từ đầu" && chTxt !== "Đọc tiếp" && !cSeen[chHref]) {
                cSeen[chHref] = true;
                totalChaps++;
            }
        }
        if (totalChaps > 0) detailParts.push("Tổng số chương: " + totalChaps);
    }

    var detail = detailParts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
