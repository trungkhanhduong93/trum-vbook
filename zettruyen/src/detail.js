load('config.js');

function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    let doc = fetchRetry(url);
    if (doc) {
        let title = doc.select('h1').text().trim();
        let coverEl = doc.select('img[src*="thumb"], .comic-info img, img.thumbnail, .thumb img, picture img').first();
        let cover = coverEl.attr('src') || coverEl.attr('data-src') || "";
        if(cover.startsWith("/")) cover = BASE_URL + cover;
        
        let author = doc.select('.author, .tac-gia, a[href*="/tac-gia/"]').text().trim() || "Đang cập nhật";
        
        let genres = [];
        let genreEls = doc.select('.genre, .the-loai, a[href*="/the-loai/"]');
        let ng = genreEls.size();
        for(let i = 0; i < ng; i++) {
            let g = genreEls.get(i).text().trim();
            if(g && genres.indexOf(g) === -1) {
                genres.push(g);
            }
        }
        
        let desc = doc.select('.summary, .description, .noidung, .comic-desc, .text-gray-300.text-sm.leading-relaxed, h2:contains("Tóm tắt") + p, h2:contains("Tóm tắt") ~ p, h3:contains("Tóm tắt") + p').text().trim();
        if (!desc) {
            let descEls = doc.select('p');
            let nd = descEls.size();
            for(let i = 0; i < nd; i++) {
                let txt = descEls.get(i).text().trim();
                if(txt.length > 50 && txt.indexOf('Tối đa') === -1 && txt.indexOf('ký tự') === -1 && txt.indexOf('Website sử dụng API') === -1 && txt.indexOf('Quý khách nên ưu tiên') === -1) {
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
