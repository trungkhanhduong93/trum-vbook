load('config.js');

function execute(url) {
    var sUrl = String(url);
    var html = httpGet(sUrl);
    if (!html) return null;

    // === Tiêu đề ===
    // Lấy từ JSON-LD trước (chắc chắn), fallback sang <h1>
    var name = "";
    var ldM = html.match(/"@type"\s*:\s*"ComicSeries"[\s\S]{0,1500}?"name"\s*:\s*"([^"]+)"/);
    if (ldM) name = ldM[1].trim();
    if (!name) {
        var h1M = html.match(/<h1[^>]*class="[^"]*text-white[^"]*font-extrabold[^"]*"[^>]*>\s*([\s\S]{0,200}?)\s*<\/h1>/);
        if (h1M) name = strip(h1M[1]);
    }
    if (!name) {
        var titleM = html.match(/<title>\s*Đọc\s+([\s\S]+?)\s+chương/);
        if (titleM) name = strip(titleM[1]);
    }
    if (!name) return null;

    // === Ảnh bìa: og:image ===
    var cover = "";
    var ogM = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (ogM) cover = ogM[1];
    if (!cover) {
        var ldImgM = html.match(/"@type"\s*:\s*"ComicSeries"[\s\S]{0,1500}?"image"\s*:\s*"([^"]+)"/);
        if (ldImgM) cover = ldImgM[1];
    }

    // === Tác giả: JSON-LD author.name ===
    var author = "Đang cập nhật";
    var authM = html.match(/"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
    if (authM) {
        var a = authM[1].trim();
        if (a) author = a;
    }

    // === Thể loại: <a href="/tag/{uuid}" ...>{name}</a> ===
    var genres = [];
    var seenG = {};
    var gre = /href="(?:https?:\/\/[^"]*cuutruyen\.cc)?(\/tag\/[a-z0-9-]+)"[^>]*>\s*([\s\S]{0,200}?)\s*<\/a>/g;
    var gm;
    while ((gm = gre.exec(html)) !== null) {
        var input = gm[1];
        var label = strip(gm[2]);
        if (!label || seenG[input]) continue;
        seenG[input] = true;
        genres.push({ title: label, input: input, script: "gen.js" });
    }

    // === Mô tả: #manga-description ===
    var description = "";
    var descM = html.match(/id="manga-description"[^>]*>([\s\S]{0,3000}?)<\/div>/);
    if (descM) description = strip(descM[1]);
    if (!description) {
        var ldDescM = html.match(/"@type"\s*:\s*"ComicSeries"[\s\S]{0,1500}?"description"\s*:\s*"([^"]+)"/);
        if (ldDescM) description = strip(ldDescM[1]);
    }

    // === Tình trạng: site không hiển thị → mặc định ===
    var ongoing = true;

    // === Info ===
    var info = [];
    info.push("Tác giả: " + author);
    if (genres.length > 0) {
        var gnames = [];
        for (var i = 0; i < genres.length; i++) gnames.push(genres[i].title);
        info.push("Thể loại: " + gnames.join(", "));
    }
    info.push("Trạng thái: Đang tiến hành");

    return Response.success({
        name: name,
        cover: cover,
        host: SITE_URL,
        author: author,
        description: description,
        detail: info.join("<br>"),
        ongoing: ongoing,
        genres: genres
    });
}
