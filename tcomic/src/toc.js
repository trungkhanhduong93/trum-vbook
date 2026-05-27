load('config.js');

function extractComicId(url) {
    var m = String(url).match(/\/truyen-tranh\/[a-z0-9-]+-(\d+)(?:\/|$)/);
    return m ? m[1] : null;
}

function execute(url) {
    var id = extractComicId(url);
    if (!id) return null;

    var json = apiGet("/api/web/comic/info/" + id, {});
    if (!json || json.code !== 0 || !json.data || !json.data.chapters) return null;

    var chapters = json.data.chapters;
    var list = [];
    for (var i = 0; i < chapters.length; i++) {
        var c = chapters[i];
        if (!c || c.id === undefined) continue;
        list.push({
            name: c.name || ("Chương " + c.id),
            url: "/api/web/comic/chapters/" + c.id + "?comicId=" + id,
            host: SITE_URL
        });
    }

    if (list.length === 0) return null;

    list.reverse();
    return Response.success(list);
}
