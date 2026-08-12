load("config.js");

// ─── Ảnh chương ─────────────────────────────────────────────────────────────
// Đường nhanh: hỏi at-home API của MangaDex (6,6KB JSON) thay vì tải trang chương
// 662KB rồi để Jsoup dựng DOM. Chapter id của cuutruyen chính là chapter id
// MangaDex; URL dựng ra đã đối chiếu khớp tuyệt đối 45/45 với HTML của site.
//
// Đường dự phòng: nếu at-home hỏng hoặc bị chặn thì quay lại parse HTML như cũ.
//
// URL ảnh vẫn đi qua worker của site (xem IMG_PROXY trong config.js).
// v3 từng bóc lớp worker để trả thẳng cmdxd98sb0x3yprd.mangadex.network: máy dev
// đo nhanh hơn 1,9-4,4 lần, nhưng trên điện thoại ảnh KHÔNG tải được vì mạng di
// động VN chặn mangadex.network. Không bóc nữa.
// Luật cứng: chỉ trả URL trần, KHÔNG nối "|Referer=" vào URL ảnh.

function chapterId(url) {
    var m = String(url || "").match(/\/chapters\/([a-f0-9-]{8,})/i);
    return m ? m[1] : "";
}

function imagesFromApi(url) {
    var id = chapterId(url);
    if (!id) return [];

    var json = null;
    try {
        var s = Http.get(MDX_AT_HOME + id).headers(HEADERS).string();
        if (s) json = JSON.parse(s);
    } catch (e) {
        return [];
    }

    if (!json || !json.baseUrl || !json.chapter || !json.chapter.hash) return [];

    // dataSaver là bản site đang dùng (nhẹ hơn); chỉ rơi về data khi chương
    // không có bản nén.
    var files = json.chapter.dataSaver;
    var kind = "/data-saver/";
    if (!files || !files.length) {
        files = json.chapter.data;
        kind = "/data/";
    }
    if (!files || !files.length) return [];

    var out = [];
    for (var i = 0; i < files.length; i++) {
        var name = String(files[i] || "").trim();
        if (name) out.push(proxiedImage(json.baseUrl + kind + json.chapter.hash + "/" + name));
    }
    return out;
}

function imagesFromHtml(url) {
    var doc = fetchDoc(url);
    if (!doc) return [];

    var images = [];
    var seen = {};

    // Trang chương dựng 2 trình đọc (#classic-reader và #zen-reader) với cùng
    // bộ ảnh — bám #classic-reader để không lấy trùng gấp đôi.
    var imgs = doc.select("#classic-reader img[data-src]");
    if (!imgs || imgs.size() === 0) imgs = doc.select("img.lazy-load[data-src]");

    for (var i = 0; i < imgs.size(); i++) {
        var src = String(imgs.get(i).attr("data-src") || "").trim();
        if (!src || src.indexOf("data:image") === 0) continue;

        src = absUrl(src);
        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    return images;
}

function execute(url) {
    var images = imagesFromApi(url);
    if (!images.length) images = imagesFromHtml(url);

    if (images.length === 0) return Response.error("Chương này chưa có ảnh trên Cứu Truyện");
    return Response.success(images);
}
