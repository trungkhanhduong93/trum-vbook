load("config.js");

function execute(url) {
    // Ảnh nằm trực tiếp trong .reading-content .item img (không lazy-load)
    // → tải 1 request, parse src thẳng, không cần trình duyệt → nhanh.
    // fetch NEM exception khi loi mang: khong bat thi ca chap.js chet cam va
    // app quay mai. Va khong dat timeout thi host chet an tron 10-11 giay.
    var res = null;
    try {
        res = fetch(url, {
            timeout: REQ_TIMEOUT,
            headers: {
                "User-Agent": FETCH_HEADERS["User-Agent"],
                "Referer": BASE_URL + "/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5"
            }
        });
    } catch (eFetch) {}
    if (!res || !res.ok) {
        return Response.error("Không tải được trang chương: " + (res ? res.status : "null"));
    }

    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    var imgs = doc.select("div.reading-content div.item img");
    if (!imgs || imgs.size() === 0) imgs = doc.select("div.reading-content img");

    var images = [];
    var seen = {};
    for (var i = 0; i < imgs.size(); i++) {
        var src = imgSrc(imgs.get(i));
        if (!src) continue;

        // Bỏ logo / asset của theme (ảnh nội dung nằm trên CDN ngoài)
        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("/wp-content/") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;

        if (src.indexOf("//") === 0) src = "https:" + src;

        if (seen[src]) continue;
        seen[src] = true;
        images.push(toPhoton(src, images.length)); // convert AVIF→JPEG
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}

// Ảnh nguồn là AVIF (img.wsrvnl.xyz) — nhiều máy Android (< 12) không
// decode được → ảnh vỡ. Route qua Photon (i*.wp.com) để chuyển sang
// JPEG (mọi thiết bị đọc được), kèm nén nhẹ cho nhẹ băng thông.
// Chuẩn công thức Bẫy 25: w=600&quality=65&strip=all và xoay 3 cụm i0..i2
function toPhoton(url, idx) {
    var isAvif = url.indexOf(".avif") >= 0 || url.indexOf("wsrvnl") >= 0;
    if (!isAvif) return safeEncodeUrl(url);
    var bare = url.replace(/^https?:\/\//i, "");
    var hostIndex = ((idx || 0) % 3); // Automattic Jetpack Photon chỉ có 3 cụm i0..i2 (Bẫy 23)
    return safeEncodeUrl("https://i" + hostIndex + ".wp.com/" + bare + "?w=600&quality=65&strip=all");
}
