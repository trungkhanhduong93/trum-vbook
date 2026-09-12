load('config.js');

function execute(url) {
    var cleanUrl = String(url || "").split(/[?#]/)[0].replace(/\/+$/, "");
    var mBook = cleanUrl.match(/\/books\/(\d+)/);
    var bookId = mBook ? mBook[1] : cleanUrl.split("/").pop();
    if (!bookId) return Response.error("Không tìm thấy ID truyện");

    var apiUrl = API + "/books/" + bookId + "/chapters?order=desc&take=5000";

    var data = jsonGet(apiUrl);
    if (!data || !data.data || !data.data.chapters) return Response.error("Không tải được danh sách chương");

    var chapters = data.data.chapters;
    var list = [];
    for (var i = 0; i < chapters.length; i++) {
        var ch = chapters[i];
        var chName = ch.title || ("Chương " + ch.chapterNumber);
        list.push({
            name: chName,
            url: cleanUrl + "/" + ch.chapterId,
            host: BASE_URL
        });
    }
    list.reverse();
    return Response.success(list);
}
