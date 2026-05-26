load("config.js");

function execute(url) {
    if (url.indexOf("http") !== 0) url = resolveUrl(url);

    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang chương");

    var html = doc.html();
    if (!html) return Response.error("HTML rỗng");

    // Manhua3q nhúng dữ liệu chapter trong Next.js Server Component data dưới dạng:
    //   \"images\":[{\"src\":\"URL&host=gg\", ...}, ...]
    // (escape JSON kép — \" thực sự là 2 ký tự backslash + quote)
    var imagesMatch = html.match(/\\"images\\":\[([\s\S]*?)\]/);
    if (!imagesMatch) return Response.error("Không tìm thấy mảng images. HTML len=" + html.length);

    var block = imagesMatch[1];

    // Regex literal — match literal \"src\":\"...\"
    var srcRegex = /\\"src\\":\\"([^"]+?)\\"/g;

    var images = [];
    var seen = {};
    var m;
    while ((m = srcRegex.exec(block)) !== null) {
        var raw = m[1];
        // Decode & → & (literal 6 chars trong URL)
        raw = raw.replace(/\\u0026/g, "&");
        // Decode \/ → /
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
