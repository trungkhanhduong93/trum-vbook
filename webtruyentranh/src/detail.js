load('config.js');

function execute(url) {
    if (url.startsWith("/")) url = BASE_URL + url;

    let doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    // Title
    let title = doc.select("h1").text().trim();

    // Cover — og:image is most reliable
    let coverEl = doc.selectFirst("meta[property='og:image']");
    let cover = coverEl ? coverEl.attr("content") : "";
    if (!cover) {
        let imgEl = doc.selectFirst("img.w-full, img.rounded-lg");
        cover = imgEl ? (imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
    }

    // Try JSON-LD first for description, author, genres
    let ld = parseJsonLd(doc);
    let desc = "";
    let author = "Đang cập nhật";
    let genres = [];

    if (ld) {
        desc = ld["description"] || "";
        if (ld["author"] && ld["author"]["name"]) author = ld["author"]["name"];
        let genreArr = ld["genre"];
        if (genreArr && genreArr.length) {
            for (let i = 0; i < genreArr.length; i++) genres.push(genreArr[i]);
        }
    }

    // Fallback: author from page metadata divs
    if (author === "Đang cập nhật") {
        let metaDivs = doc.select("div.flex.items-center");
        for (let i = 0; i < metaDivs.size(); i++) {
            let txt = metaDivs.get(i).text();
            if (txt.indexOf("Tác giả") !== -1) {
                let span = metaDivs.get(i).selectFirst("span.ml-2");
                if (span) { author = span.text().trim(); break; }
            }
        }
    }

    // Fallback: description from longest paragraph
    if (!desc) {
        let paras = doc.select("p");
        for (let i = 0; i < paras.size(); i++) {
            let t = paras.get(i).text().trim();
            if (t.length > desc.length && t.length > 50) desc = t;
        }
    }

    return Response.success({
        name: title,
        cover: cover,
        author: author,
        description: desc,
        detail: genres.length ? "Thể loại: " + genres.join(", ") : "",
        host: BASE_URL
    });
}
