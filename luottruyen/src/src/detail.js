load("config.js");

function execute(url) {
    syncBaseFromUrl(url);

    // MỞ BROWSER 1 LẦN DUY NHẤT Ở TRANG CHI TIẾT ĐỂ LẤY COOKIE CLOUDFLARE CHO TOÀN BỘ ẢNH BÊN TRONG
    var doc = null;
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 10000); // 10s là đủ nhả Cookie
        var html = browser.html();
        if (html) {
            doc = html;
        }
    } catch(e) {}
    if (browser) { try { browser.close(); } catch(e){} }

    // Fallback nếu browser lỗi
    if (!doc) {
        var res = fetchRetry(url);
        if (!res || !res.ok) return Response.error("Không tải được trang truyện");
        doc = res.html();
    }
    
    if (!doc) return Response.error("Không parse được HTML");

    // ─── Title ────────────────────────────────────────────────────────────
    var titleEl = selFirst(doc, "h1.title-detail");
    var name = titleEl ? titleEl.text().trim() : "";

    // ─── Cover ────────────────────────────────────────────────────────────
    var coverEl = selFirst(doc, "div.col-image div.avatar img");
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("src") || "";
        if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
    }

    // ─── Author ───────────────────────────────────────────────────────────
    var author = "";
    var authorLi = selFirst(doc, "li.author");
    if (authorLi) {
        var authorVal = selFirst(authorLi, "p.col-xs-10");
        if (authorVal) author = authorVal.text().trim();
    }

    // ─── Status ───────────────────────────────────────────────────────────
    var ongoing = true;
    var statusText = "";
    var statusLi = selFirst(doc, "li.status");
    if (statusLi) {
        var statusVal = selFirst(statusLi, "p.col-xs-10");
        if (statusVal) {
            statusText = statusVal.text().trim();
            if (statusText.indexOf("Hoàn thành") >= 0 || statusText.indexOf("Full") >= 0) {
                ongoing = false;
            }
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────
    var views = "";
    var viewEl = selFirst(doc, "div.col-image div.avatar span.view");
    if (viewEl) views = viewEl.text().trim().replace(/\s+/g, " ");

    // ─── Rating ───────────────────────────────────────────────────────────
    var ratingAvg = "";
    var ratingCount = "";
    var ratingAvgEl = selFirst(doc, "span.rating-average");
    if (ratingAvgEl) ratingAvg = ratingAvgEl.text().trim();
    var ratingCountEl = selFirst(doc, "span.rating-count");
    if (ratingCountEl) ratingCount = ratingCountEl.text().trim();

    // ─── Followers ────────────────────────────────────────────────────────
    var followers = "";
    var followEl = selFirst(doc, "div.follow b");
    if (followEl) followers = followEl.text().trim();

    // ─── Description (chỉ giới thiệu truyện) ─────────────────────────────
    var description = "";
    var descEl = selFirst(doc, "div.detail-content p#summary");
    if (descEl) description = descEl.text().trim();
    if (!description || description === "Updating") {
        description = "";
    }

    // ─── Detail (thông tin) ───────────────────────────────────────────────
    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author && author !== "Đang cập nhật") detailParts.push("Tác giả: " + author);
    if (views) detailParts.push("👁 Lượt xem: " + views);
    if (followers) detailParts.push("🔖 Theo dõi: " + followers);
    if (ratingAvg) {
        var ratingStr = "⭐ Đánh giá: " + ratingAvg + "/5";
        if (ratingCount) ratingStr += " (" + ratingCount + ")";
        detailParts.push(ratingStr);
    }
    var detail = detailParts.join("<br>");

    // ─── Genres ───────────────────────────────────────────────────────────
    var genres = [];
    var genreLinks = doc.select("a.tr-theloai");
    for (var i = 0; i < genreLinks.size(); i++) {
        var gLink = genreLinks.get(i);
        var gName = gLink.text().trim();
        var gHref = gLink.attr("href") || "";
        if (!gName) continue;
        genres.push({
            title: gName,
            input: resolveUrl(gHref),
            script: "gen.js"
        });
    }

    // ─── Suggests ─────────────────────────────────────────────────────────
    var suggests = [];
    if (author && author !== "Đang cập nhật") {
        suggests.push({
            title: "Cùng tác giả: " + author,
            input: BASE_URL + "/tim-truyen?keyword=" + encodeURIComponent(author),
            script: "gen.js"
        });
    }

    // ─── Comments ─────────────────────────────────────────────────────────
    var comments = [];
    if (url) {
        // Find comment count (adapting user's snippet)
        var commentCountEl = selFirst(doc, "#comment-count");
        // Fallback to luottruyen's typical tab count or list count if #comments-count isn't found
        if (!commentCountEl) commentCountEl = selFirst(doc, ".jcountcmt");

        var commentCount = commentCountEl ? commentCountEl.text().trim() : "0";
        comments.push({
            title: "Bình luận (" + commentCount + ")",
            input: url,
            script: "comment.js"
        });
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: comments
    });
}
