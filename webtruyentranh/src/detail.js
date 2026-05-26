load('config.js');

function execute(url) {
    if (url.startsWith("/")) url = BASE_URL + url;

    let doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    let title = doc.select("h1").text().trim();

    // Cover — prefer og:image
    let cover = "";
    let ogList = doc.select("meta[property='og:image']");
    if (ogList.size() > 0) cover = ogList.get(0).attr("content") || "";
    if (!cover) {
        let imgList = doc.select("img.w-full");
        if (imgList.size() > 0) cover = imgList.get(0).attr("src") || imgList.get(0).attr("data-src") || "";
    }

    // Description, author, genres from JSON-LD
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

    // Fallback author
    if (author === "Đang cập nhật") {
        let metaDivs = doc.select("div.flex.items-center");
        for (let i = 0; i < metaDivs.size(); i++) {
            let mDiv = metaDivs.get(i);
            if (mDiv.text().indexOf("Tác giả") !== -1) {
                let spans = mDiv.select("span.ml-2");
                if (spans.size() > 0) { author = spans.get(0).text().trim(); break; }
            }
        }
    }

    // Fallback description
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
