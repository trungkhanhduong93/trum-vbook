load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    // Lấy section chapter list
    var listM = html.match(/id="chapter-list"[^>]*>([\s\S]+?)<\/ul>/);
    if (!listM) return null;

    var section = listM[1];
    var list = [];

    // Parse từng chapter link
    var re = /href="(\/\/metruyen18\.net\/truyen\/[^"]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)</g;
    var m;
    while ((m = re.exec(section)) !== null) {
        var chapUrl = toAbs(m[1]);
        var title   = m[2].trim();
        var name    = m[3].trim();
        if (!chapUrl) continue;
        // Dùng title (BẠN HỌC Chapter 35) hoặc text (Chapter 35)
        list.push({
            name: name || title,
            url: chapUrl,
            host: SITE_URL
        });
    }

    if (list.length === 0) return null;

    // Đảo thứ tự: API trả về mới nhất trước, ta muốn cũ nhất trước
    list.reverse();
    return Response.success(list);
}
