load("config.js");

function execute(url) {
    // Fetch chapter page directly (no browser needed, matching Tachiyomi approach)
    var res = fetch(url, {
        headers: {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": BASE_URL + "/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5"
        }
    });

    if (!res || !res.ok) {
        return Response.error("Không tải được trang chương: " + (res ? res.status : "null"));
    }

    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    var images = [];
    var seen = {};

    // Primary selector (Tachiyomi: #view-chapter img)
    var imgEls = doc.select("#view-chapter img");

    // Fallback selectors (matching Tachiyomi's fallback chain)
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-detail .page-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".chapter-content img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-content img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".content-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-detail .page-chapter img[data-index]");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".box_doc .page-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-detail img");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        // Try multiple src attributes
        var src = img.attr("src") || "";
        if (!src) src = img.attr("data-src") || "";
        if (!src) src = img.attr("data-original") || "";
        if (!src) src = img.attr("data-cdn") || "";
        if (!src) continue;

        src = src.trim();

        // Skip non-content images
        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("avatar") >= 0) continue;
        if (src.indexOf("icon") >= 0) continue;
        if (src.indexOf("avata.png") >= 0) continue;
        if (src.indexOf("/Content/") >= 0) continue;
        if (src.indexOf("googleusercontent") >= 0) continue;
        if (src.indexOf("1x1") >= 0) continue;
        if (src.indexOf("blank.") >= 0) continue;

        // Resolve URL
        if (src.indexOf("//") === 0) {
            src = "https:" + src;
        } else if (src.indexOf("http") !== 0) {
            if (src.charAt(0) === "/") {
                src = BASE_URL + src;
            }
        }

        // Deduplicate
        if (seen[src]) continue;
        seen[src] = true;

        images.push(src);
    }

    // If no images found, check for login requirement (matching Tachiyomi)
    if (images.length === 0) {
        var loginHint = selFirst(doc, "a[href*='/Account/Login']");
        if (!loginHint) loginHint = selFirst(doc, "a[href*='/dang-nhap']");
        if (!loginHint) loginHint = selFirst(doc, ".login-page-wrapper");

        if (loginHint) {
            return Response.error("Vui lòng đăng nhập bằng Webview để xem chương này");
        }

        return Response.error("Không tìm thấy ảnh chương");
    }

    return Response.success(images);
}
