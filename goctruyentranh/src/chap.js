load('config.js');

// chap.js: Tải ảnh chương (Non-blocking callJs extraction)
// URL pattern: /truyen/{slug}/chuong-{number}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    // Luôn ép dùng domain SITE_URL (vui30.com - sạch Cloudflare)
    var pathM = sUrl.match(/\/truyen\/.+$/);
    var chapUrl = SITE_URL + (pathM ? pathM[0] : (sUrl.charAt(0) === '/' ? sUrl : '/' + sUrl));

    var images = [];
    var browser = null;

    try {
        browser = Engine.newBrowser();
        try { browser.setUserAgent(UA); } catch (e) {}

        // Launch WebView và chờ AJAX render (10s)
        browser.launch(chapUrl, 10000);

        // Extract ảnh trực tiếp từ DOM (không dùng synchronous while loop gây kẹt Event Loop)
        var result = browser.callJs(
            'JSON.stringify((function() {' +
            '  var imgs = document.querySelectorAll(".image-section img, .main-images img, .main img, img");' +
            '  var urls = [];' +
            '  var seen = {};' +
            '  for (var i = 0; i < imgs.length; i++) {' +
            '    var src = imgs[i].src || imgs[i].getAttribute("data-src") || imgs[i].getAttribute("data-original") || "";' +
            '    src = String(src).trim();' +
            '    if (!src) continue;' +
            '    if (src.indexOf("/image/") === -1 && src.indexOf("cdn") === -1 && src.indexOf("/c/") === -1) continue;' +
            '    if (src.indexOf("logo.png") !== -1 || src.indexOf("favicon") !== -1 || src.indexOf("avatar") !== -1) continue;' +
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
                    for (var i = 0; i < parsed.length; i++) {
                        var imgUrl = String(parsed[i]).trim();
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
