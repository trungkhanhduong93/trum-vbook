load('config.js');

function execute(url) {
    var bookId = String(url).split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop();
    if (!bookId) return Response.error("URL không hợp lệ");

    var data = jsonGet(API + "/books/" + bookId);
    if (!data || !data.data || !data.data.book) return Response.error("Không tải được thông tin truyện");
    var b = data.data.book;

    var name = (b.info && b.info.title) ? b.info.title : (b.title || "");
    var cover = bookCover(b);
    var author = b.author || "";
    var altName = parseAltName(b.anotherName);
    var ongoing = (b.status !== 2);
    var description = b.description || "";

    var genres = [];
    if (b.tags && b.tags.length) {
        for (var i = 0; i < b.tags.length; i++) {
            var t = b.tags[i].tag || b.tags[i];
            if (!t || (!t.tagId && !t.attributeId) || !t.name) continue;
            var tagId = t.tagId || t.attributeId;
            genres.push({
                title: t.name,
                input: "/" + TYPE + "/the-loai/" + tagId,
                script: "gen.js"
            });
        }
    }

    var parts = [];
    if (altName && altName !== name) parts.push("Tên khác: " + altName);
    if (author) parts.push("Tác giả: " + author);
    if (b.totalViews || (b._count && b._count.views)) parts.push("👁 Lượt xem: " + (b.totalViews || b._count.views));
    if (b._count && b._count.usersFollow) parts.push("🔖 Theo dõi: " + b._count.usersFollow);
    var totalCh = bookTotalChapters(b);
    if (totalCh) parts.push("📚 Số chương: " + totalCh);
    if (b.chapterLatest && b.chapterLatest.num) parts.push("Chương mới nhất: " + b.chapterLatest.num);
    var detail = parts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
