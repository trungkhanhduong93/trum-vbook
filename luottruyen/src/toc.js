load("config.js");

function execute(url) {
    syncBaseFromUrl(url);
    // StoryID nằm cuối URL: /truyen-tranh/ten-truyen-12345 -> "12345"
    var storyId = url.replace(/\/$/, "").split("-").pop();

    // 1) POST API (nhanh nhất, như Tachiyomi). null = API hỏng, [] = API sống
    //    nhưng truyện chưa có chương nào.
    var chapters = tocViaApi(url, storyId);

    // 2) Chỉ dò lại domain khi API HỎNG THẬT. Mảng rỗng không phải dấu hiệu đổi
    //    domain — dò lúc đó chỉ tốn thêm vài giây rồi vẫn rỗng như cũ.
    if (chapters === null) {
        autoProbeDomains(url);
        chapters = tocViaApi(swapDomainTo(url, BASE_URL), storyId);
    }

    // 3) Vẫn rỗng → render bằng trình duyệt (danh sách chương nạp qua AJAX)
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
        browser.setUserAgent(UserAgent.android());
        browser.launch(url, 8);
        browser.callJs("", 2500); // chờ JS nạp danh sách chương
        var doc = browser.html();
        browser.close();
        browser = null;

        var chapters = parseChapterList(doc);
        if (chapters.length === 0) {
            // thử selector embedded khác trên trang detail
            chapters = parseEmbeddedChapters(doc);
        }
        if (chapters.length === 0) return Response.error("Không tải được mục lục");

        chapters.reverse();
        return Response.success(chapters);
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return Response.error("Lỗi tải mục lục: " + e.message);
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
