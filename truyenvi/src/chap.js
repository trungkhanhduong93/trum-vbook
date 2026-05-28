load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    var data = [];
    var seen = {};

    // Ảnh chapter: <img src="https://s{N}.truyenvi.com/Library/{...}/{chapter-slug}/w__{chapter-slug}_page{N}.jpg" class="img-fluid" ...>
    var re = /src="(https?:\/\/s[0-9]+\.truyenvi\.com\/Library\/[^"]+\/w__[^"]+_page[0-9]+\.[a-z]+)"/g;
    var m;
    while ((m = re.exec(html)) !== null) {
        var link = m[1];
        if (!seen[link]) {
            seen[link] = true;
            data.push(link);
        }
    }

    if (data.length === 0) return null;
    return Response.success(data);
}
