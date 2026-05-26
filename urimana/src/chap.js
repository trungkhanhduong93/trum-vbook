load("config.js");

function execute(url) {
    // Chuẩn hóa domain đề phòng trường hợp xoay vòng tên miền (Domain rotation)
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    if (url.startsWith("/")) url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương truyện");

    var imgEls = doc.select("img.lozad");
    
    // Fallback nếu không có class lozad thì lấy toàn bộ ảnh trong khung đọc truyện
    if (imgEls.size() === 0) {
        imgEls = doc.select("img[data-src*=/uploads/], img[src*=/uploads/]");
    }

    var images = [];
    var seen = {};
    for (var i = 0; i < imgEls.size(); i++) {
        var el = imgEls.get(i);
        var src = el.attr("data-src") || el.attr("src") || el.attr("data-original") || "";
        src = trimText(src);
        
        if (!src || src.indexOf("data:") === 0) continue;
        
        // Loại bỏ logo, banner quảng cáo
        if (src.indexOf("logo") !== -1 || src.indexOf("icon") !== -1 || src.indexOf("banner") !== -1) {
            continue;
        }

        var finalSrc = resolveUrl(src);
        if (seen[finalSrc]) continue;
        seen[finalSrc] = true;
        images.push(finalSrc);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
