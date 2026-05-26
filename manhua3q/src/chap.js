load("config.js");

function execute(url) {
    if (url.indexOf("http") !== 0) url = resolveUrl(url);

    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang chương");

    var html = doc.html();
    if (!html) return Response.error("HTML rỗng");

    // Robust regex to extract images block
    var imagesMatch = html.match(/images(?:\\*")?\s*:\s*(?:\\*")?\[([\s\S]*?)\]/);
    if (!imagesMatch) return Response.error("Không tìm thấy mảng images. HTML len=" + html.length);

    var block = imagesMatch[1];

    // Robust regex to match src URLs regardless of backslash escape count
    var srcRegex = /\\*"?src\\*"?:\s*\\*"([^"\\]+)/g;

    var images = [];
    var seen = {};
    var m;
    while ((m = srcRegex.exec(block)) !== null) {
        var raw = m[1];
        // Decode \u0026 -> &
        raw = raw.replace(/\\u0026/g, "&");
        // Decode &amp; -> &
        raw = raw.replace(/&amp;/g, "&");
        // Decode \/ -> /
        raw = raw.replace(/\\\//g, "/");
        if (!raw) continue;
        if (raw.indexOf("//") === 0) raw = "https:" + raw;
        if (seen[raw]) continue;
        seen[raw] = true;
        images.push(raw);
    }

    if (images.length === 0) {
        return Response.error("Inner regex 0 hits. Block sample: " + block.substring(0, 200));
    }

    return Response.success(images);
}
