load("config.js");

/**
 * comment.js — LuotTruyen comment loader
 *
 * Vbook calls execute(input, next) where:
 *   input = detail page URL
 *   next  = null → first load
 *   next  = page number string → load more
 *
 * Comments JS-rendered → cần browser.
 * Có pagination: "Xem thêm" sẽ load trang tiếp theo.
 */
function execute(input, next) {
    var url = resolveUrl(input);
    var pageNum = next ? parseInt(next) : 1;

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.setUserAgent(UserAgent.android());
        browser.launch(url, 5);
        browser.callJs("", 3000);

        // Load trang comment cụ thể nếu > 1
        if (pageNum > 1) {
            browser.callJs("story.getPagingCmt(" + pageNum + ", 15)", 2000);
        }

        var doc = browser.html();
        browser.close();
        browser = null;

        var comments = [];

        // Get top-level comment rows
        var topItems = doc.select(".journalItems .journalrow");
        if (!topItems || topItems.size() === 0) {
            topItems = doc.select(".journalrow");
        }

        for (var i = 0; i < topItems.size(); i++) {
            var item = topItems.get(i);

            // Parse the main comment
            var parsed = parseOneComment(item, false);
            if (parsed) comments.push(parsed);

            // Parse replies (inside .jcmt li)
            var replies = item.select(".jcmt li");
            for (var r = 0; r < replies.size(); r++) {
                var reply = replies.get(r);
                var replyCls = reply.attr("class") || "";
                if (replyCls.indexOf("cmteditarea") >= 0) continue;
                if (replyCls.indexOf("cmtbtn") >= 0) continue;

                var parsedReply = parseOneComment(reply, true);
                if (parsedReply) comments.push(parsedReply);
            }
        }

        // ─── Pagination: tìm trang tiếp theo ─────────────────────────────
        var nextCursor = null;
        var activeLi = selFirst(doc, ".commentpager .pagination li.active");
        if (!activeLi) activeLi = selFirst(doc, ".pagination.tr-paging li.active");
        if (activeLi) {
            var allLi = doc.select(".commentpager .pagination li");
            if (!allLi || allLi.size() === 0) {
                allLi = doc.select(".pagination.tr-paging li");
            }
            var foundActive = false;
            for (var j = 0; j < allLi.size(); j++) {
                var li = allLi.get(j);
                var cls = li.attr("class") || "";
                if (cls.indexOf("active") >= 0) {
                    foundActive = true;
                    continue;
                }
                if (foundActive) {
                    nextCursor = String(pageNum + 1);
                    break;
                }
            }
        }

        // Nếu không tìm được pagination nhưng có comments → vẫn cho "xem thêm" trang 2
        if (!nextCursor && pageNum === 1 && comments.length >= 10) {
            nextCursor = "2";
        }

        return Response.success(comments, nextCursor);

    } catch (e) {
        if (browser) {
            try { browser.close(); } catch (err) {}
        }
        return Response.error("Lỗi tải bình luận: " + e.message);
    }
}

function parseOneComment(el, isReply) {
    // Username
    var nameEl = selFirst(el, ".authorname");
    var name = nameEl ? nameEl.text().trim() : "Ẩn danh";

    // Chapter reference: optionally append chapter link text to username
    var chapterEl = selFirst(el, ".cmchapter");
    if (chapterEl) {
        var chapText = chapterEl.text().trim();
        if (chapText) name = name + " - " + chapText; // Using " - " to separate name and chapter
    }

    // Content
    var contentEl = selFirst(el, ".summary");
    var content = contentEl ? contentEl.text().trim() : "";
    if (!content) return null;

    // Time
    var timeEl = selFirst(el, "abbr");
    var timeText = "";
    if (timeEl) {
        var fullTime = timeEl.attr("title") || "";
        timeText = fullTime || timeEl.text().trim();
    }

    // Build description
    var description = timeText;

    // Chapter reference (Moved to Username above)

    // Reply indent
    if (isReply) {
        name = "  ↳ " + name;
    }

    return {
        name: name,
        content: content,
        description: description
    };
}
