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

// fetchRetry() trả về Response chứ không phải Document → phải .html().
// Không dùng fetchRetry ở đây: tường đăng nhập làm res.ok = false, kéo theo
// autoProbeDomains() rà một loạt domain chết (mỗi domain timeout vài giây) vô ích.
// Chỉ rà domain khi thật sự không lấy nổi HTML nào về.
function fetchChapterDoc(url) {
    var doc = null;
    try {
        var res = fetch(url, FETCH_OPTIONS);
        if (res) doc = res.html();
    } catch (e) {}
    if (doc) return doc;

    var probed = autoProbeDomains(url);
    if (!probed) return null;
    try { return probed.html(); } catch (e) {}
    return null;
}

function chapDocViaBrowser(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // Áp dụng API ẩn browser.block() từ lõi vBook.apk chặn đứng 100% script rác, ads, tracking, css
        browser.block([".*google.*", ".*facebook.*", ".*analytics.*", ".*doubleclick.*", ".*adservice.*", ".*\\.css.*", ".*\\.gif", ".*stats.*"]);
        // Đơn vị trong lõi vBook là GIÂY: 1s là vừa đủ khi đã chặn sạch rác
        browser.launch(url, 1);
        browser.callJs("window.scrollTo(0, document.body.scrollHeight);", 1);
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

    // Tầng 1: Fast-path HTTP. vBook tự động chuyển cookie session từ WebView sang HTTP.
    // Nếu có session hoặc truyện không khoá, trả kết quả ngay lập tức trong 200ms!
    var doc = fetchChapterDoc(url);
    if (doc) {
        var images = extractImagesFromDoc(doc);
        if (images && images.length > 0 && !isLoginWall(doc)) {
            return Response.success(images);
        }
    }

    // Tầng 2: Ultra-fast Headless WebView với browser.block() chặn rác (< 800ms)
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
