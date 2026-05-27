load('config.js');

function extractComicId(url) {
    var m = String(url).match(/\/truyen-tranh\/[a-z0-9-]+-(\d+)(?:\/|$)/);
    return m ? m[1] : null;
}

function execute(url) {
    var id = extractComicId(url);
    if (!id) return null;

    var json = apiGet("/api/web/comic/info/" + id, {});
    if (!json || json.code !== 0 || !json.data) return null;

    var d = json.data;
    var st = statusText(d.status);

    var author = d.authors;
    if (!author || author === "") author = "Đang cập nhật";

    var genres = [];
    if (d.genres && d.genres.length) {
        for (var i = 0; i < d.genres.length; i++) {
            var g = d.genres[i];
            if (!g || !g.slug_genre) continue;
            genres.push({
                title: g.name || g.slug_genre,
                input: "/api/web/comic/genres/" + g.slug_genre,
                script: "gen.js"
            });
        }
    }

    var infoBook = [
        "Tác giả: " + author,
        "Trạng thái: " + st.text,
        "Lượt xem: " + (d.total_views !== undefined ? d.total_views : 0),
        "Theo dõi: " + (d.followers !== undefined ? d.followers : 0)
    ];
    if (d.chapters && d.chapters.length) {
        infoBook.push("Số chương: " + d.chapters.length);
    }
    if (d.other_names && d.other_names.length) {
        infoBook.push("Tên khác: " + d.other_names.join(", "));
    }

    var description = d.description || "";
    if (description === "No description available") description = "";

    return Response.success({
        name: d.title || "",
        cover: d.thumbnail || "",
        host: SITE_URL,
        author: author,
        description: description,
        detail: infoBook.join("<br>"),
        ongoing: st.ongoing,
        genres: genres
    });
}
