load('config.js');

function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    let doc = fetchRetry(url);
    if (doc) {
        let imgs = doc.select(".w-full.mx-auto.center img, .w-full.mx-auto img, .chapter-img-wrapper img, .chapter-images img, #chapter-content img, .reading-detail img");
        if (imgs.size() === 0) {
            imgs = doc.select("img").filter(function(e) {
                let s = e.attr("src") || "";
                return s.indexOf("uploads") !== -1 || s.indexOf("chapter") !== -1 || s.indexOf("page") !== -1 || s.indexOf("zetimage.com") !== -1;
            });
        }
        
        let data = [];
        let seen = {};
        imgs.forEach(e => {
            let link = e.attr("src") || e.attr("data-src") || e.attr("srcset") || "";
            if (link.indexOf(" ") > 0) link = link.split(" ")[0];

            if (link) {
                link = link.trim();
                if (link.startsWith("//")) {
                    link = "https:" + link;
                }
                
                // Exclude tracking pixels and icons
                if (link.indexOf('logo') !== -1 || link.indexOf('icons') !== -1 || link.indexOf('thumb-default') !== -1) return;

                if (!seen[link]) {
                    seen[link] = true;
                    // Optimize image loading speed using WP proxy
                    if (link.indexOf('otruyencdn') > 0 || link.indexOf('zettruyen') > 0 || link.indexOf('mangak') > 0) {
                        data.push("https://i0.wp.com/" + link.replace(/^(https?:\/\/)/, ""));
                    } else {
                        data.push(link);
                    }
                }
            }
        });
        return Response.success(data);
    }
    return null;
}
