load("config.js");

function execute(url) {
    var fullUrl = resolveUrl(url);
    var doc = fetchDoc(fullUrl);
    if (!doc) return Response.error("Không tải được trang mục lục");

    var chapters = [];
    var seen = {};

    // 1. Parse các chương ban đầu có trong HTML (.box-list-chapter)
    var mainList = doc.select("ul.box-list-chapter li.wp-manga-chapter a, .list-chapter ul.list-item li a");
    for (var i = 0; i < mainList.size(); i++) {
        var a = mainList.get(i);
        var cUrl = a.attr("href") || "";
        var cName = txt(a);
        if (!cUrl || !cName || cName === "Chap đầu" || cName === "Chap cuối") continue;
        if (cUrl.indexOf("/chuong-") >= 0 || cUrl.indexOf("/chap") >= 0) {
            var fullCUrl = resolveUrl(cUrl);
            if (!seen[fullCUrl]) {
                seen[fullCUrl] = true;
                chapters.push({
                    name: cName,
                    url: fullCUrl,
                    host: HOST
                });
            }
        }
    }

    // 2. Kiểm tra nếu có nút "Xem thêm" tải chương cũ qua AJAX
    var moreEl = selFirst(doc, "div.c-chapter-readmore[data-ajax-url]");
    if (moreEl) {
        var ajaxUrl = moreEl.attr("data-ajax-url");
        if (ajaxUrl) {
            ajaxUrl = resolveUrl(ajaxUrl);
            try {
                var moreRes = fetch(ajaxUrl, {
                    headers: {
                        "User-Agent": FETCH_HEADERS["User-Agent"],
                        "Referer": fullUrl,
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "text/html, */*; q=0.01"
                    }
                });
                if (moreRes && moreRes.ok) {
                    var moreDoc = moreRes.html();
                    if (moreDoc) {
                        var moreList = moreDoc.select("li.wp-manga-chapter a, a");
                        for (var j = 0; j < moreList.size(); j++) {
                            var ma = moreList.get(j);
                            var mUrl = ma.attr("href") || "";
                            var mName = txt(ma);
                            if (!mUrl || !mName || mName === "Chap đầu" || mName === "Chap cuối") continue;
                            if (mUrl.indexOf("/chuong-") >= 0 || mUrl.indexOf("/chap") >= 0) {
                                var fullMUrl = resolveUrl(mUrl);
                                if (!seen[fullMUrl]) {
                                    seen[fullMUrl] = true;
                                    chapters.push({
                                        name: mName,
                                        url: fullMUrl,
                                        host: HOST
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {}
        }
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");

    // SayHentai sắp xếp chương mới nhất ở đầu -> Đảo ngược để chương 1 lên đầu (vBook chuẩn tăng dần)
    chapters.reverse();

    return Response.success(chapters);
}
