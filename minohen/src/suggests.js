load('config.js');

function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function execute(input) {
    var doc = Html.parse(input);
    var data = [];
    var figures = doc.select("figure");
    for (var i = 0; i < figures.size(); i++) {
        var e = figures.get(i);
        var h3 = selFirst(e, "h3");
        var name = h3 ? String(h3.text()).trim() : "";
        var a = selFirst(e, "a");
        var link = a ? BASE_URL + a.attr("href") : "";
        var aSub = selFirst(e, ".mt-2 > .mb-2 > a");
        var spanSub = selFirst(e, ".mt-2 > .mb-2 > span");
        var description = (aSub ? aSub.text() : "") + " - " + (spanSub ? spanSub.text() : "");
        var img = selFirst(e, "img");
        var cover = img ? (img.attr("src") || img.attr("data-src") || "") : "";
        var host = BASE_URL;
        data.push({
            name: name,
            link: link,
            description: description,
            cover: cover,
            host: host
        });
    }

    return Response.success(data);
}