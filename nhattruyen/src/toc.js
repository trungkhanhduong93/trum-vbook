load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var seen = {};

    // 1. Cố gắng lấy danh sách đầy đủ 100% chương thông qua AJAX API ComicService
    var comicSlug = "";
    var comicId = "";

    var scripts = doc.select("script");
    for (var s = 0; s < scripts.size(); s++) {
        var st = scripts.get(s).html();
        if (st.indexOf("comicId") >= 0 || st.indexOf("comicSlug") >= 0) {
            var mS = st.match(/gOpts\.comicSlug\s*=\s*['"]([^'"]+)['"]/);
            if (mS && mS[1]) comicSlug = mS[1];
            var mI = st.match(/gOpts\.comicId\s*=\s*['"]?(\d+)['"]?/);
            if (mI && mI[1]) comicId = mI[1];
            if (comicSlug && comicId) break;
        }
    }

    if (!comicSlug || !comicId) {
        var mUrl = url.match(/\/truyen-tranh\/([a-zA-Z0-9-]+?)(?:-([0-9]+))?(?:[\/?#]|$)/);
        if (mUrl) {
            if (!comicSlug) comicSlug = mUrl[1];
            if (!comicId && mUrl[2]) comicId = mUrl[2];
        }
    }

    if (!comicId) {
        var idEl = doc.select("input#ctl00_cphMain_ctl00_hfComicId, input[id*='hfComicId'], ul.comic-item[data-id], .list-chapter[data-id]");
        if (idEl && idEl.size() > 0) {
            comicId = idEl.get(0).attr("value") || idEl.get(0).attr("data-id") || "";
        }
    }

    if (comicSlug && comicId) {
        var apiUrl = BASE_URL + "/Comic/Services/ComicService.asmx/ChapterList?slug=" + encodeURIComponent(comicSlug) + "&comicId=" + encodeURIComponent(comicId);
        var rawJson = null;
        try {
            rawJson = Http.get(apiUrl).headers({
                "User-Agent": FETCH_HEADERS["User-Agent"],
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": url
            }).string();
        } catch (eApi) {}

        if (rawJson) {
            try {
                var res = JSON.parse(rawJson);
                var list = (res && res.data && res.data.length) ? res.data : null;
                if (list && list.length > 0) {
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        var cName = (item.chapter_name && item.chapter_name.trim()) ? item.chapter_name.trim() : ("Chapter " + item.chapter_num);
                        var cSlug = item.chapter_slug;
                        var cId = item.chapter_id;
                        if (!cSlug || !cId) continue;

                        var fullUrl = BASE_URL + "/truyen-tranh/" + comicSlug + "/" + cSlug + "/" + cId;
                        if (seen[fullUrl]) continue;
                        seen[fullUrl] = true;

                        chapters.push({
                            name: cName,
                            url: fullUrl,
                            host: HOST
                        });
                    }

                    if (chapters.length > 0) {
                        chapters.reverse();
                        return Response.success(chapters);
                    }
                }
            } catch (eParse) {}
        }
    }

    // 2. Fallback: Parse từ DOM HTML nếu API lỗi hoặc không khả dụng
    var items = doc.select("#nt_listchapter .chapter a, .list-chapter .chapter a, .col-xs-5.chapter a");
    if (!items || items.size() === 0) {
        items = doc.select(".list-chapter a, #nt_listchapter a");
    }

    for (var j = 0; j < items.size(); j++) {
        var a = items.get(j);
        var nm = a.text().trim();
        var href = a.attr("href") || "";
        if (!nm || !href) continue;
        var fUrl = resolveUrl(href);
        if (seen[fUrl]) continue;
        seen[fUrl] = true;

        chapters.push({
            name: nm,
            url: fUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    chapters.reverse();
    return Response.success(chapters);
}
