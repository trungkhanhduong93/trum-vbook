load('config.js');

function execute(url) {
    var bookId = url.split('/').pop();
    if (!bookId) return null;

    var apiUrl = API + "/books/" + bookId + "/chapters?order=desc&take=5000";

    var response = fetch(apiUrl);
    if (!response || !response.ok) return null;

    var data;
    try {
        data = JSON.parse(response.text());
    } catch (e) {
        return null;
    }
    if (!data || !data.data || !data.data.chapters) return null;

    var chapters = data.data.chapters;
    var list = [];
    for (var i = 0; i < chapters.length; i++) {
        var ch = chapters[i];
        var chName = ch.title || ("Chương " + ch.chapterNumber);
        list.push({
            name: chName,
            url: url + "/" + ch.chapterId,
            host: BASE_URL
        });
    }
    list.reverse();
    return Response.success(list);
}
