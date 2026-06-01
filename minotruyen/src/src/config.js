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

// ─── Helpers dùng chung cho list/search/detail (API cloudkk, KHÔNG browser) ───
var LIMIT = 24;

function jsonGet(url) {
    var res = fetch(url);
    if (!res || !res.ok) return null;
    try { return JSON.parse(res.text()); } catch (e) { return null; }
}

// Ảnh bìa: ưu tiên covers[0].url (URL tuyệt đối)
function bookCover(b) {
    if (b && b.covers && b.covers.length > 0 && b.covers[0].url) return b.covers[0].url;
    return "";
}

// Link detail PHẢI kết thúc bằng bookId số → toc.js & chap.js (browser) giữ nguyên chạy được
function bookLink(b) {
    return BASE_URL + "/" + TYPE + "/books/" + b.bookId;
}

// Tổng số chương ≈ số chương mới nhất (chapterNumber lớn nhất).
// Listing trả b.chapters (mới→cũ), detail trả b.chapterLatest.
function bookTotalChapters(b) {
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
    return {
        name: b.title || "",
        link: bookLink(b),
        cover: bookCover(b),
        description: total ? (total + " chương") : "",
        host: BASE_URL
    };
}

// anotherName là JSON dạng [{"vi":"..."},{"en":"..."}] → lấy tên đầu tiên
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

// Xây query listing từ input của home.js / genre.js
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
        qs += "&sortBy=NEW_CHAPTER_AT&order=desc"; // mặc định: mới cập nhật
    }
    return qs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ảnh chương cloudkk bị mã hoá AES-256-CBC (CryptoJS OpenSSL "Salted__", KDF MD5).
// chapter.servers = "<ivHex>:<base64>"; CryptoJS dùng key chuỗi → chế độ passphrase,
// salt nằm trong ciphertext, iv hex bị bỏ qua. Giải mã thuần JS (Rhino-safe).
// Passphrase = NEXT_PUBLIC_SECRET_DATA_CHAPTER nhúng trong bundle web (có thể đổi).
// ─────────────────────────────────────────────────────────────────────────────
var SECRET_DATA_CHAPTER = "GCERKSmf28E6nWwrnR8Lz4f7TacKpzMy7aK0rxSB";

var _SBOX = [0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];
var _INV_SBOX = (function () { var inv = new Array(256); for (var i = 0; i < 256; i++) inv[_SBOX[i]] = i; return inv; })();
var _RCON = [0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
var _MD5_S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
var _MD5_K = [0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391];

function _md5(bytes) {
    var origLen = bytes.length; var msg = bytes.slice(); msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var lo = (origLen * 8) >>> 0; var hi = Math.floor(origLen / 0x20000000) >>> 0;
    msg.push(lo & 0xff, (lo >>> 8) & 0xff, (lo >>> 16) & 0xff, (lo >>> 24) & 0xff);
    msg.push(hi & 0xff, (hi >>> 8) & 0xff, (hi >>> 16) & 0xff, (hi >>> 24) & 0xff);
    var a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;
    for (var off = 0; off < msg.length; off += 64) {
        var M = new Array(16);
        for (var j = 0; j < 16; j++) { var p = off + j * 4; M[j] = (msg[p] | (msg[p+1] << 8) | (msg[p+2] << 16) | (msg[p+3] << 24)) | 0; }
        var A = a0, B = b0, C = c0, D = d0;
        for (var i = 0; i < 64; i++) {
            var F, g;
            if (i < 16) { F = (B & C) | ((~B) & D); g = i; }
            else if (i < 32) { F = (D & B) | ((~D) & C); g = (5*i + 1) & 15; }
            else if (i < 48) { F = B ^ C ^ D; g = (3*i + 5) & 15; }
            else { F = C ^ (B | (~D)); g = (7*i) & 15; }
            var tmp = D; D = C; C = B;
            var sum = ((A + F) | 0) + ((_MD5_K[i] + M[g]) | 0) | 0;
            var sh = _MD5_S[i]; var rot = ((sum << sh) | (sum >>> (32 - sh))) | 0;
            B = (B + rot) | 0; A = tmp;
        }
        a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    function w2b(w) { return [w & 0xff, (w >>> 8) & 0xff, (w >>> 16) & 0xff, (w >>> 24) & 0xff]; }
    return w2b(a0).concat(w2b(b0), w2b(c0), w2b(d0));
}

function _utf8ToBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) bytes.push(c);
        else if (c < 0x800) bytes.push(0xC0 | (c >>> 6), 0x80 | (c & 0x3F));
        else if (c < 0xD800 || c >= 0xE000) bytes.push(0xE0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3F), 0x80 | (c & 0x3F));
        else { i++; var cp = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF)); bytes.push(0xF0 | (cp >>> 18), 0x80 | ((cp >>> 12) & 0x3F), 0x80 | ((cp >>> 6) & 0x3F), 0x80 | (cp & 0x3F)); }
    }
    return bytes;
}
function _bytesToUtf8(bytes) {
    var out = ""; var i = 0; var n = bytes.length;
    while (i < n) {
        var b = bytes[i++];
        if (b < 0x80) out += String.fromCharCode(b);
        else if (b < 0xE0) out += String.fromCharCode(((b & 0x1F) << 6) | (bytes[i++] & 0x3F));
        else if (b < 0xF0) out += String.fromCharCode(((b & 0x0F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F));
        else { var cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F); cp -= 0x10000; out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)); }
    }
    return out;
}

