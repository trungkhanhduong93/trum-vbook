load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    // Lấy section bảng chapter list
    var tableM = html.match(/<table[^>]*class="table[^"]*"[^>]*>([\s\S]+?)<\/table>/);
    if (!tableM) return null;

    var section = tableM[1];
    var list = [];

    // Parse từng chapter link: <a title="{name}" href="/truyen/{manga}/{chapter}/">
    var re = /<a title="([^"]+)" href="(\/truyen\/[a-z0-9-]+\/[a-z0-9.-]+\/)">/g;
    var m;
    while ((m = re.exec(section)) !== null) {
        var chapTitle = m[1].trim();
        var chapUrl = SITE_URL + m[2];
        list.push({
            name: chapTitle,
            url: chapUrl,
            host: SITE_URL
        });
    }

    if (list.length === 0) return null;

    // Detail page trả về mới nhất trước, đảo lại để đọc từ cũ → mới
    list.reverse();
    return Response.success(list);
}
