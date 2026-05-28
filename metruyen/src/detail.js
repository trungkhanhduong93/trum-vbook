load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    // === Tiêu đề ===
    var titleM = html.match(/class="post-title"[^>]*>\s*<h1[^>]*>\s*([^<]+)\s*<\/h1>/);
    var name = titleM ? titleM[1].trim() : "";
    if (!name) return null;

    // === Ảnh bìa ===
    var coverM = html.match(/class="summary_image"[\s\S]{0,200}?data-src="([^"]+)"/);
    var cover = coverM ? toAbs(coverM[1]) : "";

    // === Tác giả ===
    var author = "Đang cập nhật";
    var authorM = html.match(/Tác giả[\s\S]{0,80}?class="summary-content"[^>]*>\s*([^<]+)\s*</);
    if (authorM) {
        var a = authorM[1].trim();
        if (a && a !== "Đang cập nhật") author = a;
    }

    // === Tình trạng ===
    var ongoing = true;
    var statusM = html.match(/Tình trạng[\s\S]{0,200}?class="summary-content"[^>]*[^>]*>\s*([^<]+)\s*</);
    if (statusM) {
        var st = statusM[1].trim().toUpperCase();
        if (st.indexOf("HOÀN") !== -1 || st.indexOf("HOAN") !== -1 || st.indexOf("COMPLETE") !== -1) {
            ongoing = false;
        }
    }

    // === Mô tả ===
    var description = "";
    var descM = html.match(/class="dsct"[^>]*>[\s\S]{0,20}?<p[^>]*>([\s\S]+?)<\/p>/);
    if (descM) {
        description = strip(descM[1]);
        if (description.indexOf("đang được cập nhật") !== -1) description = "";
    }

    // === Thể loại ===
    var genres = [];
    var genreM = html.match(/Thể loại[\s\S]{0,100}?class="summary-content"[^>]*>([\s\S]{0,1000}?)<\/div>/);
    if (genreM) {
        var genreBlock = genreM[1];
        var gr = /href="(\/\/metruyen18\.net\/the-loai\/([a-z0-9-]+))"[^>]*>([^<]+)</g;
        var gm;
        while ((gm = gr.exec(genreBlock)) !== null) {
            genres.push({
                title: gm[3].trim(),
                input: "/the-loai/" + gm[2],
                script: "gen.js"
            });
        }
    }

    // === Lượt xem ===
    var views = "";
    var viewM = html.match(/Lượt xem[\s\S]{0,80}?class="summary-content"[^>]*>\s*([^<]+)\s*</);
    if (viewM) views = viewM[1].trim();

    var infoBook = [];
    infoBook.push("Tác giả: " + author);
    infoBook.push("Trạng thái: " + (ongoing ? "Đang tiến hành" : "Đã hoàn thành"));
    if (views) infoBook.push("Lượt xem: " + views);

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
