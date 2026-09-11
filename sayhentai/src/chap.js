load("config.js");

function execute(url) {
    var fullUrl = resolveUrl(url);
    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML chương");

    var images = [];
    var seen = {};

    var imgEls = doc.select("img.chapter-img, img[id^='image-'], .reading-detail img");
    if (imgEls.size() === 0) {
        imgEls = doc.select(".chapter-content img, .entry-content img, img");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var el = imgEls.get(i);
        var src = imgSrc(el);
        if (!src) continue;

        var sLower = src.toLowerCase();
        if (sLower.indexOf("logo") >= 0 || sLower.indexOf("banner") >= 0 || 
            sLower.indexOf("avatar") >= 0 || sLower.indexOf("icon") >= 0 ||
            sLower.indexOf("ads") >= 0 || sLower.indexOf("button") >= 0) {
            continue;
        }

        if (sLower.indexOf(".jpg") >= 0 || sLower.indexOf(".png") >= 0 || 
            sLower.indexOf(".webp") >= 0 || sLower.indexOf(".jpeg") >= 0 || 
            sLower.indexOf("pubtranxzyzz") >= 0 || sLower.indexOf("/hen/") >= 0) {
            
            var fullSrc = resolveUrl(src);
            if (!seen[fullSrc]) {
                seen[fullSrc] = true;
                images.push(fullSrc);
            }
        }
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");

    return Response.success(images);
}
