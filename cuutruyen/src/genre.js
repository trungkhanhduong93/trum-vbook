load("config.js");

// 3 thẻ trạng thái này có trong ô chọn thẻ của site nhưng lọc ra 0 truyện (đã đo
// cả ba) — bỏ đi để khỏi hiện danh mục rỗng.
var SKIP_TAGS = {
    "Tạm ngưng": 1,
    "Đang tiến hành": 1,
    "Đã hoàn thành": 1
};

// Site không có trang /tags, nhưng trang /search nhúng sẵn toàn bộ thẻ dưới dạng
// <a class="tag-btn" data-tag="{tên}">. Lấy động từ đó để khỏi lệch khi site thêm thẻ.
function execute() {
    var doc = fetchDoc(SITE_URL + "/search");
    if (!doc) return Response.success([]);

    var genres = [];
    var seen = {};

    var btns = doc.select("a.tag-btn");
    for (var i = 0; i < btns.size(); i++) {
        var tag = String(btns.get(i).attr("data-tag") || "").trim();
        if (!tag) tag = String(btns.get(i).text()).trim();
        if (!tag || seen[tag] || SKIP_TAGS[tag]) continue;
        seen[tag] = true;

        genres.push({
            title: tag,
            input: tagUrl(tag),
            script: "gen.js"
        });
    }

    return Response.success(genres);
}
