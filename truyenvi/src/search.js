load('config.js');

function execute(key, page) {
    if (!page) page = "1";
    if (!key) return null;

    // POST search về homepage với truyen_name={key}
    var q = encodeURIComponent(String(key));
    var postData = "truyen_name=" + q;

    var html;
    try {
        html = Http.post(SITE_URL + "/")
            .headers(REQ_HEADERS())
            .body(postData)
            .contentType("application/x-www-form-urlencoded")
            .string();
    } catch (e) { html = ""; }

    if (!html) return null;

    var list = parseMangaCards(html);
    if (list.length === 0) return null;

    // POST search không có pagination → chỉ 1 trang
    return Response.success(list, "");
}
