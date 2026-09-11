load("config.js");

function execute(url) {
    var doc = fetchDoc(url);
    if (!doc) {
        return Response.error("Không thể tải danh sách chương");
    }

    var storyUrl = resolveUrl(url);
    var storySlug = "";
    var mSlug = storyUrl.match(/\/truyen-hentai\/([^\/\?#]+)/);
    if (mSlug) {
        storySlug = mSlug[1];
    }

    var links = doc.select("a[href*='/truyen-hentai/']");
    var chapters = [];
    var seen = {};

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;

        if (fullUrl === storyUrl || fullUrl === storyUrl + "/") continue;

        var aClass = a.attr("class") || "";
        if (aClass.indexOf("hover-lift") >= 0 || aClass.indexOf("min-w-[7.65rem]") >= 0) continue;

        var rawTxt = txt(a);
        if (rawTxt === "Đọc từ đầu" || rawTxt === "Đọc mới nhất" || rawTxt === "Đọc oneshot" || rawTxt === "Đọc ngay" || rawTxt === "Đọc tiếp") {
            continue;
        }

        var isChapLink = false;
        if (storySlug && fullUrl.indexOf("/truyen-hentai/" + storySlug + "/") >= 0) {
            isChapLink = true;
        } else if (href.indexOf("/chap-") >= 0 || href.indexOf("/chapter-") >= 0 || 
                   href.indexOf("/chuong-") >= 0 || href.indexOf("/1shot") >= 0 || 
                   href.indexOf("/oneshot") >= 0 || href.indexOf("/tap-") >= 0) {
            isChapLink = true;
        }

        if (!isChapLink) continue;

        var titleEl = selFirst(a, "span.text-txt-primary, span.font-medium");
        var chapName = "";
        if (titleEl) {
            chapName = txt(titleEl);
        } else {
            var aria = a.attr("aria-label") || "";
            if (aria) {
                chapName = aria.replace(/^Đọc\s+/i, "").trim();
            }
        }

        if (!chapName) {
            chapName = rawTxt;
        }

        if (chapName.indexOf("ngày trước") >= 0 || chapName.indexOf("giờ trước") >= 0 || chapName.indexOf("tháng trước") >= 0 || chapName.indexOf("năm trước") >= 0) {
            var mName = chapName.match(/^(Chương\s+[0-9\.\-\sA-Za-z]+|Chap\s+[0-9\.\-\sA-Za-z]+|Chapter\s+[0-9\.\-\sA-Za-z]+|1shot[^\d]*|Oneshot[^\d]*)/i);
            if (mName && mName[1]) {
                chapName = mName[1].trim();
            }
        }

        if (!chapName) {
            chapName = "Chương " + (chapters.length + 1);
        }

        seen[fullUrl] = true;
        chapters.push({
            name: chapName,
            url: fullUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy chương nào");
    }

    chapters.reverse();

    return Response.success(chapters);
}
