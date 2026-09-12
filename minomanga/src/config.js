var BASE_URL = 'https://minotruyenv7.xyz';
// Khong dat timeout thi host chet an tron 10-11 giay (do 12/09/2026).
var REQ_TIMEOUT = 8000;
var PROBE_TIMEOUT = 4000;

var API = 'https://api.cloudkk-v2.xyz/api';
var TYPE = 'manga';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
try {
    if (CONFIG_TYPE) {
        TYPE = CONFIG_TYPE;
    }
} catch (error) {
}
var FULL_URL = BASE_URL + "/" + TYPE;

var HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Referer": BASE_URL + "/"
};

var LIMIT = 24;

function jsonGet(url) {
    try {
        var res = Http.get(url).headers(HEADERS).timeout(REQ_TIMEOUT).string();
        if (res && res.indexOf("{") >= 0) return JSON.parse(res);
    } catch (e) {}
    if (url.indexOf("api.cloudkk-v2.xyz") >= 0) {
        try {
            var v1Url = url.replace("api.cloudkk-v2.xyz", "api.cloudkk-v1.xyz");
            var res2 = Http.get(v1Url).headers(HEADERS).timeout(REQ_TIMEOUT).string();
            if (res2 && res2.indexOf("{") >= 0) return JSON.parse(res2);
        } catch (e2) {}
    }
    return null;
}

function safeEncodeUrl(u) {
    if (!u) return "";
    try {
        return encodeURI(u);
    } catch (e) {
        return u;
    }
}

// ─── Ảnh WebP trên chính CDN của nguồn ─────────────────────────────────
// p*.ibyteimg.com là CDN ảnh của ByteDance. Cùng một file phục vụ được dưới
// dạng WebP qua nhánh /img/ kèm hậu tố ~tplv, KHÔNG đổi một pixel nào:
//   /obj/tos-alisg-i-<sid>-sg/<hash>
//   -> /img/tos-alisg-i-<sid>-sg/<hash>~tplv-<sid>-image.webp
//
// Đo 12/09/2026 trên trọn một chương 15 trang của minotruyen:
//   10,98 MB JPEG  ->  6,22 MB WebP   (nhẹ hơn 43%, 0 lỗi)
// Từng trang lệch 43-48%, kích thước pixel khớp tuyệt đối, so pixel vùng
// giữa lệch trung bình 2,02/255 — đúng mức tái nén, không méo nội dung.
// Không cần Referer. Đây là CÙNG HOST nguồn đang dùng, không phải proxy lạ.
//
// WebP không mã hoá nổi cạnh quá 16383 px. Ảnh webtoon ở đây cao tới 10.554 px
// nên còn dư, nhưng API trả sẵn width/height thì cứ chặn cho chắc.
var WEBP_MAX_EDGE = 16000;

function cdnWebp(u, w, h) {
    if (!u || u.indexOf("ibyteimg.com") < 0) return u;
    if (u.indexOf("~tplv") >= 0) return u;
    if ((w && w > WEBP_MAX_EDGE) || (h && h > WEBP_MAX_EDGE)) return u;
    var m = String(u).match(/^(https?:\/\/[^\/]+)\/obj\/(tos-[a-z0-9-]*?-i-([a-z0-9]+)-[a-z0-9]+)\/(.+)$/);
    if (!m) return u;
    return m[1] + "/img/" + m[2] + "/" + m[4] + "~tplv-" + m[3] + "-image.webp";
}

function bookCover(b) {
    var c = "";
    if (b && b.cover && b.cover.imageUrl) c = b.cover.imageUrl;
    else if (b && b.covers && b.covers.length > 0 && b.covers[0].url) c = b.covers[0].url;
    if (!c) return "";
    if (c.indexOf("//") === 0) c = "https:" + c;
    return safeEncodeUrl(cdnWebp(c, 0, 0));
}

function bookLink(b) {
    return BASE_URL + "/" + TYPE + "/books/" + b.bookId;
}

function bookTotalChapters(b) {
    if (b && b._count && typeof b._count.chapters === 'number') {
        return b._count.chapters;
    }
    var total = 0;
    if (b.chapters) {
        for (var i = 0; i < b.chapters.length; i++) {
            var n = b.chapters[i].chapterNumber || 0;
            if (n > total) total = n;
        }
    }
    if (!total && b.chapterLatest && b.chapterLatest.chapterNumber) {
        total = b.chapterLatest.chapterNumber;
    }
    return total;
}

