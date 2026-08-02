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
    var response = Http.get(url).headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": BASE_URL + "/"
    }).html();

    if (!response) return null;

    var htmlStr = response.outerHtml();
    if (htmlStr.indexOf("Just a moment...") >= 0 || htmlStr.indexOf("challenge-platform") >= 0 || htmlStr.indexOf("cf-browser-verification") >= 0) {
        var browser = Engine.newBrowser();
        browser.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        var doc = browser.launch(url, 10000);
        return doc;
    }
    return response;
}

function parseItems(doc) {
    var items = [];
    var seen = {};

    var storyEls = doc.select("li");
    for (var i = 0; i < storyEls.size(); i++) {
        var li = storyEls.get(i);

        var aName = selFirst(li, ".book_name a");
        if (!aName) aName = selFirst(li, "h3 a");
        if (!aName) continue;

        var name = aName.text().trim();
        var link = aName.attr("href") || "";
        if (!name || !link) continue;

        link = resolveUrl(link);
        if (link.indexOf("/the-loai/") >= 0 || link.indexOf("/danh-sach/") >= 0 || link.indexOf("/tim-kiem") >= 0) continue;

        var imgEl = selFirst(li, ".book_avatar img");
        if (!imgEl) imgEl = selFirst(li, "img");

        var cover = "";
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            cover = resolveUrl(cover);
        }

        var chapEl = selFirst(li, ".last_chapter a");
        var lastChap = chapEl ? chapEl.text().trim() : "";

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
