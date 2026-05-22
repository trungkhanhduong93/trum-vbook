load('config.js');
function execute(url) {
    var slug = url.split('/').pop().replace('.html', '');
    if (!slug) return null;

    var list = [];
    var page = 1;
    var hasMore = true;

    while (hasMore && page <= 50) {
        var ajaxUrl = BASE_URL + "/ajax/get-chapters?slug=" + slug + "&page=" + page + "&sort=ASC";
        
        var responseStr = Http.get(ajaxUrl).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        }).string();

        if (responseStr) {
            try {
                var json = JSON.parse(responseStr);
                if (json && json.success && json.chapters && json.chapters.length > 0) {
                    json.chapters.forEach(c => {
                        list.push({
                            name: "Chương " + c.chapter_name,
                            url: "/story/" + slug + "/" + c.url,
                            host: BASE_URL
                        });
                    });
                    
                    if (json.chapters.length < 200) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            } catch (e) {
                hasMore = false;
            }
        } else {
            hasMore = false;
        }
    }

    if (list.length > 0) {
        return Response.success(list);
    }

    return null;
}
