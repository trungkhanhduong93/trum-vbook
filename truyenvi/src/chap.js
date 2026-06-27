load('config.js');

function execute(url) {
    var sUrl = String(url);

    // Bước 1: Gọi age-valid endpoint để server set cookie age_valid=true
    // vào cookie jar của HTTP client (bypass age gate)
    try {
        Http.get(SITE_URL + "/age-valid?url=" + encodeURIComponent(sUrl))
            .headers(REQ_HEADERS())
            .string();
    } catch (e) {}

    // Bước 2: Fetch chapter page (lần này đã có cookie trong jar hoặc header)
    var html = httpGet(sUrl);
    if (!html) return null;

    // Nếu vẫn bị age gate → trả về null
    if (html.indexOf("age_confirm") !== -1 && html.indexOf("w__") === -1) return null;

    var data = [];
    var seen = {};

    var re = /src="(https?:\/\/s[0-9]+\.truyenvi\.com\/Library\/[^"]+\/w__[^"]+_page[0-9]+\.[a-z]+)"/g;
    var m;
    while ((m = re.exec(html)) !== null) {
        var link = m[1];
        if (!seen[link]) {
            seen[link] = true;
            data.push(toProxy(link));
        }
    }

    if (data.length === 0) return null;
    return Response.success(data);
}

function toProxy(url) {
    return "https://external-content.duckduckgo.com/iu/?u=" + encodeURIComponent(url);
}
