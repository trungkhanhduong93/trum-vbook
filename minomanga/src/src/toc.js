load('config.js');

function execute(url) {
    var bookId = url.split('/').pop();
    if (!bookId) return null;

    var apiUrl = API + "/chapters/" + bookId + "?order=desc&take=5000";

    var response = fetch(apiUrl);
    if (!response || !response.ok) return null;

    var data;
    try {
        data = JSON.parse(response.text());
    } catch (e) {
        return null;
    }
    if (!data || !data.chapters) return null;

    var chapters = data.chapters;
    var list = [];
    for (var i = 0; i < chapters.length; i++) {
        var book = chapters[i];
        list.push({
            name: "Chapter " + book.num,
            url: url + "/chapter-" + book.num + "-" + book.chapterNumber,
            host: BASE_URL
        });
    }
    list.reverse();
    return Response.success(list);
}
