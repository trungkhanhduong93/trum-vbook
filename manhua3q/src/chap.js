load("config.js");

function execute(url) {
    if (url.indexOf("http") !== 0) url = resolveUrl(url);

    var browser = null;
    try {
        browser = Engine.newBrowser();
        // Long launch wait — Next.js needs time to hydrate & load images
        browser.launch(url, 8000);

        var script = "" +
            "(function() {\n" +
            "    function extract() {\n" +
            "        var found = [];\n" +
            "        var imgs = document.querySelectorAll('img');\n" +
            "        for (var j = 0; j < imgs.length; j++) {\n" +
            "            var src = imgs[j].getAttribute('src') || imgs[j].getAttribute('data-src') || imgs[j].src || '';\n" +
            "            if (!src || src.indexOf('data:') === 0) continue;\n" +
            "            var low = src.toLowerCase();\n" +
            "            if (low.indexOf('logo') !== -1) continue;\n" +
            "            if (low.indexOf('favicon') !== -1) continue;\n" +
            "            if (low.indexOf('/avatars/') !== -1) continue;\n" +
            "            if (low.indexOf('thumbnail') !== -1) continue;\n" +
            "            if (src.indexOf('/_next/image') !== -1) {\n" +
            "                var um = src.match(/[?&]url=([^&]+)/);\n" +
            "                if (um) src = decodeURIComponent(um[1]);\n" +
            "            }\n" +
            "            if (src.indexOf('//') === 0) src = 'https:' + src;\n" +
            "            if (src.indexOf('/') === 0) src = location.origin + src;\n" +
            "            if (src.indexOf('http') !== 0) continue;\n" +
            "            if (/\\.(jpg|jpeg|png|webp|gif)/i.test(src)) found.push(src);\n" +
            "        }\n" +
            "        return found;\n" +
            "    }\n" +
            "    try {\n" +
            "        var imgs = extract();\n" +
            "        var imgCount = document.querySelectorAll('img').length;\n" +
            "        var payload = 'VBOOK_IMGS_START' + JSON.stringify(imgs) + 'VBOOK_IMGS_END VBOOK_DEBUG_IMGCOUNT=' + imgCount;\n" +
            "        // Multiple persistence strategies — Next.js may re-render some\n" +
            "        document.title = payload;\n" +
            "        try { document.body.innerHTML = '<pre id=\"vbook-pre\">' + payload + '</pre>'; } catch(e) {}\n" +
            "        try { document.documentElement.setAttribute('data-vbook', payload); } catch(e) {}\n" +
            "        // Keep overwriting in case React resets them\n" +
            "        setInterval(function() {\n" +
            "            try {\n" +
            "                var fresh = extract();\n" +
            "                var pp = 'VBOOK_IMGS_START' + JSON.stringify(fresh.length > 0 ? fresh : imgs) + 'VBOOK_IMGS_END';\n" +
            "                document.title = pp;\n" +
            "                document.body.innerHTML = '<pre id=\"vbook-pre\">' + pp + '</pre>';\n" +
            "                document.documentElement.setAttribute('data-vbook', pp);\n" +
            "            } catch(e) {}\n" +
            "        }, 100);\n" +
            "    } catch(e) {\n" +
            "        var ep = 'VBOOK_IMGS_ERROR ' + e.message;\n" +
            "        document.title = ep;\n" +
            "        try { document.body.innerHTML = ep; } catch(err) {}\n" +
            "    }\n" +
            "})();";

        browser.callJs(script, 12000);
        var bdoc = browser.html();
        browser.close();
        browser = null;

        if (!bdoc) return Response.error("Không tải được trang chương");

        var sources = [];
        try { sources.push(bdoc.select("title").text() || ""); } catch (e) {}
        try {
            var rootEl = bdoc.selectFirst("html");
            if (rootEl) sources.push(rootEl.attr("data-vbook") || "");
        } catch (e) {}
        try {
            var preEl = bdoc.selectFirst("pre#vbook-pre");
            if (preEl) sources.push(preEl.text() || "");
        } catch (e) {}
        try { sources.push(bdoc.select("body").text() || ""); } catch (e) {}

        var combined = sources.join(" || ");

        var match = combined.match(/VBOOK_IMGS_START(\[.*?\])VBOOK_IMGS_END/);
        if (!match) {
            var errMatch = combined.match(/VBOOK_IMGS_ERROR\s*([^"<|]{1,200})/);
            return Response.error("Script không hoàn tất. err=" + (errMatch ? errMatch[1] : "n/a") + " | title=" + sources[0].substring(0, 60));
        }

        var images;
        try { images = JSON.parse(match[1]); } catch (e) {
            return Response.error("Lỗi parse JSON: " + e.message);
        }
        if (!images || images.length === 0) {
            var dbgMatch = combined.match(/VBOOK_DEBUG_IMGCOUNT=(\d+)/);
            return Response.error("Không tìm thấy ảnh. Tổng img trong DOM: " + (dbgMatch ? dbgMatch[1] : "?"));
        }

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
        return Response.error("Lỗi tải chương: " + (e && e.message ? e.message : String(e)));
    }
}
