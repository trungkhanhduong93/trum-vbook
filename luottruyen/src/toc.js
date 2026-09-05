load("config.js");

function execute(url) {
    syncBaseFromUrl(url);

    // 1. Trích xuất storyId từ URL (dạng -12345 ở cuối)
    var m = String(url).match(/-(\d+)\/?$/);
    var storyId = m ? m[1] : null;

    var chapters = null;
    if (storyId) {
        chapters = tocViaApi(url, storyId);
    }

    // 2. Nếu URL không có số ID hoặc API trả null/rỗng:
    // Tải nhanh trang truyện để bóc tách #storyID hoặc danh sách chương nhúng sẵn
    if (!chapters || chapters.length === 0) {
        var pageRes = fetchRetry(url);
        if (pageRes && pageRes.ok) {
            var pageDoc = pageRes.html();
            if (pageDoc) {
                var sInput = selFirst(pageDoc, "#storyID, input[id=storyID], input[name=storyID]");
                var foundId = sInput ? sInput.attr("value") : null;
                if (foundId && foundId !== storyId) {
                    chapters = tocViaApi(url, foundId);
                }
                if (!chapters || chapters.length === 0) {
                    chapters = parseChapterList(pageDoc);
                }
                if (!chapters || chapters.length === 0) {
                    chapters = parseEmbeddedChapters(pageDoc);
                }
            }
        }
    }

    // 3. Fallback cuối cùng: WebView siêu tốc với browser.block() chặn rác (tối đa 3s)
    if (!chapters || chapters.length === 0) {
        return tocViaBrowser(swapDomain(url));
    }

    // Đảo để chương cũ nhất lên đầu (Vbook cần thứ tự tăng dần)
    chapters.reverse();
    return Response.success(chapters);
}

// Gọi POST API ListChapterByStoryID.
// Trả về mảng chương (newest-first), hoặc null khi chính request hỏng.
function tocViaApi(refererUrl, storyId) {
    var apiUrl = BASE_URL + "/Story/ListChapterByStoryID";
    var res = fetch(apiUrl, {
        method: "POST",
        headers: {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": refererUrl,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "text/html, */*; q=0.01"
        },
        body: "StoryID=" + storyId
    });
    if (!res || !res.ok) return null;
    var doc = res.html();
    if (!doc) return null;
    return parseChapterList(doc);
}

// Fallback: mở trang truyện bằng trình duyệt, chờ AJAX nạp #nt_listchapter
function tocViaBrowser(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        try {
            browser.block([".*google.*", ".*facebook.*", ".*analytics.*", ".*doubleclick.*", ".*adservice.*", ".*\\.css.*", ".*\\.gif", ".*stats.*"]);
        } catch (eBlock) {}
        browser.launch(url, 3);
        try {
            browser.callJs("window.scrollTo(0, document.body.scrollHeight);", 1);
        } catch (eJs) {}
        var doc = browser.html();

        var chapters = parseChapterList(doc);
        if (chapters.length === 0) {
            chapters = parseEmbeddedChapters(doc);
        }
        if (chapters.length === 0) return Response.error("Không tải được mục lục");

        chapters.reverse();
        return Response.success(chapters);
    } catch (e) {
        return Response.error("Lỗi tải mục lục: " + e.message);
    } finally {
        if (browser) {
            try { browser.close(); } catch (err) {}
        }
    }
}

// Parse chapter list from HTML fragment (used by both POST API and fallback)
function parseChapterList(doc) {
    var chapters = [];

    // Selectors matching Tachiyomi: li.row:not(.heading)
    var el = doc.select("li.row");

    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);

        // Skip heading row
        var cls = e.attr("class") || "";
        if (cls.indexOf("heading") >= 0) continue;

        // Find chapter link: div.chapter a or just a
        var chapterLink = selFirst(e, "div.chapter a");
        if (!chapterLink) chapterLink = selFirst(e, "a");
        if (!chapterLink) continue;

        var chName = chapterLink.text().trim();
        if (!chName) continue;

        var chapterUrl = chapterLink.attr("href") || "";
        chapterUrl = resolveUrl(chapterUrl);

        chapters.push({
            name: chName,
            url: chapterUrl,
            host: HOST
        });
    }

    return chapters;
}

// Parse danh sách chương nhúng sẵn trên trang detail (sau khi render)
function parseEmbeddedChapters(doc) {
    var chapters = [];

    var el = doc.select("#nt_listchapter li.row");
    if (!el || el.size() === 0) {
        el = doc.select(".list-chapter li.row");
    }
    if (!el || el.size() === 0) {
        el = doc.select("#nt_listchapter li");
    }

    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);

        var cls = e.attr("class") || "";
        if (cls.indexOf("heading") >= 0) continue;

        var chapterLink = selFirst(e, ".chapter a");
        if (!chapterLink) chapterLink = selFirst(e, "a");
        if (!chapterLink) continue;

        var chName = chapterLink.text().trim();
        if (!chName) continue;

        var chapterUrl = resolveUrl(chapterLink.attr("href") || "");

        chapters.push({
            name: chName,
            url: chapterUrl,
            host: HOST
        });
    }

    return chapters;
}
