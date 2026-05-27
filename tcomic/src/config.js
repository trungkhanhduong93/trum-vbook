var SITE_URL = 'https://tcomicfanqq.com';
var API_URL = 'https://api.tcomicfanqq.com';
try {
    if (CONFIG_URL) {
        SITE_URL = CONFIG_URL;
        var m = String(CONFIG_URL).match(/^https?:\/\/([^\/]+)/);
        if (m) {
            API_URL = 'https://api.' + m[1].replace(/^www\./, '');
        }
    }
} catch (e) {}

var LIMIT = 24;
var SECRET1 = 'iHbS0oIGYjVaLwvjynBpjQFtc5YCCGX6';
var SECRET2 = 'sTUSpQjxBQIW3EdsadsauVEo6ZGmIEp6zxJgJV';

var BE = {
    "/api/web/comic/top/chapter": "xK9m2Pq5vR8nL3wY",
    "/api/web/comic/top/comment": "hJ7tN4cX2dB9mE6v",
    "/api/web/comic/top/daily": "wQ5aZ8kP3fG9nM4x",
    "/api/web/comic/top/follow": "uY2sL7jH4vC8tR5b",
    "/api/web/comic/top/monthly": "pD6mK9nX3wQ8vE4t",
    "/api/web/comic/top/weekly": "bF5hN2mJ7kL4wS9x",
    "/api/web/comic/chapters": "tR8cX4vB2nM6pH9q",
    "/api/web/comic/comments": "gW3kL8pE5nX9jM2v",
    "/api/web/comic/completed-comics": "yH6tB4mS9cR2wQ7n",
    "/api/web/comic/genres": "dK5vX8nL3pH7mE4w",
    "/api/web/comic/girl-comics": "aF9jR2tY6mN4wS8x",
    "/api/web/comic/boy-comics": "aF9jR2tY6mN4wS323",
    "/api/web/comic/info": "zQ7hB5vC3kL9pM2n",
    "/api/web/comic/new-comics": "mW4sX8gH2nR6tE9j",
    "/api/web/comic/recent-update-comics": "cP5kM9wL4vB8nX2t",
    "/api/web/comic/recommend-comics": "fT3jH7mE2sQ9rY6w",
    "/api/web/comic/report-chapter-comic": "bN8kR4xW6pH2vL9t",
    "/api/web/comic/search": "qM5cY9nJ3wS7tE4h",
    "/api/web/comic/suggest": "vB2pK8mX4fL6wR9n",
    "/api/web/comic/top": "sH7tG3nQ9cM5xW2j",
    "/api/web/comic/trending-comics": "kD4wP8vY6mL2tR5n",
    "/api/web/comic/genres/all": "aF9jR2tY6mN4wS323dhjksa"
};

function REQ_HEADERS() {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi-VN,vi;q=0.9",
        "Referer": SITE_URL + "/",
        "Origin": SITE_URL
    };
}

// Pure-JS CryptoJS.AES.encrypt(text, passphrase).toString() compatible impl.
// Rhino-safe: no Java/Packages access. Output is Base64("Salted__" + 8-byte salt + AES-256-CBC/PKCS7 ciphertext).
// Key+IV derived via OpenSSL EVP_BytesToKey (MD5, 1 iteration per round).

function _utf8ToBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) {
            bytes.push(c);
        } else if (c < 0x800) {
            bytes.push(0xC0 | (c >>> 6), 0x80 | (c & 0x3F));
        } else if (c < 0xD800 || c >= 0xE000) {
            bytes.push(0xE0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3F), 0x80 | (c & 0x3F));
        } else {
            i++;
            var cp = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
            bytes.push(0xF0 | (cp >>> 18), 0x80 | ((cp >>> 12) & 0x3F),
                       0x80 | ((cp >>> 6) & 0x3F), 0x80 | (cp & 0x3F));
        }
    }
    return bytes;
}

