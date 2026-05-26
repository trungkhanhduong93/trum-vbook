load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");
    
    var html = doc.html();
    var images = [];
    
    var imgsMatch = html.match(/\\"images\\":\\\[(.*?)\\\]/);
    if (imgsMatch) {
        var inner = imgsMatch[1];
        var urls = [];
        var regex = /\\"src\\":\\"([^\\"]+)\\"/g;
        var m;
        while ((m = regex.exec(inner)) !== null) {
            urls.push(m[1]);
        }
        
        for (var i = 0; i < urls.length; i++) {
            var src = urls[i].replace(/\\u0026/g, "&");
            images.push(src);
        }
    }
    
    if (images.length === 0) {
        var imgEls = doc.select("img");
        for (var i = 0; i < imgEls.size(); i++) {
            var el = imgEls.get(i);
            var src = el.attr("src") || el.attr("data-src") || el.attr("data-original") || "";
            if (src && src.indexOf("logo") === -1 && src.indexOf("icon") === -1 && src.indexOf("data:") === -1) {
                images.push(resolveUrl(src));
            }
        }
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
