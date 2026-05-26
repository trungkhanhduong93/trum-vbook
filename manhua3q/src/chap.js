load("config.js");

function execute(url) {
    if (url.indexOf("http") !== 0) url = resolveUrl(url);

    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang chương");

    var html = doc.html();
    if (!html) return Response.error("HTML rỗng");

    // Images are embedded in Next.js Server Component data as:
    //   \"images\":[{\"src\":\"URL\\u0026host=gg\", ...}, ...]
    // (backslash-escaped JSON inside a JS string)
    var imagesMatch = html.match(/\\"images\\":\[([\s\S]*?)\]/);
    if (!imagesMatch) return Response.error("Không tìm thấy mảng images trong HTML");

    var block = imagesMatch[1];
    var BS = String.fromCharCode(92); // single backslash literal
    var srcPattern = new RegExp(BS + '"src' + BS + '":' + BS + '"([^"]+?)' + BS + '"', "g");

    var images = [];
    var seen = {};
    var m;
    while ((m = srcPattern.exec(block)) !== null) {
        var raw = m[1];
        // Decode & → & (and any other common unicode escapes)
        var unicodeEsc = BS + "u0026";
        while (raw.indexOf(unicodeEsc) !== -1) raw = raw.replace(unicodeEsc, "&");
        // Decode \/ → / just in case
        var slashEsc = BS + "/";
        while (raw.indexOf(slashEsc) !== -1) raw = raw.replace(slashEsc, "/");
        if (!raw) continue;
        if (raw.indexOf("//") === 0) raw = "https:" + raw;
        if (seen[raw]) continue;
        seen[raw] = true;
        images.push(raw);
    }

    if (images.length === 0) return Response.error("Regex chạy nhưng không trích xuất được URL nào");

    return Response.success(images);
}