var _B64A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function _base64Encode(bytes) {
    var out = "";
    var i = 0;
    var n = bytes.length;
    while (i + 3 <= n) {
        var x = (bytes[i] << 16) | (bytes[i+1] << 8) | bytes[i+2];
        out += _B64A.charAt((x >>> 18) & 63) + _B64A.charAt((x >>> 12) & 63)
             + _B64A.charAt((x >>> 6) & 63) + _B64A.charAt(x & 63);
        i += 3;
    }
    var rem = n - i;
    if (rem === 1) {
        var x1 = bytes[i] << 16;
        out += _B64A.charAt((x1 >>> 18) & 63) + _B64A.charAt((x1 >>> 12) & 63) + "==";
    } else if (rem === 2) {
        var x2 = (bytes[i] << 16) | (bytes[i+1] << 8);
        out += _B64A.charAt((x2 >>> 18) & 63) + _B64A.charAt((x2 >>> 12) & 63)
             + _B64A.charAt((x2 >>> 6) & 63) + "=";
    }
    return out;
}

function _randBytes(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(Math.floor(Math.random() * 256) & 0xff);
    return out;
}

var _MD5_S = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21
];
var _MD5_K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
];

function _md5(bytes) {
    var origLen = bytes.length;
    var msg = bytes.slice();
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var bitLenLo = (origLen * 8) >>> 0;
    var bitLenHi = Math.floor(origLen / 0x20000000) >>> 0;
    msg.push(bitLenLo & 0xff, (bitLenLo >>> 8) & 0xff, (bitLenLo >>> 16) & 0xff, (bitLenLo >>> 24) & 0xff);
    msg.push(bitLenHi & 0xff, (bitLenHi >>> 8) & 0xff, (bitLenHi >>> 16) & 0xff, (bitLenHi >>> 24) & 0xff);

    var a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;

    for (var off = 0; off < msg.length; off += 64) {
        var M = new Array(16);
        for (var j = 0; j < 16; j++) {
            var p = off + j * 4;
            M[j] = (msg[p] | (msg[p+1] << 8) | (msg[p+2] << 16) | (msg[p+3] << 24)) | 0;
        }
        var A = a0, B = b0, C = c0, D = d0;
        for (var i = 0; i < 64; i++) {
            var F, g;
            if (i < 16)      { F = (B & C) | ((~B) & D); g = i; }
            else if (i < 32) { F = (D & B) | ((~D) & C); g = (5*i + 1) & 15; }
            else if (i < 48) { F = B ^ C ^ D;            g = (3*i + 5) & 15; }
            else             { F = C ^ (B | (~D));       g = (7*i) & 15; }
            var tmp = D;
            D = C;
            C = B;
            var sum = ((A + F) | 0) + ((_MD5_K[i] + M[g]) | 0) | 0;
            var sh = _MD5_S[i];
            var rot = ((sum << sh) | (sum >>> (32 - sh))) | 0;
            B = (B + rot) | 0;
            A = tmp;
        }
        a0 = (a0 + A) | 0;
        b0 = (b0 + B) | 0;
        c0 = (c0 + C) | 0;
        d0 = (d0 + D) | 0;
    }

    function w2b(w) { return [w & 0xff, (w >>> 8) & 0xff, (w >>> 16) & 0xff, (w >>> 24) & 0xff]; }
    return w2b(a0).concat(w2b(b0), w2b(c0), w2b(d0));
}

var _SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];
var _RCON = [0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];

