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
        imgEls = doc.select(".reading-detail .page-chapter img[data-index]");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".box_doc .page-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".reading-detail img");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("src") || "";
        if (!src) src = img.attr("data-src") || "";
        if (!src) src = img.attr("data-original") || "";
        if (!src) src = img.attr("data-cdn") || "";
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
        browser.setUserAgent(UserAgent.android());
        browser.launch(url, 8);
        browser.callJs("", 3500);
        var bDoc = browser.html();
        browser.close();
        browser = null;

        if (bDoc) {
            var bImgs = extractImagesFromDoc(bDoc);
            if (bImgs.length > 0) return bImgs;
        }
    } catch (e) {}
    return null;
}

function execute(url) {
    syncBaseFromUrl(url);
    var doc = fetchRetry(url);
    if (!doc) {
        return Response.error("Không tải được trang chương hoặc domain đã bị chặn");
    }

    var images = extractImagesFromDoc(doc);

    // If 0 images found (due to WebAssembly/JS encryption or login requirement), fallback to WebView execution
    if (images.length === 0) {
        var browserImgs = chapViaBrowser(url);
        if (browserImgs && browserImgs.length > 0) {
            return Response.success(browserImgs);
        }

        var loginHint = selFirst(doc, "a[href*='/Account/Login']");
        if (!loginHint) loginHint = selFirst(doc, "a[href*='/dang-nhap']");
        if (!loginHint) loginHint = selFirst(doc, ".login-page-wrapper");

        if (loginHint) {
            return Response.error("Vui lòng đăng nhập bằng Webview để xem chương này");
        }

        return Response.error("Không tìm thấy ảnh chương");
    }

    return Response.success(images);
}
