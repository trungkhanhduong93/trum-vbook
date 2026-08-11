load('config.js');

// chap.js: Tải ảnh chương
// URL pattern: /truyen/{slug}/chuong-{number}
//
// PHÂN TÍCH:
// - Site tải ảnh hoàn toàn qua JS + session token (/api/chapter/loadAll cần token)
// - Token được JS tạo trong view_addition.js (bị Cloudflare protect khi fetch tĩnh)
// - Giải pháp: Engine.newBrowser().launch() để render JS,
//   sau đó callJs() để extract src ảnh sau khi render xong
//
// FALLBACK: Nếu browser không có hoặc timeout → trả error tử tế

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    // Đảm bảo URL dùng đúng domain đang hoạt động
    var chapUrl;
    if (sUrl.indexOf('http') === 0) {
        // Thay domain cũ bằng domain hiện tại
        var pathM = sUrl.match(/\/truyen\/.+$/);
        chapUrl = SITE_URL + (pathM ? pathM[0] : sUrl);
    } else {
        chapUrl = SITE_URL + sUrl;
    }

    var images = [];
    var browser = null;

    try {
        browser = Engine.newBrowser();
        // Tắt UA nếu có thể (không bắt buộc)
        try { browser.setUserAgent(UA); } catch (e) {}

        // Launch và chờ JS render xong (15s)
        browser.launch(chapUrl, 15000);

        // Sau khi JS render, ảnh sẽ được inject vào DOM
        // Extract tất cả img[src] trong trang
        var result = browser.callJs(
            'JSON.stringify((function() {' +
            '  var imgs = document.querySelectorAll("img");' +
            '  var urls = [];' +
            '  var seen = {};' +
            '  for (var i = 0; i < imgs.length; i++) {' +
            '    var src = imgs[i].src || "";' +
            '    if (!src) src = imgs[i].getAttribute("data-src") || "";' +
            '    if (!src) src = imgs[i].getAttribute("data-original") || "";' +
            '    src = src.trim();' +
            '    if (!src) continue;' +
            '    if (src.indexOf("/image/") === -1) continue;' +  // Chỉ lấy ảnh chapter
            '    if (seen[src]) continue;' +
            '    seen[src] = true;' +
            '    urls.push(src);' +
            '  }' +
            '  return urls;' +
            '}()))'
        );

        browser.close();
        browser = null;

        if (result) {
            try {
                var parsed = JSON.parse(String(result));
                if (parsed && parsed.length) {
                    // Lọc thêm: bỏ ảnh cover/thumbnail (thường là /image/ + slug nhưng không có số trang)
                    for (var i = 0; i < parsed.length; i++) {
                        var imgUrl = String(parsed[i]).trim();
                        // Chỉ lấy URL tuyệt đối
                        if (imgUrl.indexOf('http') !== 0) {
                            imgUrl = SITE_URL + (imgUrl.charAt(0) === '/' ? imgUrl : '/' + imgUrl);
                        }
                        images.push(imgUrl);
                    }
                }
            } catch (e2) {}
        }
    } catch (err) {
        if (browser) {
            try { browser.close(); } catch (e) {}
        }
    }

    if (!images || !images.length) {
        return Response.error('Không tải được ảnh chương. Vui lòng thử lại sau.');
    }

    return Response.success(images);
}
