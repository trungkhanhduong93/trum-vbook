load('config.js');

function execute(url, page) {
    try {
        if (!page) page = '1';
        
        let searchUrl = "";
        if (url.startsWith("http")) {
            searchUrl = url + "&page=" + page;
        } else {
            searchUrl = BASE_URL + "/tim-kiem-nang-cao?q=" + encodeURIComponent(url) + "&page=" + page;
        }

        let doc = fetchRetry(searchUrl);
        if (doc) {
            let items = doc.select('a[href*="/truyen-tranh/"]');
            let ni = items.size();
            let data = [];
            let added = {};

            for (let i = 0; i < ni; i++) {
                let a = items.get(i);
                let el = a; // Do not use a.parent() as it throws TypeError in VBook's String.select polyfill
                let link = a.attr('href');
                
                if (!link || added[link]) continue;
                added[link] = true;
                let imgEl = a.select('img').first();
                let img = "";
                if (imgEl) {
                    img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('srcset') || "";
                }
                if (img.indexOf(" ") > 0) {
                    img = img.split(" ")[0];
                }
                if (img.startsWith("/")) {
                    img = BASE_URL + img;
                }

                let title = a.attr('title') || "";
                if (!title) {
                    let imgEl2 = a.select('img').first();
                    if (imgEl2) {
                        title = imgEl2.attr('title') || imgEl2.attr('alt') || "";
                    }
                }
                if (!title) {
                    let spans = a.select('span.font-bold');
                    for (let j = 0; j < spans.size(); j++) {
                        let txt = spans.get(j).text().trim();
                        if (txt && txt.length > 3 && txt.toLowerCase().indexOf('manhua') === -1 && txt.toLowerCase().indexOf('manhwa') === -1) {
                            title = txt;
                            break;
                        }
                    }
                }
                if (!title) {
                    let txts = a.select('span, div');
                    for (let j = 0; j < txts.size(); j++) {
                        let txt = txts.get(j).text().trim();
                        if (txt && txt.length > 3 && txt.toLowerCase().indexOf('manhua') === -1) {
                            title = txt;
                            break;
                        }
                    }
                }

                let chap = "";
                let chapTags = el.select('span.text-xs, .text-txt-secondary, .absolute, .bg-red-500, .bg-blue-500');
                for (let j = 0; j < chapTags.size(); j++) {
                    let t = chapTags.get(j).text().trim();
                    if (/^[0-9.]+$/.test(t) || t.toLowerCase().indexOf('chương') !== -1) {
                        chap = t;
                        break;
                    }
                }

                if (link && title && img && img.indexOf('icons') === -1) {
                    data.push({
                        name: title,
                        link: link,
                        cover: img,
                        description: chap,
                        host: BASE_URL
                    });
                }
            }

            let next = "";
            let paginationUrls = doc.select('a[href*="page="]');
            let np = paginationUrls.size();
            for(let i = 0; i < np; i++) {
                let pUrl = paginationUrls.get(i).attr('href');
                let pMatch = pUrl.match(/page=(\d+)/);
                if(pMatch && parseInt(pMatch[1]) > parseInt(page)) {
                    next = pMatch[1];
                    break;
                }
            }

            if (data.length === 0) {
                return Response.success([{name: "Lỗi: doc.select() ra rỗng, html length: " + doc.html().length, link: "https://www.zettruyen.top", cover: "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/zettruyen/icon.png", description: "debug"}]);
            }

            return Response.success(data, next);
        }
        return Response.success([{name: "Lỗi: fetchRetry trả về doc rỗng (null)", link: "https://www.zettruyen.top", cover: "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/zettruyen/icon.png", description: "debug"}]);
    } catch (e) {
        return Response.success([{name: "Lỗi JS: " + e, link: "https://www.zettruyen.top", cover: "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/zettruyen/icon.png", description: "debug"}]);
    }
}
