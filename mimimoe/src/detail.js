load("config.js");

function execute(url) {
    var id = extractMangaId(url);
    if (!id) return Response.error("URL truyện không hợp lệ");

    var res = apiFetch("/manga/" + id);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");

    var data;
    try {
        data = JSON.parse(res.text());
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }
    if (!data) return Response.error("Phản hồi trống");

    var name = data.title || "";
    var cover = data.cover_url || "";
    var description = data.description || "";

    // Authors
    var author = "";
    if (data.authors && data.authors.length) {
        var anames = [];
        for (var a = 0; a < data.authors.length; a++) {
            if (data.authors[a].name) anames.push(data.authors[a].name);
        }
        author = anames.join(", ");
    }

    // Genres
    var genres = [];
    if (data.genres && data.genres.length) {
        for (var g = 0; g < data.genres.length; g++) {
            var gn = data.genres[g];
            if (!gn || !gn.id || !gn.name) continue;
            genres.push({
                title: gn.name,
                input: "/manga?genre_id=" + gn.id,
                script: "gen.js"
            });
        }
    }

    // Suggests: parodies & characters
    var suggests = [];
    if (data.parodies && data.parodies.length) {
        for (var p = 0; p < data.parodies.length; p++) {
            var pd = data.parodies[p];
            if (!pd || !pd.id || !pd.name) continue;
            suggests.push({
                title: "Parody: " + pd.name,
                input: "/manga?parody_id=" + pd.id,
                script: "gen.js"
            });
        }
    }
    if (data.characters && data.characters.length) {
        for (var c = 0; c < data.characters.length; c++) {
            var ch = data.characters[c];
            if (!ch || !ch.id || !ch.name) continue;
            suggests.push({
                title: "Nhân vật: " + ch.name,
                input: "/manga?character_id=" + ch.id,
                script: "gen.js"
            });
        }
    }
    if (data.authors && data.authors.length) {
        for (var au = 0; au < data.authors.length; au++) {
            var auth = data.authors[au];
            if (!auth || !auth.id || !auth.name) continue;
            suggests.push({
                title: "Tác giả: " + auth.name,
                input: "/manga?author_id=" + auth.id,
                script: "gen.js"
            });
        }
    }

    // Detail block
    var detailParts = [];
    if (data.chapter_count) detailParts.push("Số chương: " + data.chapter_count);
    if (data.view) detailParts.push("👁 Lượt xem: " + data.view);
    if (data.follows) detailParts.push("🔖 Theo dõi: " + data.follows);
    if (data.total_likes) detailParts.push("❤ Thích: " + data.total_likes);
    if (data.is_reup) detailParts.push("Re-up: ✓");
    if (data.last_updated) {
        var lu = ("" + data.last_updated).substring(0, 10);
        detailParts.push("Cập nhật: " + lu);
    }
    var detail = detailParts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: true,
        genres: genres,
        suggests: suggests
    });
}
