load("config.js");

function extractImagesFromDoc(doc) {
    var images = [];
    var seen = {};

    var imgEls = doc.select("#view-chapter img");

    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-detail .page-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".chapter-content img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-content img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".content-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".page-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".box_doc img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-detail img");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("src") || "";
        if (!src || src.indexOf("data:image") >= 0 || src.indexOf("blank.") >= 0 || src.indexOf("/Content/") >= 0) {
            src = img.attr("data-original") || "";
        }
        if (!src) src = img.attr("data-src") || "";
        if (!src) src = img.attr("data-cdn") || "";
        if (!src) src = img.attr("data-url") || "";
        if (!src) src = img.attr("data-lazy-src") || "";
        if (!src) src = img.attr("data-img") || "";
        if (!src) src = img.attr("data-path") || "";
        if (!src) continue;

        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("avatar") >= 0) continue;
        if (src.indexOf("icon") >= 0) continue;
        if (src.indexOf("avata.png") >= 0) continue;
        if (src.indexOf("/Content/") >= 0) continue;
        if (src.indexOf("googleusercontent") >= 0) continue;
        if (src.indexOf("1x1") >= 0) continue;
        if (src.indexOf("blank.") >= 0) continue;

        if (src.indexOf("//") === 0) {
            src = "https:" + src;
        } else if (src.indexOf("http") !== 0) {
            if (src.charAt(0) === "/") {
                src = BASE_URL + src;
            }
        }

        if (seen[src]) continue;
        seen[src] = true;

        images.push(src);
    }

    return images;
}

var LOGIN_MSG = "LuotTruyen đã khoá toàn bộ chương sau đăng nhập Google. "
    + "Hãy mở chính chương này bằng WebView ngay trong app (menu nguồn → mở trang web), "
    + "đăng nhập Gmail tại đó rồi quay lại đọc. Đăng nhập bằng Chrome ngoài app không dùng được.";

// Từ 12/08/2026 mọi URL chương đều 302 về /Account/Login khi chưa đăng nhập.
// Tường đăng nhập nhận diện được cả trên trang login đầy đủ lẫn body 302 rút gọn.
function isLoginWall(doc) {
    if (!doc) return false;
    if (selFirst(doc, ".login-page-wrapper")) return true;
    if (selFirst(doc, "a[href*='/Account/Google']")) return true;
    if (selFirst(doc, "a[href*='/Account/Login']")) return true;
    return false;
}

// Fast-path tải trực tiếp trang chương qua HTTP (Http.get/fetch gắn Cookie Google từ localCookie)
function fetchChapterDoc(url) {
    var doc = null;
    var cookie = getLocalCookie(url);
    var headers = {
        "User-Agent": FETCH_HEADERS["User-Agent"],
        "Accept": FETCH_HEADERS["Accept"],
        "Accept-Language": FETCH_HEADERS["Accept-Language"],
        "Referer": BASE_URL + "/"
    };
    if (cookie) {
        headers["Cookie"] = cookie;
    }

    // 1. Ưu tiên Http.get (đồng bộ OkHttp trong vBook, tốc độ cực nhanh ~200ms)
    try {
        if (typeof Http !== "undefined" && Http.get) {
            doc = Http.get(url).headers(headers).html();
        }
    } catch (eHttp) {}

    // 2. Dự phòng qua fetch nếu Http.get không trả về doc
    if (!doc) {
        try {
            var res = fetch(url, { headers: headers });
            if (res) doc = res.html();
        } catch (eFetch) {}
    }

    if (doc) return doc;

    var probed = autoProbeDomains(url);
    if (!probed) return null;
    try { return probed.html(); } catch (eProbe) {}
    return null;
}

function chapDocViaBrowser(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        try {
            // Chặn đứng toàn bộ ảnh, css, gif, script tracking rác để nạp DOM nhanh nhất
            browser.block([
                ".*\\.jpg.*",
                ".*\\.jpeg.*",
                ".*\\.png.*",
                ".*\\.webp.*",
                ".*\\.gif.*",
                ".*\\.svg.*",
                ".*\\.css.*",
                ".*google.*",
                ".*facebook.*",
                ".*analytics.*",
                ".*doubleclick.*",
                ".*adservice.*",
                ".*stats.*",
                ".*traffic.*"
            ]);
        } catch (eBlock) {}
        // Đơn vị trong lõi vBook là GIÂY: 1s là vừa đủ khi đã chặn sạch rác
        browser.launch(url, 1);
        try {
            browser.callJs("window.scrollTo(0, document.body.scrollHeight);", 1);
        } catch (eJs) {}
        var bDoc = browser.html();
        return bDoc;
    } catch (e) {
        return null;
    } finally {
        if (browser) {
            try { browser.close(); } catch (err) {}
        }
    }
}

function execute(url) {
    syncBaseFromUrl(url);
    url = swapDomain(url);

    // Tầng 1: Fast-path HTTP có gắn Cookie phiên đăng nhập Google từ localCookie.
    // Nếu có session Google đã đăng nhập hoặc chương mở, đọc thẳng trong ~200ms mà không cần bật WebView!
    var doc = fetchChapterDoc(url);
    if (doc) {
        var images = extractImagesFromDoc(doc);
        if (images && images.length > 0 && !isLoginWall(doc)) {
            return Response.success(images);
        }
    }

    // Tầng 2: Ultra-fast Headless WebView (<1s) với browser.block() chặn toàn bộ ảnh, css, gif, tracking rác
    var bDoc = chapDocViaBrowser(url);
    if (bDoc) {
        var bImgs = extractImagesFromDoc(bDoc);
        if (bImgs && bImgs.length > 0) {
            return Response.success(bImgs);
        }
        if (isLoginWall(bDoc)) {
            return Response.error(LOGIN_MSG);
        }
    }

    if (doc && isLoginWall(doc)) {
        return Response.error(LOGIN_MSG);
    }

    return Response.error("Không tìm thấy ảnh chương. Vui lòng kiểm tra lại trang nguồn.");
}
