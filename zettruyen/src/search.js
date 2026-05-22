load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    
    // search queries can be either just a string, or a full url from home.js / genre.js
    let searchUrl = "";
    if (url.startsWith("http")) {
        searchUrl = url + "&page=" + page;
    } else {
        searchUrl = BASE_URL + "/tim-kiem-nang-cao?q=" + encodeURIComponent(url) + "&page=" + page;
    }

    let doc = fetchRetry(searchUrl);
    if (doc) {
        let items = doc.select('a[href^="/truyen-tranh/"]');
        let data = [];
        let added = {};
        
        // Loop over the items carefully
        for (let i = 0; i < items.size(); i++) {
            let a = items.get(i);
            let el = a.parent();
            let link = a.attr('href');
            
            if (!link || added[link]) continue;
            added[link] = true;
            let imgEl = a.select('img').first();
            let img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('srcset') || "";
            if (img.indexOf(" ") > 0) {
                img = img.split(" ")[0]; // handles srcset
            }
            if (img.startsWith("/")) {
                img = BASE_URL + img;
            }

            let title = a.attr('title') || a.text().trim();
            // sometimes title is inside a h3 or h2
            let hTag = a.select('h2, h3').first();
            if (hTag && hTag.text()) {
                title = hTag.text().trim();
            }

            // Fallback for title if empty
            if (!title) {
                let txts = a.select('span, div');
                for (let j = 0; j < txts.size(); j++) {
                    let txt = txts.get(j).text().trim();
                    if (txt && txt.length > 3 && !txt.toLowerCase().includes('manhua')) {
                        title = txt;
                        break;
                    }
                }
            }

            // extract chapter info
            let chap = "";
            let chapTags = el.select('span.text-xs, .absolute, .bg-red-500, .bg-blue-500');
            for (let j = 0; j < chapTags.size(); j++) {
                let t = chapTags.get(j).text().trim();
                // usually chapter is a number or contains 'Chương'
                if (/^[0-9.]+$/.test(t) || t.toLowerCase().includes('chương')) {
                    chap = t;
                    break;
                }
            }

            if (link && title && img && !img.includes('icons')) {
                data.push({
                    name: title,
                    link: link,
                    cover: img,
                    description: chap,
                    host: BASE_URL
                });
            }
        }

        // Check if there is a next page
        let next = "";
        let paginationUrls = doc.select('a[href*="page="]');
        for(let i = 0; i < paginationUrls.size(); i++) {
            let pUrl = paginationUrls.get(i).attr('href');
            let pMatch = pUrl.match(/page=(\d+)/);
            if(pMatch && parseInt(pMatch[1]) > parseInt(page)) {
                next = pMatch[1];
                break;
            }
        }

        return Response.success(data, next);
    }
    return null;
}