var _B64A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var _B64R = null;
function _base64Decode(str) {
    if (!_B64R) { _B64R = {}; for (var i = 0; i < _B64A.length; i++) _B64R[_B64A.charAt(i)] = i; }
    var out = []; var buf = 0, bits = 0;
    for (var j = 0; j < str.length; j++) {
        var ch = str.charAt(j);
        if (ch === '=' || _B64R[ch] === undefined) continue;
        buf = (buf << 6) | _B64R[ch]; bits += 6;
        if (bits >= 8) { bits -= 8; out.push((buf >>> bits) & 0xff); }
    }
    return out;
}

function _evpKDF(passBytes, saltBytes, totalBytes) {
    var derived = []; var prev = [];
    while (derived.length < totalBytes) { var input = prev.concat(passBytes).concat(saltBytes); prev = _md5(input); derived = derived.concat(prev); }
    return derived.slice(0, totalBytes);
}

function _aesKeyExpand256(key) {
    var Nk = 8, Nr = 14; var w = new Array(4 * (Nr + 1));
    for (var i = 0; i < Nk; i++) w[i] = ((key[4*i] << 24) | (key[4*i+1] << 16) | (key[4*i+2] << 8) | key[4*i+3]) >>> 0;
    for (var i2 = Nk; i2 < w.length; i2++) {
        var t = w[i2-1];
        if (i2 % Nk === 0) { t = (((t << 8) | (t >>> 24)) >>> 0); t = ((_SBOX[(t >>> 24) & 0xff] << 24) | (_SBOX[(t >>> 16) & 0xff] << 16) | (_SBOX[(t >>> 8) & 0xff] << 8) | _SBOX[t & 0xff]) >>> 0; t = (t ^ (_RCON[i2/Nk] << 24)) >>> 0; }
        else if (i2 % Nk === 4) { t = ((_SBOX[(t >>> 24) & 0xff] << 24) | (_SBOX[(t >>> 16) & 0xff] << 16) | (_SBOX[(t >>> 8) & 0xff] << 8) | _SBOX[t & 0xff]) >>> 0; }
        w[i2] = (w[i2 - Nk] ^ t) >>> 0;
    }
    return w;
}

function _gmul(a, b) { var p = 0; for (var i = 0; i < 8; i++) { if (b & 1) p ^= a; var hi = a & 0x80; a = (a << 1) & 0xff; if (hi) a ^= 0x1b; b >>= 1; } return p & 0xff; }

function _aesDecryptBlock(input, w) {
    var Nr = 14; var s = new Array(16); for (var i = 0; i < 16; i++) s[i] = input[i];
    for (var c = 0; c < 4; c++) { var wk = w[4*Nr + c]; s[4*c] ^= (wk >>> 24) & 0xff; s[4*c+1] ^= (wk >>> 16) & 0xff; s[4*c+2] ^= (wk >>> 8) & 0xff; s[4*c+3] ^= wk & 0xff; }
    for (var round = Nr - 1; round >= 1; round--) {
        var t1 = s[13]; s[13] = s[9]; s[9] = s[5]; s[5] = s[1]; s[1] = t1;
        var t2a = s[2], t2b = s[6]; s[2] = s[10]; s[6] = s[14]; s[10] = t2a; s[14] = t2b;
        var t3 = s[3]; s[3] = s[7]; s[7] = s[11]; s[11] = s[15]; s[15] = t3;
        for (var i2 = 0; i2 < 16; i2++) s[i2] = _INV_SBOX[s[i2]];
        for (var c2 = 0; c2 < 4; c2++) { var wk2 = w[4*round + c2]; s[4*c2] ^= (wk2 >>> 24) & 0xff; s[4*c2+1] ^= (wk2 >>> 16) & 0xff; s[4*c2+2] ^= (wk2 >>> 8) & 0xff; s[4*c2+3] ^= wk2 & 0xff; }
        for (var c3 = 0; c3 < 4; c3++) {
            var a0 = s[4*c3], a1 = s[4*c3+1], a2 = s[4*c3+2], a3 = s[4*c3+3];
            s[4*c3]   = _gmul(a0,14) ^ _gmul(a1,11) ^ _gmul(a2,13) ^ _gmul(a3,9);
            s[4*c3+1] = _gmul(a0,9)  ^ _gmul(a1,14) ^ _gmul(a2,11) ^ _gmul(a3,13);
            s[4*c3+2] = _gmul(a0,13) ^ _gmul(a1,9)  ^ _gmul(a2,14) ^ _gmul(a3,11);
            s[4*c3+3] = _gmul(a0,11) ^ _gmul(a1,13) ^ _gmul(a2,9)  ^ _gmul(a3,14);
        }
    }
    var f1 = s[13]; s[13] = s[9]; s[9] = s[5]; s[5] = s[1]; s[1] = f1;
    var f2a = s[2], f2b = s[6]; s[2] = s[10]; s[6] = s[14]; s[10] = f2a; s[14] = f2b;
    var f3 = s[3]; s[3] = s[7]; s[7] = s[11]; s[11] = s[15]; s[15] = f3;
    for (var i3 = 0; i3 < 16; i3++) s[i3] = _INV_SBOX[s[i3]];
    for (var c4 = 0; c4 < 4; c4++) { var wk3 = w[c4]; s[4*c4] ^= (wk3 >>> 24) & 0xff; s[4*c4+1] ^= (wk3 >>> 16) & 0xff; s[4*c4+2] ^= (wk3 >>> 8) & 0xff; s[4*c4+3] ^= wk3 & 0xff; }
    return s;
}

