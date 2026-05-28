load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    // Lấy phần read-content chứa ảnh chapter
    var contentM = html.match(/class="read-content"[^>]*>([\s\S]+?)(?:<div class="(?:bsx-item|panel-manga-chapter|chapter-navigation))/);
    var section = contentM ? contentM[1] : html;

    var data = [];
    var seen = {};

    // Extract tất cả data-src hoặc src từ img trong read-content
    var re = /(?:data-src|src)="(https?:\/\/[^"]+\.(?:webp|jpg|jpeg|png)[^"]*)"/g;
    var m;
    while ((m = re.exec(section)) !== null) {
        var link = m[1].trim();
        if (!link) continue;
        // Chỉ lấy ảnh chapter (có /dcn/ trong path), bỏ ảnh logo/cover
        if (link.indexOf("/dcn/") === -1) continue;
        if (link.indexOf("/images/covers/") !== -1) continue;
        if (!seen[link]) {
            seen[link] = true;
            data.push(link);
        }
    }

    // Fallback: nếu không có data-src, thử lấy protocol-relative URLs
    if (data.length === 0) {
        var re2 = /(?:data-src|src)="(\/\/[^"]+\.(?:webp|jpg|jpeg|png)[^"]*)"/g;
        while ((m = re2.exec(section)) !== null) {
            var link2 = "https:" + m[1].trim();
            if (link2.indexOf("/dcn/") === -1) continue;
            if (!seen[link2]) {
                seen[link2] = true;
                data.push(link2);
            }
        }
    }

    if (data.length === 0) return null;
    return Response.success(data);
}
