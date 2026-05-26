load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    var fetchUrl = "";

    if (url.indexOf("http") === 0) {
        fetchUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + p;
    } else {
        fetchUrl = API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(url) + "&page=" + p;
    }

    var str = fetchJson(fetchUrl);
    if (!str) return Response.error("Không tải được danh sách truyện");

    try {
        var json = JSON.parse(str);
        if (json.status !== "success") return Response.error("Lỗi API: " + json.status);

        var data = json.data;
        var cdnImage = data.APP_DOMAIN_CDN_IMAGE || "https://img.otruyenapi.com";
        var list = data.items || [];
        var items = [];

        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            
            var name = trimText(item.name);
            var link = BASE_URL + "/truyen-tranh/" + item.slug;
            
            var cover = "";
            var thumb = item.thumb_url || item.poster_url || "";
            if (thumb) {
                if (thumb.indexOf("http") === 0) cover = thumb;
                else cover = cdnImage + "/uploads/comics/" + thumb;
            }

            var chap = "Đang cập nhật";
            var latest = item.chaptersLatest || [];
            if (latest.length > 0) {
                chap = latest[0].chapter_name + " Chương";
            }

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
        var params = data.params || {};
        var pagination = params.pagination || {};
        var total = pagination.totalItems || 0;
        var limit = pagination.totalItemsPerPage || 0;
        if (total > 0 && limit > 0 && p * limit < total) {
            next = String(p + 1);
        }

        return Response.success(items, next);
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }
}