function _aesCbcPkcs7Decrypt(cipherBytes, key, iv) {
    var w = _aesKeyExpand256(key); var prev = iv.slice(); var out = [];
    for (var b = 0; b < cipherBytes.length; b += 16) {
        var block = cipherBytes.slice(b, b + 16);
        var dec = _aesDecryptBlock(block, w);
        for (var j = 0; j < 16; j++) out.push(dec[j] ^ prev[j]);
        prev = block;
    }
    var pad = out[out.length - 1];
    if (pad > 0 && pad <= 16) out = out.slice(0, out.length - pad);
    return out;
}

// CryptoJS.AES.decrypt(base64Salted, passphrase).toString(Utf8)
function aesDecryptOpenSSL(b64, passphrase) {
    var all = _base64Decode(b64);
    if (all.length < 16) return null;
    var salt = all.slice(8, 16); var ct = all.slice(16);
    var passBytes = _utf8ToBytes(passphrase);
    var d = _evpKDF(passBytes, salt, 48);
    var key = d.slice(0, 32); var iv = d.slice(32, 48);
    var pt = _aesCbcPkcs7Decrypt(ct, key, iv);
    return _bytesToUtf8(pt);
}

// URL chương: .../books/{bookId}/chapter-{num}-{chapterNumber}  (hoặc .../books/{bookId}/{chapterNumber})
function parseChapterIds(url) {
    var s = String(url || "");
    var mBook = s.match(/\/books\/(\d+)/);
    if (!mBook) return null;
    var bookId = mBook[1];
    var chapterNumber = null;
    var mChap = s.match(/chapter-\d+-(\d+)/);
    if (mChap) chapterNumber = mChap[1];
    else { var mTail = s.match(/\/(\d+)\s*$/); if (mTail) chapterNumber = mTail[1]; }
    if (!chapterNumber) return null;
    return { bookId: bookId, chapterNumber: chapterNumber };
}

// Gọi API + giải mã servers → mảng imageUrl (server đầu tiên). null nếu thất bại.
function fetchChapterImagesApi(chapterNumber, bookId) {
    var apiUrl = API + "/chapters/" + chapterNumber + "/" + bookId;
    var res;
    try { res = fetch(apiUrl); } catch (e) { return null; }
    if (!res || !res.ok) return null;
    var json;
    try { json = JSON.parse(res.text()); } catch (e) { return null; }
    if (!json || !json.success || !json.data || !json.data.chapter) return null;
    var enc = json.data.chapter.servers;
    if (!enc || enc.indexOf(":") < 0) return null;
    var b64 = enc.substring(enc.indexOf(":") + 1);
    var plain;
    try { plain = aesDecryptOpenSSL(b64, SECRET_DATA_CHAPTER); } catch (e) { return null; }
    if (!plain) return null;
    var servers;
    try { servers = JSON.parse(plain); } catch (e) { return null; }
    if (!servers || !servers.length) return null;
    // Chọn server đầu tiên có content
    var content = null;
    for (var i = 0; i < servers.length; i++) {
        if (servers[i] && servers[i].content && servers[i].content.length) { content = servers[i].content; break; }
    }
    if (!content) return null;
    var images = [];
    for (var j = 0; j < content.length; j++) {
        var u = content[j] && content[j].imageUrl ? String(content[j].imageUrl).trim() : "";
        if (!u) continue;
        if (u.indexOf("//") === 0) u = "https:" + u;
        images.push(u);
    }
    return images.length ? images : null;
}
