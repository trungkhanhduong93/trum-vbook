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

function chapViaBrowser(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // Do not override userAgent so WebView retains logged-in session cookies
        browser.launch(url, 8);
        browser.callJs("window.scrollTo(0, document.body.scrollHeight);", 3000);
        var bDoc = browser.html();
        browser.close();
        browser = null;

        if (bDoc) {
            var bImgs = extractImagesFromDoc(bDoc);
            if (bImgs && bImgs.length > 0) return bImgs;
        }
    } catch (e) {
        if (browser) {
            try { browser.close(); } catch(err) {}
        }
    }
    return null;
}

function execute(url) {
    syncBaseFromUrl(url);

    // 1. Direct Jsoup fetch
    var doc = fetchRetry(url);
    if (doc) {
        var images = extractImagesFromDoc(doc);
        if (images && images.length > 0) {
            return Response.success(images);
        }
    }

    // 2. WebAssembly / LazyLoad / Logged-in Session WebView Fallback
    var browserImgs = chapViaBrowser(url);
    if (browserImgs && browserImgs.length > 0) {
        return Response.success(browserImgs);
    }

    if (doc) {
        var loginHint = selFirst(doc, "a[href*='/Account/Login']");
        if (!loginHint) loginHint = selFirst(doc, "a[href*='/dang-nhap']");
        if (!loginHint) loginHint = selFirst(doc, ".login-page-wrapper");

        if (loginHint) {
            return Response.error("Vui lòng mở Webview đăng nhập lại tài khoản LuotTruyen");
        }
    }

    return Response.error("Không tìm thấy ảnh chương. Vui lòng kiểm tra lại trang nguồn.");
}
