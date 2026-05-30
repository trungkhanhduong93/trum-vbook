load('config.js');

function execute(url) {
    // bookId là segment số cuối của URL: .../{TYPE}/books/{bookId}
    var bookId = String(url).split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop();
    if (!bookId) return Response.error("URL không hợp lệ");

    var data = jsonGet(API + "/books/" + bookId);
    if (!data || !data.book) return Response.error("Không tải được thông tin truyện");
    var b = data.book;

    var name = b.title || "";
    var cover = bookCover(b);
    var author = b.author || "";
    var altName = parseAltName(b.anotherName);
    var ongoing = (b.status !== 2);
    var description = b.description || "";

    // Thể loại: tags = [{tag:{tagId,name}}]
    var genres = [];
    if (b.tags && b.tags.length) {
        for (var i = 0; i < b.tags.length; i++) {
            var t = b.tags[i].tag || b.tags[i];
            if (!t || !t.tagId || !t.name) continue;
            genres.push({
                title: t.name,
                input: "/" + TYPE + "/the-loai/" + t.tagId,
                script: "gen.js"
            });
        }
    }

    // Thông tin gộp
    var parts = [];
    if (altName && altName !== name) parts.push("Tên khác: " + altName);
    if (author) parts.push("Tác giả: " + author);
    if (b.totalViews) parts.push("👁 Lượt xem: " + b.totalViews);
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
