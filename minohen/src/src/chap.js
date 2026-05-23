load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var browser = null;
    try {
        browser = Engine.newBrowser();
        // Wait up to 10s for the page to fully load (DOMContentLoaded).
        // Earlier value of 5(ms) made callJs run before the page even started loading.
        browser.launch(url, 10000);

        // After launch, the React app has mounted; images may still be lazy-loading.
        // Poll briefly for img.src to become a real URL (skip data: placeholders).
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
            "                if (tmp.length > 0 && i >= 8) { srcs = tmp; break; }\n" +
            "            }\n" +
            "            await new Promise(function(r){ setTimeout(r, 150); });\n" +
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

        return Response.success(images);
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return Response.error("Lỗi tải chương: " + e.message);
    }
}
