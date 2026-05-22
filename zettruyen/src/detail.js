load('config.js');

function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    let doc = fetchRetry(url);
    if (doc) {
        let title = doc.select('h1').text().trim();
        let coverEl = doc.select('.comic-info img, img.thumbnail, .thumb img, picture img').first();
        let cover = coverEl.attr('src') || coverEl.attr('data-src') || "";
        if(cover.startsWith("/")) cover = BASE_URL + cover;
        
        let author = doc.select('.author, .tac-gia, a[href*="/tac-gia/"]').text().trim() || "Đang cập nhật";
        
        let genres = [];
        let genreEls = doc.select('.genre, .the-loai, a[href*="/the-loai/"]');
        for(let i = 0; i < genreEls.size(); i++) {
            let g = genreEls.get(i).text().trim();
            if(g && !genres.includes(g)) {
                genres.push(g);
            }
        }
        
        let desc = doc.select('.summary, .description, .noidung, .comic-desc').text().trim();
        if (!desc) {
            let descEls = doc.select('div');
            for(let i = 0; i < descEls.size(); i++) {
                if(descEls.get(i).text().includes('Nội dung')) {
                    desc = descEls.get(i).parent().text().replace('Nội dung', '').trim();
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
