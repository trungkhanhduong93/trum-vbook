load('config.js');

var AJAX_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Referer": "https://mangak.site/"
};

function ajaxGet(url) {
    return Http.get(url).headers(AJAX_HEADERS).string();
}

function pushChapters(list, slug, chapters) {
    for (var i = 0; i < chapters.length; i++) {
        var c = chapters[i];
        list.push({
            name: "Chương " + c.chapter_name,
            url: "/story/" + slug + "/" + c.url,
            host: BASE_URL
        });
    }
}

function execute(url) {
    var slug = url.split('/').pop().replace('.html', '');
    if (!slug) return null;

    var ajaxBase = BASE_URL + "/ajax/get-chapters?slug=" + slug + "&sort=ASC&page=";

    // ── Page 1 (sync, also reveals totalPages via paginationRanges) ─────
    var firstStr = ajaxGet(ajaxBase + "1");
    if (!firstStr) return null;

    var first;
    try { first = JSON.parse(firstStr); } catch (e) { return null; }
    if (!first || !first.success || !first.chapters) return null;

    var list = [];
    pushChapters(list, slug, first.chapters);

    var ranges = first.paginationRanges || [];
    var totalPages = ranges.length > 0 ? ranges.length : 1;

    // Typical stories fit in 1 page → return immediately.
    if (totalPages <= 1) {
        return list.length > 0 ? Response.success(list) : null;
    }

    // ── Pages 2..N in parallel via browser + Promise.all ────────────────
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // Launch the story page (not API) to clear Cloudflare if any.
        browser.launch(url, 8000);

        var script = "" +
            "(async function() {\n" +
            "    try {\n" +
            "        var base = '" + ajaxBase + "';\n" +
            "        var total = " + totalPages + ";\n" +
            "        var promises = [];\n" +
            "        for (var p = 2; p <= total; p++) {\n" +
            "            promises.push(fetch(base + p).then(function(r){ return r.json(); }));\n" +
            "        }\n" +
            "        var results = await Promise.all(promises);\n" +
            "        var all = [];\n" +
            "        for (var i = 0; i < results.length; i++) {\n" +
            "            if (results[i] && results[i].chapters) {\n" +
            "                for (var j = 0; j < results[i].chapters.length; j++) all.push(results[i].chapters[j]);\n" +
            "            }\n" +
            "        }\n" +
            "        document.body.innerHTML = 'VBOOK_CHAPS_START' + JSON.stringify(all) + 'VBOOK_CHAPS_END';\n" +
            "    } catch (e) {\n" +
            "        document.body.innerHTML = 'VBOOK_CHAPS_ERROR' + e.message;\n" +
            "    }\n" +
            "})();";

        browser.callJs(script, 8000);
        var bdoc = browser.html();
        browser.close();
        browser = null;

        if (bdoc) {
            var bodyText = bdoc.select("body").text();
            var m = bodyText.match(/VBOOK_CHAPS_START(.*?)VBOOK_CHAPS_END/);
            if (m) {
                var more = JSON.parse(m[1]);
                if (more && more.length) pushChapters(list, slug, more);
            }
        }
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        // Fallback: sequential for the missing pages.
        for (var p = 2; p <= totalPages; p++) {
            var s = ajaxGet(ajaxBase + p);
            if (!s) break;
            try {
                var d = JSON.parse(s);
                if (d && d.chapters) pushChapters(list, slug, d.chapters);
            } catch (err2) { break; }
        }
    }

    return list.length > 0 ? Response.success(list) : null;
}
