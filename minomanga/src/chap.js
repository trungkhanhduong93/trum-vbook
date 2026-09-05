load('config.js');

function execute(url) {
    var sUrl = String(url).replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var ids = parseChapterIds(sUrl);
    if (ids) {
        var imgs = fetchChapterImagesApi(ids.chapterId, ids.bookId);
        if (imgs && imgs.length) return Response.success(imgs);
    }

    return browserFallback(sUrl);
}

function browserFallback(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        try {
            browser.block([".*google.*", ".*facebook.*", ".*analytics.*", ".*doubleclick.*", ".*adservice.*", ".*\\.gif"]);
        } catch (eBlock) {}
        browser.launch(url, 4);
        try { browser.callJs('void 0;', 2); } catch (eWait) {}

        var script = "" +
            "(function() {\n" +
            "    try {\n" +
            "        var sel = 'div[id^=\"chap-img\"] img';\n" +
            "        var imgs = document.querySelectorAll(sel);\n" +
            "        var srcs = [];\n" +
            "        for (var j = 0; j < imgs.length; j++) {\n" +
            "            var s = imgs[j].getAttribute('src') || imgs[j].getAttribute('data-src') || imgs[j].src || '';\n" +
            "            if (s && s.indexOf('data:') !== 0) srcs.push(s);\n" +
            "        }\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_START' + JSON.stringify(srcs) + 'VBOOK_IMGS_END';\n" +
            "    } catch(e) {\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_ERROR' + e.message;\n" +
            "    }\n" +
            "})();";
        browser.callJs(script, 4);
        var bdoc = browser.html();

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
        return Response.error("Lỗi tải chương: " + e.message);
    } finally {
        if (browser) {
            try { browser.close(); } catch (err) {}
        }
    }
}
