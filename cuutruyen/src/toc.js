load("config.js");

function execute(url) {
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var seen = {};

    // 1. Phân tích mục lục trong DOM trang chi tiết
    var items = doc.select("div.chapter-item");

    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);

        var a = selFirst(item, "a[href*='/chapters/']");
        if (!a) continue;
        var href = absUrl(a.attr("href"));
        if (!href || seen[href]) continue;

        var num = "";
        var numBox = selFirst(item, "div.p-1");
        if (numBox) {
            var spans = numBox.select("span");
            if (spans.size() > 0) num = String(spans.get(spans.size() - 1).text()).trim();
            else num = String(numBox.text()).trim();
        }

        var title = "";
        var titleBox = selFirst(item, "div.truncate.flex-grow");
        if (titleBox) {
            title = String(titleBox.text()).trim().replace(/\s+/g, " ");
            if (title === "Không có tiêu đề") title = "";
        }

        var label = num ? ("Chương " + num) : "";
        if (label && title) label = label + " - " + title;
        if (!label) label = title || String(a.text()).trim().replace(/\s+/g, " ");
        if (!label) continue;

        seen[href] = true;
        chapters.push({ name: label, url: href, host: HOST });
    }

    // 2. Nếu trang đạt giới hạn trần 100 chương của Cứu Truyện:
    // Gọi MangaDex feed API để mở khóa 100% toàn bộ chương còn thiếu
    if (chapters.length >= 100) {
        var mUuid = String(url).match(/\/mangas\/([a-f0-9-]{8,})/i);
        if (mUuid && mUuid[1]) {
            var mangaId = mUuid[1];
            var mdxUrl = "https://api.mangadex.org/manga/" + mangaId + "/feed?translatedLanguage[]=vi&limit=500&order[chapter]=asc";
            var rawMdx = null;
            try {
                rawMdx = Http.get(mdxUrl).headers(HEADERS).timeout(REQ_TIMEOUT).string();
            } catch (eMdx) {}

            if (rawMdx) {
                try {
                    var mdxObj = JSON.parse(rawMdx);
                    var feedList = (mdxObj && mdxObj.data && mdxObj.data.length) ? mdxObj.data : null;
                    if (feedList && feedList.length > chapters.length) {
                        var fullChapters = [];
                        var seenNum = {};
                        for (var k = 0; k < feedList.length; k++) {
                            var fItem = feedList[k];
                            var fAttrs = fItem.attributes || {};
                            var fNum = fAttrs.chapter ? String(fAttrs.chapter).trim() : "";
                            var fTitle = fAttrs.title ? String(fAttrs.title).trim() : "";
                            var fId = fItem.id;
                            if (!fId) continue;

                            var fLabel = fNum ? ("Chương " + fNum) : "";
                            if (fLabel && fTitle) fLabel = fLabel + " - " + fTitle;
                            if (!fLabel) fLabel = fTitle || ("Chương " + (k + 1));

                            var fUrl = absUrl("/chapters/" + fId);
                            var key = fNum ? fNum : fId;
                            if (seenNum[key]) continue;
                            seenNum[key] = true;

                            fullChapters.push({
                                name: fLabel,
                                url: fUrl,
                                host: HOST
                            });
                        }

                        if (fullChapters.length > 0) {
                            return Response.success(fullChapters);
                        }
                    }
                } catch (eParse) {}
            }
        }
    }

    if (chapters.length === 0) {
        return Response.error("Truyện này chưa có chương nào trên Cứu Truyện");
    }

    // Site liệt kê mới nhất trước; Vbook cần thứ tự từ chương đầu.
    chapters.reverse();
    return Response.success(chapters);
}
