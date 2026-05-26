load("config.js");

function execute(url) {
    if (url.indexOf("http") !== 0) url = resolveUrl(url);

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 4000);

        var script = "" +
            "(async function() {\n" +
            "    try {\n" +
            "        var found = [];\n" +
            "        for (var i = 0; i < 60; i++) {\n" +
            "            found = [];\n" +
            "            var imgs = document.querySelectorAll('img');\n" +
            "            for (var j = 0; j < imgs.length; j++) {\n" +
            "                var src = imgs[j].getAttribute('src') || imgs[j].getAttribute('data-src') || imgs[j].src || '';\n" +
            "                if (!src || src.indexOf('data:') === 0) continue;\n" +
            "                var low = src.toLowerCase();\n" +
            "                if (low.indexOf('logo') !== -1) continue;\n" +
            "                if (low.indexOf('favicon') !== -1) continue;\n" +
            "                if (low.indexOf('/avatars/') !== -1) continue;\n" +
            "                if (low.indexOf('thumbnail') !== -1) continue;\n" +
            "                if (src.indexOf('/_next/image') !== -1) {\n" +
            "                    var um = src.match(/[?&]url=([^&]+)/);\n" +
            "                    if (um) src = decodeURIComponent(um[1]);\n" +
            "                }\n" +
            "                if (src.indexOf('//') === 0) src = 'https:' + src;\n" +
            "                if (src.indexOf('/') === 0) src = location.origin + src;\n" +
            "                if (src.indexOf('http') !== 0) continue;\n" +
            "                if (/\\.(jpg|jpeg|png|webp|gif)/i.test(src)) found.push(src);\n" +
            "            }\n" +
            "            if (found.length >= 3) break;\n" +
            "            await new Promise(function(r){ setTimeout(r, 250); });\n" +
            "        }\n" +
            "        var payload = 'VBOOK_IMGS_START' + JSON.stringify(found) + 'VBOOK_IMGS_END';\n" +
            "        document.title = payload;\n" +
            "        try {\n" +
            "            var meta = document.createElement('meta');\n" +
            "            meta.setAttribute('name', 'vbook-imgs');\n" +
            "            meta.setAttribute('content', payload);\n" +
            "            document.head.appendChild(meta);\n" +
            "        } catch(e) {}\n" +
            "        try { document.body.setAttribute('data-vbook', payload); } catch(e) {}\n" +
            "    } catch(e) {\n" +
            "        document.title = 'VBOOK_IMGS_ERROR' + e.message;\n" +
            "    }\n" +
            "})();";

        browser.callJs(script, 18000);
        var bdoc = browser.html();
        browser.close();
        browser = null;

        if (!bdoc) return Response.error("Không tải được trang chương");

        // Try multiple extraction points (title first — survives React re-renders)
        var sources = [];
        try { sources.push(bdoc.select("title").text() || ""); } catch (e) {}
        try {
            var metaEl = bdoc.selectFirst("meta[name=vbook-imgs]");
            if (metaEl) sources.push(metaEl.attr("content") || "");
        } catch (e) {}
        try {
            var bodyEl = bdoc.selectFirst("body");
            if (bodyEl) sources.push(bodyEl.attr("data-vbook") || "");
        } catch (e) {}
        try { sources.push(bdoc.select("body").text() || ""); } catch (e) {}

        var combined = sources.join(" ");

        var match = combined.match(/VBOOK_IMGS_START(\[.*?\])VBOOK_IMGS_END/);
        if (!match) {
            var errMatch = combined.match(/VBOOK_IMGS_ERROR([^"<]{0,200})/);
            return Response.error("Không trích xuất được ảnh: " + (errMatch ? errMatch[1] : "script không hoàn tất (title=" + sources[0].substring(0, 80) + ")"));
        }

        var images;
        try { images = JSON.parse(match[1]); } catch (e) {
            return Response.error("Lỗi parse JSON ảnh: " + e.message);
        }
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
