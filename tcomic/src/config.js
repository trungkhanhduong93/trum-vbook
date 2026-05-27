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

function _bytesUtf8(s) {
    return new Packages.java.lang.String(s).getBytes("UTF-8");
}

function _concat(a, b) {
    var out = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, a.length + b.length);
    Packages.java.lang.System.arraycopy(a, 0, out, 0, a.length);
    Packages.java.lang.System.arraycopy(b, 0, out, a.length, b.length);
    return out;
}

function _evpKDF(passBytes, saltBytes, totalBytes) {
    var md5 = Packages.java.security.MessageDigest.getInstance("MD5");
    var derived = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, 0);
    var prev = derived;
    while (derived.length < totalBytes) {
        md5.reset();
        if (prev.length > 0) md5.update(prev);
        md5.update(passBytes);
        md5.update(saltBytes);
        prev = md5.digest();
        derived = _concat(derived, prev);
    }
    return Packages.java.util.Arrays.copyOfRange(derived, 0, totalBytes);
}

function aesEncryptOpenSSL(plain, passphrase) {
    var salt = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, 8);
    new Packages.java.security.SecureRandom().nextBytes(salt);

    var passBytes = _bytesUtf8(passphrase);
    var derived = _evpKDF(passBytes, salt, 48);
    var key = Packages.java.util.Arrays.copyOfRange(derived, 0, 32);
    var iv = Packages.java.util.Arrays.copyOfRange(derived, 32, 48);

    var cipher = Packages.javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
    var keySpec = new Packages.javax.crypto.spec.SecretKeySpec(key, "AES");
    var ivSpec = new Packages.javax.crypto.spec.IvParameterSpec(iv);
    cipher.init(Packages.javax.crypto.Cipher.ENCRYPT_MODE, keySpec, ivSpec);
    var encrypted = cipher.doFinal(_bytesUtf8(plain));

    var prefix = _bytesUtf8("Salted__");
    var full = _concat(_concat(prefix, salt), encrypted);
    return String(Packages.java.util.Base64.getEncoder().encodeToString(full));
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
