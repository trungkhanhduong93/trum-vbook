load("config.js");

function execute(input, page) {
    var p = page ? parseInt(page) : 1;

    // API phân trang bằng ?page=N (limit/offset bị BỎ QUA). page_size cố định 24.
    var path = input || "/manga";
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    var res = apiFetch(path + sep + "page=" + p);
    if (!res || !res.ok) return Response.success([], null);

    var items = [];
    var hasNext = false;
    try {
        var data = JSON.parse(res.text());
        var arr = (data && data.items) ? data.items : data;
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                var it = buildItem(arr[i]);
                if (it) items.push(it);
            }
        }
        if (data && typeof data.has_next !== "undefined") {
            hasNext = !!data.has_next;
        } else if (data && data.total_pages) {
            hasNext = p < parseInt(data.total_pages);
        } else {
            hasNext = items.length > 0;
        }
    } catch (e) {}

    return Response.success(items, hasNext ? String(p + 1) : null);
}
