var BASE_URL = 'https://minotruyenv7.xyz';
var API = 'https://api.cloudkk-v1.xyz/api';
var TYPE = 'hentai';
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
        var res = Http.get(url).headers(HEADERS).string();
        if (res && res.indexOf("{") >= 0) return JSON.parse(res);
    } catch (e) {}
    if (url.indexOf("api.cloudkk-v1.xyz") >= 0) {
        try {
            var v2Url = url.replace("api.cloudkk-v1.xyz", "api.cloudkk-v2.xyz");
            var res2 = Http.get(v2Url).headers(HEADERS).string();
            if (res2 && res2.indexOf("{") >= 0) return JSON.parse(res2);
        } catch (e2) {}
    }
    return null;
}

function bookCover(b) {
    if (b && b.cover && b.cover.imageUrl) return b.cover.imageUrl;
    if (b && b.covers && b.covers.length > 0 && b.covers[0].url) return b.covers[0].url;
    return "";
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

    var m = s.match(/\/books\/(\d+)\/(?:.*\/)?(?:chapters?\/)?(?:[^\/]*?-)?(\d+)$/);
    if (m) {
        return { bookId: m[1], chapterId: m[2] };
    }

    var mBook = s.match(/\/books\/(\d+)/);
    if (!mBook) return null;
    var bookId = mBook[1];

    var idx = s.indexOf("/books/" + bookId);
    if (idx < 0) return null;
    var rest = s.substring(idx + ("/books/" + bookId).length).replace(/^\/+/, "");
    if (!rest) return null;

    var mChap = rest.match(/(?:^|\/)(\d+)$/) || rest.match(/(\d+)$/);
    if (mChap) {
        return { bookId: bookId, chapterId: mChap[1] };
    }
    return null;
}

function fetchChapterImagesApi(chapterId, bookId) {
    var apiUrl = API + "/books/" + bookId + "/chapters/" + chapterId;
    var json = null;
    try {
        var res = Http.get(apiUrl).headers(HEADERS).string();
        if (res && res.indexOf("{") >= 0) json = JSON.parse(res);
    } catch (e) {}
    if (!json && apiUrl.indexOf("api.cloudkk-v1.xyz") >= 0) {
        try {
            var v2Url = "https://api.cloudkk-v2.xyz/api/books/" + bookId + "/chapters/" + chapterId;
            var res2 = Http.get(v2Url).headers(HEADERS).string();
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
                images.push(u);
            }
        }
    }
    return images.length ? images : null;
}
