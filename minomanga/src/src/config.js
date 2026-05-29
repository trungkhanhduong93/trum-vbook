var BASE_URL = 'https://minotruyenv7.xyz';
var API = 'https://api.cloudkk-v1.xyz/api';
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

// ─── Helpers dùng chung cho list/search/detail (API cloudkk, KHÔNG browser) ───
var LIMIT = 24;

function jsonGet(url) {
    var res = fetch(url);
    if (!res || !res.ok) return null;
    try { return JSON.parse(res.text()); } catch (e) { return null; }
}

function bookCover(b) {
    if (b && b.covers && b.covers.length > 0 && b.covers[0].url) return b.covers[0].url;
    return "";
}

function bookLink(b) {
    return BASE_URL + "/" + TYPE + "/books/" + b.bookId;
}

function mapBook(b) {
    if (!b || !b.bookId) return null;
    var desc = "";
    if (b.chapterLatest && b.chapterLatest.num) desc = "Chương " + b.chapterLatest.num;
    return {
        name: b.title || "",
        link: bookLink(b),
        cover: bookCover(b),
        description: desc,
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
