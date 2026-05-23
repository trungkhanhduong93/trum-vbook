load("config.js");

// QQ has 2 search options:
// 1. Fast autocomplete API: POST /frontend/search/search  → returns small HTML fragment, max ~10 items.
// 2. Full search page: /tim-kiem-nang-cao/trang-N?key=...  → full paginated cards.
// We use #1 for page 1 (instant) and #2 for pagination beyond.

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);
    var kw = keyword.trim();
    var p = page ? parseInt(page) : 1;

    if (p === 1) {
        var res = fetch(BASE_URL + "/frontend/search/search", {
            method: "POST",
            headers: {
                "User-Agent": FETCH_HEADERS["User-Agent"],
                "Referer": BASE_URL + "/",
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Accept": "text/html, */*; q=0.01"
            },
            body: "search=" + encodeURIComponent(kw) + "&type=0"
        });

        if (res && res.ok) {
            var doc = res.html();
            if (doc) {
                var items = [];
                var lis = doc.select("li");
                for (var i = 0; i < lis.size(); i++) {
                    var li = lis.get(i);
                    var a = selFirst(li, "a");
                    if (!a) continue;
                    var href = a.attr("href") || "";
                    if (!href || href.indexOf("/truyen-tranh/") < 0) continue;

                    var nmEl = selFirst(li, ".search_info .name");
                    var nm = nmEl ? nmEl.text().trim() : "";
                    if (!nm) {
                        nmEl = selFirst(li, "p.name");
                        if (nmEl) nm = nmEl.text().trim();
                    }
                    if (!nm) continue;

                    var img = selFirst(li, ".search_avatar img");
                    var cover = img ? (img.attr("src") || "") : "";

                    var altEl = selFirst(li, ".name_other");
                    var altText = altEl ? altEl.text().trim() : "";
                    var chapEl = selFirst(li, ".search_info p:last-of-type");
                    var chapText = chapEl ? chapEl.text().trim() : "";

                    var desc = chapText;
                    if (altText) desc = altText + (desc ? " • " + desc : "");

                    items.push({
                        name: nm,
                        cover: cover,
                        link: resolveUrl(href),
                        description: desc,
                        host: HOST
                    });
                }
                // Quick-search returns a single batch; offer page 2 fallback to full search.
                var next = items.length > 0 ? "2" : null;
                return Response.success(items, next);
            }
        }
    }

    // Paged fallback: advanced search page.
    var url = BASE_URL + "/tim-kiem-nang-cao";
    if (p > 1) url += "/trang-" + p;
    url += "?key=" + encodeURIComponent(kw);

    var doc2 = fetchRetry(url);
    if (!doc2) return Response.success([]);

    var items2 = parseItems(doc2);
    var next2 = items2.length > 0 ? String(p + 1) : null;
    return Response.success(items2, next2);
}
