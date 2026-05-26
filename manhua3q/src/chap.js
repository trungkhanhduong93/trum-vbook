load("config.js");

function execute(url) {
    if (url.indexOf("http") !== 0) url = resolveUrl(url);

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 3000);

        var script = "" +
            "(async function() {\n" +
            "    try {\n" +
            "        var srcs = [];\n" +
            "        for (var i = 0; i < 40; i++) {\n" +
            "            srcs = [];\n" +
            "            var imgs = document.querySelectorAll('img');\n" +
            "            for (var j = 0; j < imgs.length; j++) {\n" +
            "                var s = imgs[j].getAttribute('src') || imgs[j].getAttribute('data-src') || imgs[j].src || '';\n" +
            "                if (!s || s.indexOf('data:') === 0) continue;\n" +
            "                if (s.indexOf('logo') !== -1) continue;\n" +
            "                if (s.indexOf('favicon') !== -1) continue;\n" +
            "                if (s.indexOf('/avatars/') !== -1) continue;\n" +
            "                if (s.indexOf('thumbnail') !== -1) continue;\n" +
            "                if (s.indexOf('/_next/image') !== -1) {\n" +
            "                    var m = s.match(/[?&]url=([^&]+)/);\n" +
            "                    if (m) s = decodeURIComponent(m[1]);\n" +
            "                }\n" +
            "                if (s.indexOf('//') === 0) s = 'https:' + s;\n" +
            "                if (s.indexOf('http') !== 0) continue;\n" +
            "                if (s.match(/\\.(jpg|jpeg|png|webp|gif)/i)) srcs.push(s);\n" +
            "            }\n" +
            "            if (srcs.length >= 3) break;\n" +
            "            await new Promise(function(r){ setTimeout(r, 200); });\n" +
            "        }\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_START' + JSON.stringify(srcs) + 'VBOOK_IMGS_END';\n" +
            "    } catch(e) {\n" +
            "        document.body.innerHTML = 'VBOOK_IMGS_ERROR' + e.message;\n" +
            "    }\n" +
            "})();";

        browser.callJs(script, 10000);
        var bdoc = browser.html();
        browser.close();
        browser = null;

        if (!bdoc) return Response.error("Không tải được trang chương");

        var text = bdoc.select("body").text();
        var match = text.match(/VBOOK_IMGS_START(.*?)VBOOK_IMGS_END/);
        if (!match) {
            var errMatch = text.match(/VBOOK_IMGS_ERROR(.*?)$/);
            return Response.error("Không trích xuất được ảnh: " + (errMatch ? errMatch[1] : "unknown"));
        }

        var images = JSON.parse(match[1]);
        if (!images || images.length === 0) return Response.error("Không tìm thấy ảnh chương");

        var seen = {};
        var result = [];
        for (var idx = 0; idx < images.length; idx++) {
            var imgUrl = images[idx];
            if (imgUrl.indexOf("//") === 0) imgUrl = "https:" + imgUrl;
            if (seen[imgUrl]) continue;
            seen[imgUrl] = true;
            result.push(imgUrl);
        }

        return Response.success(result);
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return Response.error("Lỗi tải chương: " + e.message);
    }
}
