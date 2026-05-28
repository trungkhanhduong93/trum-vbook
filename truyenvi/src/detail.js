load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    // === Tiêu đề ===
    var titleM = html.match(/itemprop="headline">([^<]+)<\/h1>/);
    var name = titleM ? titleM[1].trim() : "";
    if (!name) return null;

    // === Ảnh bìa ===
    var coverM = html.match(/itemprop="image"[^>]*alt="[^"]*"[^>]*src="([^"]+)"/);
    if (!coverM) coverM = html.match(/src="(https?:\/\/s[0-9]+\.truyenvi\.com\/Library\/[^"]+)"[^>]*class="img-fluid w-100/);
    var cover = coverM ? coverM[1] : "";

    // === Tác giả ===
    var author = "Đang cập nhật";
    var authorM = html.match(/Tác giả:\s*<span class="text-body">([^<]+)<\/span>/);
    if (authorM) {
        var a = authorM[1].trim();
        if (a) author = a;
    }

    // === Thể loại ===
    var genres = [];
    var genreM = html.match(/Thể loại:\s*<span class="text-body">([\s\S]{0,500}?)<\/span>/);
    if (genreM) {
        var genreBlock = genreM[1];
        var gr = /href='\/the-loai\/([a-z0-9-]+)\/1'>([^<]+)<\/a>/g;
        var gm;
        while ((gm = gr.exec(genreBlock)) !== null) {
            genres.push({
                title: gm[2].trim(),
                input: "/the-loai/" + gm[1] + "/1",
                script: "gen.js"
            });
        }
    }

    // === Mô tả ===
    var description = "";
    var descM = html.match(/itemprop="description">([^<]+(?:<br[^>]*>[^<]*)*)<\/span>/);
    if (descM) {
        description = strip(descM[1]);
    } else {
        var descM2 = html.match(/class="text-dark d-block"[^>]*itemprop="description">([\s\S]{0,1000}?)<\/span>/);
        if (descM2) description = strip(descM2[1]);
    }

    // === Tình trạng (mặc định đang tiến hành vì site không hiển thị rõ) ===
    var ongoing = true;

    // === Thông tin thêm ===
    var dateM = html.match(/itemprop="datePublished">([^<]+)<\/span>/);
    var dateStr = dateM ? dateM[1].trim() : "";

    var infoBook = [];
    infoBook.push("Tác giả: " + author);
    if (dateStr) infoBook.push("Ngày đăng: " + dateStr);
    infoBook.push("Trạng thái: Đang tiến hành");

    return Response.success({
        name: name,
        cover: cover,
        host: SITE_URL,
        author: author,
        description: description,
        detail: infoBook.join("<br>"),
        ongoing: ongoing,
        genres: genres
    });
}
