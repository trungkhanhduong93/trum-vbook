load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = url;
    if (url.indexOf("http") !== 0) {
        fetchUrl = BASE_URL + "/tim-kiem-nang-cao?keyword=" + encodeURIComponent(url) + "&page=" + p;
    } else {
        if (p > 1) {
            if (fetchUrl.indexOf("?") > 0) fetchUrl += "&page=" + p;
            else fetchUrl += "?page=" + p;
        }
    }

    var doc = fetchRetry(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var html = doc.html();
    var items = [];
    var seen = {};

    var pattern = /\\"id\\":\d+,\\"name\\":\\"([^\\"]+)\\",\\"origin_name\\":(?:null|\\"[^\\"]*\\"),\\"slug\\":\\"([^\\"]+)\\",(?:.*?)\\"thumbnail\\":\\"([^\\"]+)\\",(?:.*?)\\"last_chapter\\":\s*(?:null|\\*\{\s*\\"id\\":\d+,\s*\\"name\\":\\"([^\\"]+)\\")/g;
    var m;
    while ((m = pattern.exec(html)) !== null) {
        var name = m[1];
        var slug = m[2];
        var cover = m[3];
        var chap = m[4] ? m[4] + " Chương" : "";
        var link = BASE_URL + "/" + slug;
        
        if (seen[link]) continue;
        seen[link] = true;

        items.push({
            name: name,
            link: link,
            cover: cover,
            description: chap,
            host: BASE_URL
        });
    }

    var next = String(p + 1);
    if (items.length === 0) next = "";

    return Response.success(items, next);
}
