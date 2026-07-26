var BASE_URL = 'https://minotruyenv7.xyz';
var API = 'https://api.cloudkk-v1.xyz/api';
var TYPE = 'comics';
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

var LIMIT = 24;

function jsonGet(url) {
    var res = fetch(url);
    if (!res || !res.ok) return null;
    try { return JSON.parse(res.text()); } catch (e) { return null; }
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
    var s = String(url || "");
    var mBook = s.match(/\/books\/(\d+)/);
    if (!mBook) return null;
    var bookId = mBook[1];
    var chapterId = null;
    var mChap = s.match(/\/(\d+)\s*$/);
    if (mChap) chapterId = mChap[1];
    if (!chapterId) return null;
    return { bookId: bookId, chapterId: chapterId };
}

function fetchChapterImagesApi(chapterId, bookId) {
    var apiUrl = API + "/books/" + bookId + "/chapters/" + chapterId;
    var res;
    try { res = fetch(apiUrl); } catch (e) { return null; }
    if (!res || !res.ok) return null;
    var json;
    try { json = JSON.parse(res.text()); } catch (e) { return null; }
    if (!json || !json.success || !json.data || !json.data.chapter) return null;
    var imgs = json.data.chapter.images;
    if (!imgs || !imgs.length) return null;
    var images = [];
    for (var i = 0; i < imgs.length; i++) {
        var servers = imgs[i].servers;
        if (servers && servers.length > 0) {
            var u = servers[0].imageUrl;
            if (u) {
                u = u.trim();
                if (u.indexOf("//") === 0) u = "https:" + u;
                images.push(u);
            }
        }
    }
    return images.length ? images : null;
}