function mapBook(b) {
    if (!b || !b.bookId) return null;
    var total = bookTotalChapters(b);
    var title = (b.info && b.info.title) ? b.info.title : (b.title || "");
    return {
        name: title,
        link: bookLink(b),
        cover: bookCover(b),
        description: total ? (total + " chương") : "",
        host: BASE_URL
    };
}

function parseAltName(anotherName) {
    if (!anotherName) return "";
    try {
        var arr = JSON.parse(anotherName);
        for (var i = 0; arr && i < arr.length; i++) {
            for (var k in arr[i]) { if (arr[i][k]) return arr[i][k]; }
        }
    } catch (e) {}
    return "";
}

function buildBooksQuery(input, page) {
    var qs = "category=" + TYPE + "&take=" + LIMIT + "&page=" + page;
    var s = String(input || "");
    var mTag = s.match(/the-loai\/([^/?&]+)/);
    if (mTag) {
        qs += "&genres=" + mTag[1] + "&sortBy=NEW_CHAPTER_AT&order=desc";
    } else if (s.indexOf("CREATED_AT") >= 0) {
        qs += "&sortBy=CREATED_AT&order=desc";
    } else if (s.indexOf("isFeatured") >= 0) {
        qs += "&isFeatured=true&sortBy=NEW_CHAPTER_AT&order=desc";
    } else {
        qs += "&sortBy=NEW_CHAPTER_AT&order=desc";
    }
    return qs;
}

function parseChapterIds(url) {
    if (!url) return null;
    var s = String(url).split(/[?#]/)[0].replace(/\/+$/, "");
    s = s.replace(/([^:])\/+/g, "$1/");

    var m = s.match(/\/books\/(?:[^\/]*?-)?(\d+)\/(?:.*\/)?(?:chapters?\/)?(?:[^\/]*?-)?(\d+)$/);
    if (m) {
        return { bookId: m[1], chapterId: m[2] };
    }

    var nums = s.match(/\/books\/[^\/]+/);
    if (nums) {
        var bMatch = nums[0].match(/(\d+)/);
        var rest = s.substring(s.indexOf(nums[0]) + nums[0].length).replace(/^\/+/, "");
        var cMatch = rest.match(/(\d+)(?:\/?$)/);
        if (bMatch && cMatch) {
            return { bookId: bMatch[1], chapterId: cMatch[1] };
        }
    }
    return null;
}

function fetchChapterImagesApi(chapterId, bookId) {
    var apiUrl = API + "/books/" + bookId + "/chapters/" + chapterId;
    var json = null;
    try {
        var res = Http.get(apiUrl).headers(HEADERS).timeout(REQ_TIMEOUT).string();
        if (res && res.indexOf("{") >= 0) json = JSON.parse(res);
    } catch (e) {}
    if (!json && apiUrl.indexOf("api.cloudkk-v2.xyz") >= 0) {
        try {
            var v1Url = "https://api.cloudkk-v1.xyz/api/books/" + bookId + "/chapters/" + chapterId;
            var res2 = Http.get(v1Url).headers(HEADERS).timeout(REQ_TIMEOUT).string();
            if (res2 && res2.indexOf("{") >= 0) json = JSON.parse(res2);
        } catch (e2) {}
    }
    if (!json || !json.success || !json.data || !json.data.chapter) return null;
    var imgs = json.data.chapter.images;
    if (!imgs || !imgs.length) return null;
    var images = [];
    for (var i = 0; i < imgs.length; i++) {
        var servers = imgs[i].servers;
        if (servers && servers.length > 0) {
            var u = "";
            for (var s = 0; s < servers.length; s++) {
                if (servers[s] && servers[s].imageUrl) {
                    u = String(servers[s].imageUrl).trim();
                    if (u) break;
                }
            }
            if (u) {
                if (u.indexOf("//") === 0) u = "https:" + u;
                images.push(safeEncodeUrl(cdnWebp(u, imgs[i].width, imgs[i].height)));
            }
        }
    }
    return images.length ? images : null;
}
