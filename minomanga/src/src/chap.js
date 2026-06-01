load('config.js');

function execute(url) {
    var sUrl = String(url).replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    // ── Đường nhanh: API cloudkk + giải mã AES (KHÔNG browser) ──
    var ids = parseChapterIds(sUrl);
    if (ids) {
        var imgs = fetchChapterImagesApi(ids.chapterNumber, ids.bookId);
        if (imgs && imgs.length) return Response.success(imgs);
    }

    // ── Fallback: render bằng browser (phòng khi API đổi / passphrase xoay) ──
    return browserFallback(sUrl);
}

function browserFallback(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 2500);
        var script = "" +
            "(async function() {\n" +
            "    try {\n" +
            "        var sel = 'div[id^=\"chap-img\"] img';\n" +
            "        var srcs = [];\n" +
            "        for (var i = 0; i < 25; i++) {\n" +
            "            var imgs = document.querySelectorAll(sel);\n" +
            "            if (imgs.length > 0) {\n" +
            "                var tmp = [];\n" +
            "                for (var j = 0; j < imgs.length; j++) {\n" +
            "                    var s = imgs[j].getAttribute('src') || imgs[j].getAttribute('data-src') || imgs[j].src || '';\n" +
            "                    if (s && s.indexOf('data:') !== 0) tmp.push(s);\n" +
            "                }\n" +
            "                if (tmp.length >= imgs.length) { srcs = tmp; break; }\n" +
            "                if (tmp.length > 0 && i >= 5) { srcs = tmp; break; }\n" +
            "            }\n" +
            "            await new Promise(function(r){ setTimeout(r, 100); });\n" +
            "        }\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_START' + JSON.stringify(srcs) + 'VBOOK_IMGS_END';\n" +
            "    } catch(e) {\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_ERROR' + e.message;\n" +
            "    }\n" +
            "})();";
        browser.callJs(script, 6000);
        var bdoc = browser.html();
        browser.close();
        browser = null;

        if (!bdoc) return Response.error("Không tải được trang chương");
        var text = bdoc.select("body").text();
        var match = text.match(/VBOOK_IMGS_START(.*?)VBOOK_IMGS_END/);
        if (!match) return Response.error("Không trích xuất được ảnh chương");
        var images = JSON.parse(match[1]);
        if (!images || images.length === 0) return Response.error("Không tìm thấy ảnh chương");

        var result = [];
        for (var idx = 0; idx < images.length; idx++) {
            var imgUrl = images[idx];
            if (imgUrl.indexOf("//") === 0) imgUrl = "https:" + imgUrl;
            result.push(imgUrl);
        }
        return Response.success(result);
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return Response.error("Lỗi tải chương: " + e.message);
    }
}
