load('config.js');

// chap.js: Tải ảnh chương
// URL pattern: /truyen/{slug}/chuong-{number}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);
    var slug = extractSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    // Trích xuất số chương từ URL (ví dụ: /chuong-56 -> 56)
    var match = sUrl.match(/chuong-([0-9.]+)/i);
    var chapNum = match ? match[1] : '1';

    // Lấy comicId và nameEn chuẩn từ API comic detail
    var comicId = '';
    var nameEn = slug;
    var jsonDetail = apiGet('/api/comic/' + slug);
    if (jsonDetail && jsonDetail.status && jsonDetail.result) {
        if (jsonDetail.result.id) comicId = String(jsonDetail.result.id);
        if (jsonDetail.result.nameEn) nameEn = String(jsonDetail.result.nameEn);
    }

    // 1. Phương pháp ưu tiên: Gọi API POST /api/chapter/loadAll (Nhanh, không bị Cloudflare loop)
    try {
        // Tải trang HTML chương trước để khởi tạo session / cookies
        Http.get(SITE_URL + '/truyen/' + slug + '/chuong-' + chapNum)
            .headers(HEADERS())
            .string();

        var postData = 'comicId=' + encodeURIComponent(comicId) +
                       '&chapterNumber=' + encodeURIComponent(chapNum) +
                       '&nameEn=' + encodeURIComponent(nameEn);

        var resStr = Http.post(SITE_URL + '/api/chapter/loadAll')
            .headers(HEADERS())
            .body(postData)
            .contentType('application/x-www-form-urlencoded; charset=UTF-8')
            .string();

        if (resStr) {
            var jsonRes = JSON.parse(resStr);
            if (jsonRes && jsonRes.status && jsonRes.result && jsonRes.result.data) {
                var imgs = jsonRes.result.data;
                if (imgs && imgs.length > 0) {
                    var cleanImgs = [];
                    for (var k = 0; k < imgs.length; k++) {
                        var imgUrl = String(imgs[k]).trim();
                        if (imgUrl) cleanImgs.push(absUrl(imgUrl));
                    }
                    if (cleanImgs.length > 0) {
                        return Response.success(cleanImgs);
                    }
                }
            }
        }
    } catch (e1) {}

    // 2. Fallback: Dùng Engine.newBrowser() nếu API loadAll không khả dụng
    var images = [];
    var browser = null;

    try {
        var pathM = sUrl.match(/\/truyen\/.+$/);
        var chapUrl = SITE_URL + (pathM ? pathM[0] : (sUrl.charAt(0) === '/' ? sUrl : '/' + sUrl));

        browser = Engine.newBrowser();
        try { browser.setUserAgent(UA); } catch (e2) {}

        browser.launch(chapUrl, 8000);

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
            '    if (src.indexOf("logo.png") !== -1 || src.indexOf("favicon") !== -1 || src.indexOf("avatar") !== -1 || src.indexOf("bg2.gif") !== -1) continue;' +
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
            var parsed = JSON.parse(String(result));
            if (parsed && parsed.length) {
                for (var i = 0; i < parsed.length; i++) {
                    images.push(absUrl(String(parsed[i]).trim()));
                }
            }
        }
    } catch (err) {
        if (browser) {
            try { browser.close(); } catch (e3) {}
        }
    }

    if (!images || !images.length) {
        return Response.error('Không tải được ảnh chương. Vui lòng thử lại sau.');
    }

    return Response.success(images);
}

