load("config.js");

function execute() {
    var res = fetchRetry(BASE_URL + "/tim-truyen");
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    var genres = [];

    // Parse genre links from the dropdown menu
    var genreLinks = doc.select("ul.dropdown-menu.megamenu a[href*='/tim-truyen/']");
    var seen = {};

    for (var i = 0; i < genreLinks.size(); i++) {
        var a = genreLinks.get(i);
        var name = a.text().trim();
        var href = a.attr("href") || "";
        if (!name || !href) continue;

        // Skip "Tất cả"
        if (name === "Tất cả") continue;

        // Remove count badges from name (e.g. "Action 6648" -> "Action")
        // The count is in a nested span, but text() includes it
        var spanEl = selFirst(a, "span");
        if (spanEl) {
            var spanText = spanEl.text().trim();
            if (spanText && name.indexOf(spanText) >= 0) {
                name = name.replace(spanText, "").trim();
            }
        }
        if (!name) continue;

        // Deduplicate
        if (seen[name]) continue;
        seen[name] = true;

        genres.push({
            title: name,
            input: resolveUrl(href),
            script: "gen.js"
        });
    }

    return Response.success(genres);
}