function _aesKeyExpand256(key) {
    var Nk = 8, Nr = 14;
    var w = new Array(4 * (Nr + 1));
    for (var i = 0; i < Nk; i++) {
        w[i] = ((key[4*i] << 24) | (key[4*i+1] << 16) | (key[4*i+2] << 8) | key[4*i+3]) >>> 0;
    }
    for (var i2 = Nk; i2 < w.length; i2++) {
        var t = w[i2-1];
        if (i2 % Nk === 0) {
            t = (((t << 8) | (t >>> 24)) >>> 0);
            t = ((_SBOX[(t >>> 24) & 0xff] << 24) | (_SBOX[(t >>> 16) & 0xff] << 16)
               | (_SBOX[(t >>> 8) & 0xff] << 8)   |  _SBOX[t & 0xff]) >>> 0;
            t = (t ^ (_RCON[i2/Nk] << 24)) >>> 0;
        } else if (i2 % Nk === 4) {
            t = ((_SBOX[(t >>> 24) & 0xff] << 24) | (_SBOX[(t >>> 16) & 0xff] << 16)
               | (_SBOX[(t >>> 8) & 0xff] << 8)   |  _SBOX[t & 0xff]) >>> 0;
        }
        w[i2] = (w[i2 - Nk] ^ t) >>> 0;
    }
    return w;
}

function _gmul2(b) {
    var r = (b << 1) & 0xff;
    if (b & 0x80) r ^= 0x1b;
    return r;
}

function _aesEncryptBlock(input, w) {
    var Nr = 14;
    var s = new Array(16);
    for (var i = 0; i < 16; i++) s[i] = input[i];

    for (var c0 = 0; c0 < 4; c0++) {
        var wk0 = w[c0];
        s[4*c0]   ^= (wk0 >>> 24) & 0xff;
        s[4*c0+1] ^= (wk0 >>> 16) & 0xff;
        s[4*c0+2] ^= (wk0 >>> 8) & 0xff;
        s[4*c0+3] ^=  wk0 & 0xff;
    }

    for (var round = 1; round < Nr; round++) {
        for (var i2 = 0; i2 < 16; i2++) s[i2] = _SBOX[s[i2]];
        var t1 = s[1]; s[1] = s[5]; s[5] = s[9]; s[9] = s[13]; s[13] = t1;
        var t2a = s[2], t2b = s[6]; s[2] = s[10]; s[6] = s[14]; s[10] = t2a; s[14] = t2b;
        var t3 = s[15]; s[15] = s[11]; s[11] = s[7]; s[7] = s[3]; s[3] = t3;
        for (var c1 = 0; c1 < 4; c1++) {
            var a0 = s[4*c1], a1 = s[4*c1+1], a2 = s[4*c1+2], a3 = s[4*c1+3];
            var x = a0 ^ a1 ^ a2 ^ a3;
            s[4*c1]   = a0 ^ x ^ _gmul2(a0 ^ a1);
            s[4*c1+1] = a1 ^ x ^ _gmul2(a1 ^ a2);
            s[4*c1+2] = a2 ^ x ^ _gmul2(a2 ^ a3);
            s[4*c1+3] = a3 ^ x ^ _gmul2(a3 ^ a0);
        }
        for (var c2 = 0; c2 < 4; c2++) {
            var wk1 = w[4*round + c2];
            s[4*c2]   ^= (wk1 >>> 24) & 0xff;
            s[4*c2+1] ^= (wk1 >>> 16) & 0xff;
            s[4*c2+2] ^= (wk1 >>> 8) & 0xff;
            s[4*c2+3] ^=  wk1 & 0xff;
        }
    }

    for (var i3 = 0; i3 < 16; i3++) s[i3] = _SBOX[s[i3]];
    var t1f = s[1]; s[1] = s[5]; s[5] = s[9]; s[9] = s[13]; s[13] = t1f;
    var t2af = s[2], t2bf = s[6]; s[2] = s[10]; s[6] = s[14]; s[10] = t2af; s[14] = t2bf;
    var t3f = s[15]; s[15] = s[11]; s[11] = s[7]; s[7] = s[3]; s[3] = t3f;
    for (var c3 = 0; c3 < 4; c3++) {
        var wk2 = w[4*Nr + c3];
        s[4*c3]   ^= (wk2 >>> 24) & 0xff;
        s[4*c3+1] ^= (wk2 >>> 16) & 0xff;
        s[4*c3+2] ^= (wk2 >>> 8) & 0xff;
        s[4*c3+3] ^=  wk2 & 0xff;
    }
    return s;
}

