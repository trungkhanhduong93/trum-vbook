load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 5);

        // Poll for chap images then dump JSON-encoded srcs to a body marker.
        // Avoids blind sleep + slow Rhino DOM iteration; finishes as soon as images appear.
        var script = "" +
            "(async function() {\n" +
            "    try {\n" +
            "        var sel = 'div[id^=\"chap-img\"] img';\n" +
            "        var srcs = [];\n" +
            "        for (var i = 0; i < 50; i++) {\n" +
            "            var imgs = document.querySelectorAll(sel);\n" +
            "            if (imgs.length > 0) {\n" +
            "                srcs = Array.prototype.map.call(imgs, function(x){\n" +
            "                    return x.getAttribute('src') || x.getAttribute('data-src') || x.src || '';\n" +
            "                });\n" +
            "                srcs = srcs.filter(function(s){ return s && s.indexOf('data:') !== 0; });\n" +
            "                if (srcs.length > 0) break;\n" +
            "            }\n" +
            "            await new Promise(function(r){ setTimeout(r, 200); });\n" +
            "        }\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_START' + JSON.stringify(srcs) + 'VBOOK_IMGS_END';\n" +
            "    } catch(e) {\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_ERROR' + e.message;\n" +
            "    }\n" +
            "})();";

        browser.callJs(script, 12000);
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
