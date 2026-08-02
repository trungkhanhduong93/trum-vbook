var BASE_URL = "https://fastscan.org";
var HOST = "https://fastscan.org";

function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return "";
    url = url.trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

function withPage(url, page) {
    if (!page || page === 1) return url;
    if (url.indexOf("?") >= 0) {
        return url + "&page=" + page;
    }
    return url + "?page=" + page;
}

function fetchRetry(url) {
    var response = null;
    try {
        response = Http.get(url).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    var needBrowser = false;
    if (!response) {
        needBrowser = true;
    } else {
        var htmlStr = response.outerHtml();
        if (!htmlStr || 
            htmlStr.indexOf("Just a moment...") >= 0 || 
            htmlStr.indexOf("challenge-platform") >= 0 || 
            htmlStr.indexOf("cf-browser-verification") >= 0 ||
            htmlStr.indexOf("/cdn-cgi/challenge") >= 0 ||
            htmlStr.indexOf("Checking your browser") >= 0 ||
            htmlStr.indexOf("Access denied") >= 0) {
            needBrowser = true;
        } else {
            var itemsCheck = response.select(".book_avatar, .list_grid li, ul.list_grid li");
            if (!itemsCheck || itemsCheck.size() === 0) {
                if (url.indexOf("/danh-sach/") >= 0 || url.indexOf("/the-loai/") >= 0 || url.indexOf("/tim-kiem") >= 0) {
                    needBrowser = true;
                }
            }
        }
    }

    if (needBrowser) {
        try {
            var browser = Engine.newBrowser();
            browser.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            var doc = browser.launch(url, 12000);
            if (doc) return doc;
        } catch (err) {}
    }

    return response;
}

function parseItems(doc) {
    var items = [];
    if (!doc) return items;
    var seen = {};

    var storyEls = doc.select(".list_grid li, ul.list_grid li, .list-stories li, ul.list-stories li");
    if (!storyEls || storyEls.size() === 0) {
        storyEls = doc.select("li");
    }

    for (var i = 0; i < storyEls.size(); i++) {
        var li = storyEls.get(i);

        var aName = selFirst(li, ".book_name a");
        if (!aName) aName = selFirst(li, "h3 a");
        if (!aName) aName = selFirst(li, ".book_avatar a");
        if (!aName) continue;

        var name = aName.attr("title") || aName.text().trim();
        var link = aName.attr("href") || "";
        if (!name || !link) continue;

        link = resolveUrl(link);
        if (link.indexOf("/the-loai/") >= 0 || link.indexOf("/danh-sach/") >= 0 || link.indexOf("/tim-kiem") >= 0 || link.indexOf("/thong-bao") >= 0 || link === BASE_URL || link === BASE_URL + "/") continue;

        var imgEl = selFirst(li, ".book_avatar img");
        if (!imgEl) imgEl = selFirst(li, "img");

        var cover = "";
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("data-original") || imgEl.attr("src") || "";
            cover = resolveUrl(cover);
        }

        var chapEl = selFirst(li, ".last_chapter a");
        var lastChap = chapEl ? chapEl.text().trim().replace(/\s+/g, ' ') : "";

        if (seen[link]) continue;
        seen[link] = true;

        items.push({
            name: name,
            link: link,
            cover: cover,
            description: lastChap,
            host: HOST
        });
    }

    return items;
}

function getNextPage(doc, currentPage) {
    if (!doc) return null;
    var nextPage = currentPage + 1;
    var pageLinks = doc.select(".pagination a, ul.pagination a");
    for (var i = 0; i < pageLinks.size(); i++) {
        var a = pageLinks.get(i);
        var href = a.attr("href") || "";
        if (href.indexOf("page=" + nextPage) >= 0) {
            return nextPage.toString();
        }
    }
    return null;
}
