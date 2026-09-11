load("config.js");

function execute(url) {
    var fullUrl = resolveUrl(url);
    var html = "";

    try {
        var resp = fetchRetry(fullUrl);
        if (resp && resp.ok) {
            if (typeof resp.string === "function") {
                html = resp.string();
            } else if (typeof resp.text === "function") {
                html = resp.text();
            } else if (typeof resp.html === "function") {
                var d = resp.html();
                if (d) html = d.html();
            }
        }
    } catch (eResp) {}

    if (!html) {
        try {
            html = Http.get(fullUrl).headers(FETCH_HEADERS).string();
        } catch (eHttp) {}
    }

    if (!html) {
        return Response.error("Không thể tải nội dung chương");
    }

    var images = [];
    var seen = {};

    var regex = /https?:(?:\\\/|\/){2}[^"'\s<>\)]+?\/manga-images\/[^"'\s<>\)]+?\.(?:webp|jpg|jpeg|png|avif)/gi;
    var match;
    while ((match = regex.exec(html)) !== null) {
        var rawUrl = match[0];
        var cleanUrl = rawUrl.replace(/\\\//g, "/").replace(/\\/g, "").replace(/["'\\]+$/, "").trim();
        cleanUrl = resolveUrl(cleanUrl);
        if (!seen[cleanUrl]) {
            seen[cleanUrl] = true;
            images.push(cleanUrl);
        }
    }

    if (images.length === 0) {
        var doc = null;
        try {
            if (typeof Html !== "undefined" && typeof Html.parse === "function") {
                doc = Html.parse(html);
            }
        } catch (eParse) {}

        if (doc) {
            var imgEls = doc.select("img");
            for (var i = 0; i < imgEls.size(); i++) {
                var el = imgEls.get(i);
                var src = imgSrc(el);
                if (!src) continue;
                if (src.indexOf("data:image") === 0) continue;
                if (src.indexOf("logo") >= 0 || src.indexOf("icon") >= 0 || src.indexOf("avatar") >= 0) continue;
                if (src.indexOf("manga-images") >= 0 || src.indexOf("/0001/") >= 0) {
                    if (!seen[src]) {
                        seen[src] = true;
                        images.push(src);
                    }
                }
            }
        }
    }

    if (images.length === 0) {
        return Response.error("Không tìm thấy ảnh của chương");
    }

    return Response.success(images);
}
