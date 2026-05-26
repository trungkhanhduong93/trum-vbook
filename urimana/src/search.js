load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = "";
    
    if (url.indexOf("http") === 0) {
        // Nếu là URL duyệt chuyên mục truyền vào từ home.js
        if (p > 1) {
            // Chuẩn hóa đường dẫn phân trang cho WordPress
            // url: https://www.urimana.com/hot-nhat -> https://www.urimana.com/hot-nhat/page/2
            var cleanUrl = url;
            if (cleanUrl.slice(-1) === "/") {
                cleanUrl = cleanUrl.slice(0, -1);
            }
            fetchUrl = cleanUrl + "/page/" + p;
        } else {
            fetchUrl = url;
        }
    } else {
        // Nếu là từ khóa tìm kiếm người dùng gõ
        if (p > 1) {
            fetchUrl = BASE_URL + "/page/" + p + "/?s=" + encodeURIComponent(url);
        } else {
            fetchUrl = BASE_URL + "/?s=" + encodeURIComponent(url);
        }
    }

    var doc = fetchRetry(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var items = [];
    var cards = doc.select(".manga-item");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        
        var a = card.selectFirst(".manga-thumb a");
        if (!a) a = card.selectFirst(".manga-content a");
        if (!a) continue;

        var nameEl = card.selectFirst(".manga-title");
        var name = nameEl ? trimText(nameEl.text()) : trimText(a.text());
        var link = resolveUrl(a.attr("href"));
        
        var img = card.selectFirst(".manga-thumb img");
        var cover = "";
        if (img) {
            cover = resolveUrl(img.attr("data-src") || img.attr("src") || "");
        }
        
        // Lọc bỏ ảnh logo
        if (cover && (cover.indexOf("logo") !== -1 || cover.indexOf("icon") !== -1 || cover.indexOf("default") !== -1)) {
            cover = "";
        }

        var chap = "";
        var chapEl = card.selectFirst(".latest-chap-item a");
        if (chapEl) chap = trimText(chapEl.text());

        items.push({
            name: name,
            link: link,
            cover: cover,
            description: chap,
            host: BASE_URL
        });
    }

    // Phân trang
    var next = "";
    if (items.length > 0) {
        var nextEl = doc.selectFirst("a.next");
        if (nextEl) {
            next = String(p + 1);
        }
    }

    return Response.success(items, next);
}
