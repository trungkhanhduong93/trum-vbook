load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = "";

    if (url.indexOf("http") === 0) {
        // Trang duyệt (/truyen-moi, /truyen-hot) 302-redirect khi gặp ?page=1.
        // Chỉ thêm tham số page từ trang 2 trở đi để tránh redirect làm rỗng list.
        fetchUrl = (p > 1) ? (url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + p) : url;
    } else {
        fetchUrl = BASE_URL + "/tim-kiem?s=" + encodeURIComponent(url) + (p > 1 ? "&page=" + p : "");
    }

    var doc = fetchRetry(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var items = [];
    var added = {};

    // Lưới truyện chính: div.inner > div.item (dùng descendant cho chắc tương thích)
    var cards = doc.select("div.inner div.item");
    if (!cards || cards.size() === 0) cards = doc.select("div.item");

    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        // Link truyện
        var coverA = selFirst(card, "div.cover a");
        if (!coverA) coverA = selFirst(card, "a");
        if (!coverA) continue;

        var link = coverA.attr("href");
        if (!link) continue;
        link = resolveUrl(link);
        if (added[link]) continue;
        added[link] = true;

        // Ảnh bìa
        var imgEl = selFirst(card, "img");
        var cover = "";
        if (imgEl) {
            cover = imgEl.attr("src") || imgEl.attr("data-src") || "";
            if (cover.indexOf("placeholder") >= 0 || cover.indexOf("loading") >= 0) {
                cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            }
            cover = resolveUrl(cover);
        }
        if (cover && (cover.indexOf("logo") !== -1 || cover.indexOf("/icon") !== -1)) continue;

        // Tên truyện
        var name = "";
        var nameEl = selFirst(card, "div.info h3 a");
        if (!nameEl) nameEl = selFirst(card, "h3 a");
        if (!nameEl) nameEl = selFirst(card, "h3");
        if (nameEl) name = trimText(nameEl.text());
        if (!name) name = trimText(coverA.attr("title") || "");
        if (!name && imgEl) name = trimText(imgEl.attr("alt") || "");

        // Chương mới nhất
        var chapEl = selFirst(card, "div.info ul li a");
        if (!chapEl) chapEl = selFirst(card, "a.chapter-name");
        if (!chapEl) chapEl = selFirst(card, "div.caption p");
        var chap = chapEl ? trimText(chapEl.text()) : "";

        if (name && link) {
            items.push({
                name: name,
                link: link,
                cover: cover,
                description: chap,
                host: BASE_URL
            });
        }
    }

    // Phân trang: tìm số trang lớn hơn trang hiện tại
    var next = "";
    var pageLinks = doc.select("div.pagination a");
    for (var j = 0; j < pageLinks.size(); j++) {
        var href = pageLinks.get(j).attr("href") || "";
        var m = href.match(/page=(\d+)/);
        if (m && parseInt(m[1]) > p) {
            next = m[1];
            break;
        }
    }
    if (!next && items.length >= 20) next = String(p + 1);

    return Response.success(items, next);
}
