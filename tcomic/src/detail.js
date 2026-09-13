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

    // 13/422 truyện có thumbnail rỗng từ API (đo 13/09/2026). Fallback:
    // lấy ảnh đầu tiên không phải banner/quảng cáo từ chương cũ nhất.
    var cover = d.thumbnail ? resolveUrl(d.thumbnail) : "";
    if (!cover && d.chapters && d.chapters.length) {
        var oldest = d.chapters[d.chapters.length - 1];
        if (oldest && oldest.id !== undefined) {
            try {
                var cj = apiGet("/api/web/comic/chapters/" + oldest.id, {comicId: id});
                if (cj && cj.code === 0 && cj.data && cj.data.images) {
                    var imgs = cj.data.images;
                    var junkWords = ["banner", "introduce", "/ads", "logo", "watermark"];
                    for (var k = 0; k < imgs.length; k++) {
                        var src = imgs[k] && imgs[k].src ? String(imgs[k].src).trim() : "";
                        if (!src) continue;
                        var lower = src.toLowerCase();
                        var isJunk = false;
                        for (var jj = 0; jj < junkWords.length; jj++) {
                            if (lower.indexOf(junkWords[jj]) >= 0) { isJunk = true; break; }
                        }
                        if (!isJunk) { cover = resolveUrl(src); break; }
                    }
                }
            } catch (eCover) {}
        }
    }

    return Response.success({
        name: d.title || "",
        cover: cover,
        host: SITE_URL,
        author: author,
        description: description,
        detail: infoBook.join("<br>"),
        ongoing: st.ongoing,
        genres: genres
    });
}
