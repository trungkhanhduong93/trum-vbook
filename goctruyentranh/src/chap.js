load('config.js');

// chap.js: Tải ảnh chương
// URL pattern: /truyen/{slug}/chuong-{number}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    var chapUrl;
    if (sUrl.indexOf('http') === 0) {
        var pathM = sUrl.match(/\/truyen\/.+$/);
        chapUrl = SITE_URL + (pathM ? pathM[0] : sUrl);
    } else {
        chapUrl = SITE_URL + sUrl;
    }

    var images = [];
    var browser = null;

    try {
        browser = Engine.newBrowser();
        try { browser.setUserAgent(UA); } catch (e) {}

        // Launch và chờ page load
        browser.launch(chapUrl, 15000);

        // Polling 5s trong callJs để chờ view.js execute setTimeout(500) và render img
        var result = browser.callJs(
            '(function() {' +
            '  var start = Date.now();' +
            '  while (Date.now() - start < 5000) {' +
            '    var imgs = document.querySelectorAll("img");' +
            '    var urls = [];' +
            '    var seen = {};' +
            '    for (var i = 0; i < imgs.length; i++) {' +
            '      var src = imgs[i].src || imgs[i].getAttribute("data-src") || imgs[i].getAttribute("data-original") || "";' +
            '      src = String(src).trim();' +
            '      if (!src) continue;' +
            '      if (src.indexOf("/image/") === -1 && src.indexOf("cdn") === -1) continue;' +
            '      if (seen[src]) continue;' +
            '      seen[src] = true;' +
            '      urls.push(src);' +
            '    }' +
            '    if (urls.length > 0) return JSON.stringify(urls);' +
            '    var t = Date.now(); while (Date.now() - t < 250) {};' +
            '  }' +
            '  return "[]";' +
            '})()'
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
        return Response.error('Không tải được ảnh chương. Vui lòng mở trang nguồn để xác minh Cloudflare.');
    }

    return Response.success(images);
}
