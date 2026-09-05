load('config.js');

function execute(url) {
    if (url.indexOf('/') === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    var doc = fetchRetry(url);
    if (doc) {
        var title = doc.select('h1').text().trim();
        var coverEl = doc.select('img[src*="thumb"], .comic-info img, img.thumbnail, .thumb img, picture img').first();
        var cover = coverEl.attr('src') || coverEl.attr('data-src') || "";
        if (cover.indexOf("/") === 0) cover = BASE_URL + cover;
        
        var author = doc.select('.author, .tac-gia, a[href*="/tac-gia/"]').text().trim() || "Đang cập nhật";
        
        var genres = [];
        var genreEls = doc.select('.genre, .the-loai, a[href*="/the-loai/"]');
        var ng = genreEls.size();
        for (var i = 0; i < ng; i++) {
            var g = genreEls.get(i).text().trim();
            if (g && genres.indexOf(g) === -1) {
                genres.push(g);
            }
        }
        
        var desc = doc.select('.summary, .description, .noidung, .comic-desc, .text-gray-300.text-sm.leading-relaxed, h2:contains("Tóm tắt") + p, h2:contains("Tóm tắt") ~ p, h3:contains("Tóm tắt") + p').text().trim();
        if (!desc) {
            var descEls = doc.select('p');
            var nd = descEls.size();
            for (var i = 0; i < nd; i++) {
                var txt = descEls.get(i).text().trim();
                if (txt.length > 50 && txt.indexOf('Tối đa') === -1 && txt.indexOf('ký tự') === -1 && txt.indexOf('Website sử dụng API') === -1 && txt.indexOf('Quý khách nên ưu tiên') === -1) {
                    desc = txt;
                    break;
                }
            }
        }

        return Response.success({
            name: title,
            cover: cover,
            author: author,
            description: desc,
            detail: "Thể loại: " + genres.join(', '),
            host: BASE_URL
        });
    }
    return null;
}
