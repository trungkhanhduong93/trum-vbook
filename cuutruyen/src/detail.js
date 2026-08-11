load("config.js");

function execute(url) {
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện");

    var titleEl = selFirst(doc, "h1");
    var name = titleEl ? String(titleEl.text()).trim() : "";
    if (!name) return Response.error("Không đọc được tên truyện");

    // Trang có 2 ảnh bìa: banner nền (bản gốc, đo được 12MB) và ảnh bìa .256.jpg.
    // Lấy ảnh bìa rồi nâng lên .512.jpg — nét hơn mà vẫn ~250KB.
    var cover = "";
    var coverEl = selFirst(doc, "img[src*='.256.jpg']");
    if (!coverEl) coverEl = selFirst(doc, "img[src*='/covers/']");
    if (coverEl) cover = coverAt(absUrl(coverEl.attr("src")), 512);

    var author = "";
    var authorEl = selFirst(doc, "h2.font-head");
    if (authorEl) author = String(authorEl.text()).trim();

    var description = "";
    var descEl = selFirst(doc, "#manga-description");
    if (descEl) description = String(descEl.text()).trim().replace(/\s+/g, " ");

    // Thẻ của chính truyện nằm trong khối tag phía trên; phần "truyện tương tự"
    // không kèm link /tag/ nên không cần lọc thêm.
    var genres = [];
    var gSeen = {};
    var tagLinks = doc.select("a[href*='/tag/']");
    for (var i = 0; i < tagLinks.size(); i++) {
        var gl = tagLinks.get(i);
        var gn = String(gl.text()).trim();
        var gh = absUrl(gl.attr("href"));
        if (!gn || !gh || gSeen[gh]) continue;
        gSeen[gh] = true;
        genres.push({ title: gn, input: gh, script: "gen.js" });
    }

    var parts = [];
    if (author) parts.push("Tác giả: " + author);
    var total = doc.select("div.chapter-item").size();
    if (total > 0) parts.push("Số chương: " + total);

    // Site không hiển thị tình trạng truyện ở bất kỳ đâu trên trang chi tiết —
    // để mặc định "đang tiến hành" thay vì đoán bừa.
    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: parts.join("<br>"),
        ongoing: true,
        genres: genres
    });
}
