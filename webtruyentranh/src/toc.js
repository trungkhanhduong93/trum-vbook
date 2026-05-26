load('config.js');

function execute(url) {
    if (url.startsWith("/")) url = BASE_URL + url;

    let doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    let chapters = [];
    let added = {};
    let links = doc.select("a[href*='/doc-truyen/']");

    for (let i = 0; i < links.size(); i++) {
        let a = links.get(i);
        let href = a.attr("href");
        if (!href || added[href]) continue;
        added[href] = true;
        if (href.startsWith("/")) href = BASE_URL + href;
        let name = a.text().trim();
        if (!name) continue;
        chapters.push({ name: name, url: href, host: BASE_URL });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");

    // Site shows newest chapter first — reverse to oldest-first for VBook
    chapters.reverse();

    return Response.success(chapters);
}
