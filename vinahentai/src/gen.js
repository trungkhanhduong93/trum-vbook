function execute(url, page) {
    if (!page) page = "1";
    
    var finalUrl = resolveUrl(url);
    if (finalUrl.indexOf("?") >= 0) {
        finalUrl += "&page=" + page;
    } else {
        finalUrl += "?page=" + page;
    }

    var resp = fetchRetry(finalUrl);
    if (!resp || !resp.ok) {
        return Response.error("Không thể tải trang: " + (resp ? resp.status : "unknown"));
    }

    var doc = resp.html();
    var items = parseItems(doc);

    if (items.length === 0) {
        return Response.success([], null);
    }

    var nextPage = items.length >= 20 ? String(parseInt(page, 10) + 1) : null;
    return Response.success(items, nextPage);
}
