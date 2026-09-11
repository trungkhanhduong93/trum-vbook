load("config.js");

function execute(url) {
    var resp = fetchRetry(url);
    if (!resp || !resp.ok) {
        return Response.error("Không thể tải nội dung chương");
    }

    var html = resp.text();
    var images = [];
    var seen = {};

    var regex = /https?:\/\/vnht\.vinahentai\.click\/manga-images\/[^"'\s<>\)]+?\.(?:webp|jpg|jpeg|png)/gi;
    var match;
    while ((match = regex.exec(html)) !== null) {
        var imgUrl = match[0];
        imgUrl = imgUrl.replace(/["'\\]+$/, "");
        if (!seen[imgUrl]) {
            seen[imgUrl] = true;
            images.push(imgUrl);
        }
    }

    if (images.length === 0) {
        var doc = resp.html();
        var imgEls = doc.select("img");
        for (var i = 0; i < imgEls.size(); i++) {
            var el = imgEls.get(i);
            var src = imgSrc(el);
            if (src && src.indexOf("manga-images") >= 0 && !seen[src]) {
                seen[src] = true;
                images.push(src);
            }
        }
    }

    if (images.length === 0) {
        return Response.error("Không tìm thấy ảnh của chương");
    }

    return Response.success(images);
}