function _aesCbcPkcs7Encrypt(plainBytes, key, iv) {
    var w = _aesKeyExpand256(key);
    var pad = 16 - (plainBytes.length % 16);
    var padded = plainBytes.slice();
    for (var i = 0; i < pad; i++) padded.push(pad);
    var prev = iv.slice();
    var out = [];
    for (var b = 0; b < padded.length; b += 16) {
        var block = new Array(16);
        for (var j = 0; j < 16; j++) block[j] = padded[b+j] ^ prev[j];
        var enc = _aesEncryptBlock(block, w);
        for (var k = 0; k < 16; k++) out.push(enc[k]);
        prev = enc;
    }
    return out;
}

function _evpKDF(passBytes, saltBytes, totalBytes) {
    var derived = [];
    var prev = [];
    while (derived.length < totalBytes) {
        var input = prev.concat(passBytes).concat(saltBytes);
        prev = _md5(input);
        derived = derived.concat(prev);
    }
    return derived.slice(0, totalBytes);
}

function aesEncryptOpenSSL(plainText, passphrase) {
    var salt = _randBytes(8);
    var passBytes = _utf8ToBytes(passphrase);
    var derived = _evpKDF(passBytes, salt, 48);
    var key = derived.slice(0, 32);
    var iv = derived.slice(32, 48);
    var plainBytes = _utf8ToBytes(plainText);
    var encrypted = _aesCbcPkcs7Encrypt(plainBytes, key, iv);
    var prefix = _utf8ToBytes("Salted__");
    var full = prefix.concat(salt).concat(encrypted);
    return _base64Encode(full);
}

function _sortedJSON(params) {
    var keys = [];
    for (var k in params) {
        if (params.hasOwnProperty(k)) keys.push(k);
    }
    keys.sort();
    var parts = [];
    for (var i = 0; i < keys.length; i++) {
        var v = params[keys[i]];
        parts.push(JSON.stringify(keys[i]) + ":" + JSON.stringify(String(v)));
    }
    return "{" + parts.join(",") + "}";
}

function signPath(path, params) {
    var sigPath = path.replace(/\/\d+(?=\/|$)/g, "");
    var salt = BE.hasOwnProperty(sigPath) ? BE[sigPath] : "undefined";
    var hourMs = Math.floor(new Date().getTime() / 3600000) * 3600000;
    var plain = salt + "-" + sigPath + "-" + SECRET1 + "-" + hourMs + "-" + _sortedJSON(params || {});
    return aesEncryptOpenSSL(plain, SECRET2);
}

function buildQS(params) {
    if (!params) return "";
    var parts = [];
    for (var k in params) {
        if (params.hasOwnProperty(k)) {
            parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k])));
        }
    }
    return parts.length ? "?" + parts.join("&") : "";
}

function apiGet(path, params) {
    var sig = signPath(path, params || {});
    var headers = REQ_HEADERS();
    if (sig) headers["x-request-id"] = sig;
    var url = API_URL + path + buildQS(params);
    try {
        var s = Http.get(url).headers(headers).string();
        if (!s) return null;
        return JSON.parse(s);
    } catch (e) {
        return null;
    }
}

function statusText(s) {
    s = (s || "").toString().toUpperCase();
    if (s === "COMPLETED" || s === "DONE" || s === "COMPLETE") return {text: "Đã hoàn thành", ongoing: false};
    return {text: "Đang tiến hành", ongoing: true};
}

function comicLink(slug, id) {
    return "/truyen-tranh/" + slug + "-" + id;
}

function mapComicCard(c) {
    if (!c) return null;
    var slug = c.slug || "";
    var id = c.id || "";
    if (!slug || !id) return null;
    var desc = "";
    if (c.last_chapter && c.last_chapter.name) {
        desc = c.last_chapter.name;
    } else if (c.updated_at) {
        desc = c.updated_at;
    }
    return {
        name: c.title || "",
        link: comicLink(slug, id),
        description: desc,
        cover: c.thumbnail || "",
        host: SITE_URL
    };
}
