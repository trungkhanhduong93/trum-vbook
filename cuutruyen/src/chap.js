load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    var data = [];
    var seen = {};

    // Ảnh chapter dùng lazy-load, URL thực nằm trong data-src
    // Ví dụ: data-src="https://dex.cdn-07077.workers.dev/?url=https%3A%2F%2F.../page.jpg"
    var re = /data-src="([^"]+)"/g;
    var m;
    while ((m = re.exec(html)) !== null) {
        var link = m[1].trim();
        if (!link) continue;
        // Bỏ qua data: placeholder và donate/icon
        if (link.indexOf("data:") === 0) continue;
        if (link.indexOf("/img/donate") !== -1) continue;
        if (link.indexOf("/img/icons") !== -1) continue;

        link = toAbs(link);
        if (seen[link]) continue;
        seen[link] = true;
        data.push(link);
    }

    if (data.length === 0) return null;
    return Response.success(data);
}
