load("config.js");

function stripHtml(s) {
    if (!s) return "";
    return String(s)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function execute(url) {
    var id = mangaIdFromUrl(url);
    if (!id) return Response.error("Không đọc được mã truyện từ đường dẫn.");

    var json = apiGet("/mangas/" + id);
    if (!json || !json.data) return Response.error("Không tải được thông tin truyện.");
    var m = json.data;

    var author = (m.author && m.author.name) ? String(m.author.name) : "";
    var team = (m.team && m.team.name) ? String(m.team.name) : "";

    var genres = [];
    if (m.tags && m.tags.length) {
        for (var i = 0; i < m.tags.length; i++) {
            var t = m.tags[i];
            var label = String(t.name || "");
            if (!label) continue;
            genres.push({ title: label, input: tagPath(label), script: "gen.js" });
        }
    }

    var bits = [];
    if (author) bits.push("Tác giả: " + author);
    if (team) bits.push("Nhóm dịch: " + team);
    if (m.chapters_count) bits.push("Số chương: " + m.chapters_count);
    if (m.views_count) bits.push("Lượt xem: " + m.views_count);
    if (m.is_nsfw) bits.push("18+");

    var desc = stripHtml(m.full_description || m.description || "");

    return Response.success({
        name: String(m.name || ""),
        cover: imgUrl(m.cover_url || m.cover_mobile_url),
        host: HOST,
        author: author,
        description: desc,
        detail: bits.join("<br>"),
        ongoing: true,
        genres: genres
    });
}
