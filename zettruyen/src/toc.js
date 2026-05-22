load('config.js');

function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    let doc = fetchRetry(url);
    if (!doc) return null;

    let html = doc.html();
    let comicDataMatch = html.match(/window\.comicData\s*=\s*(\{.*?\});/s);
    if (comicDataMatch) {
        try {
            // Need to parse JS object, not strict JSON. It has bare keys like `slug: '...'`
            let rawData = comicDataMatch[1];
            let slugMatch = rawData.match(/slug:\s*['"]([^'"]+)['"]/);
            let apiMatch = rawData.match(/apiUrl:\s*['"]([^'"]+)['"]/);
            let routeMatch = rawData.match(/chapterRouteTemplate:\s*['"]([^'"]+)['"]/);

            if (apiMatch && routeMatch) {
                let apiUrl = apiMatch[1];
                let routeTemplate = routeMatch[1];
                let chaptersData = [];

                // Fetch all pages
                let page = 1;
                let lastPage = 1;
                
                do {
                    let pageUrl = apiUrl + '?page=' + page;
                    let jsonString = fetchJson(pageUrl);
                    if (!jsonString) break;
                    
                    let json = JSON.parse(jsonString);
                    if (json && json.success && json.data && json.data.chapters) {
                        lastPage = json.data.last_page || 1;
                        let chaps = json.data.chapters;
                        for(let i = 0; i < chaps.length; i++) {
                            let c = chaps[i];
                            chaptersData.push({
                                name: c.chapter_name || 'Chapter ' + c.chapter_num,
                                url: routeTemplate.replace('CHAPTER_NUM', c.chapter_num).replace('CHAPTER_SLUG', c.chapter_slug || c.chapter_num),
                                host: BASE_URL
                            });
                        }
                    } else {
                        break;
                    }
                    page++;
                } while (page <= lastPage);

                // Usually APIs return descending order. We should reverse if needed so chapter 1 is first.
                // Or let VBook handle it. VBook usually expects ascending order for comic chapters if possible.
                // Let's reverse to make chapter 1 at the top.
                if (chaptersData.length > 1) {
                    let first = chaptersData[0].name.toLowerCase();
                    let last = chaptersData[chaptersData.length-1].name.toLowerCase();
                    // if first is larger than last (e.g. Chapter 403 vs Chapter 1)
                    if(first.indexOf('403') !== -1 || last.indexOf('đầu') !== -1 || last.indexOf('1') !== -1) {
                        chaptersData.reverse();
                    }
                }

                return Response.success(chaptersData.reverse()); // Zettruyen returns DESC, so we reverse it to ASC
            }
        } catch(e) {
            // fallback
        }
    }

    // Fallback if no API is found
    let chapters = [];
    var els = doc.select("a").filter(function(e) {
        return e.attr('href') && e.attr('href').indexOf('/chuong-') !== -1;
    });

    if (els.size() === 0) {
        els = doc.select(".list-chapter a").filter(function(e) {
            return e.attr('href') && e.attr('href').indexOf('/chuong-') !== -1;
        });
    }

    for (let i = 0; i < els.size(); i++) {
        let e = els.get(i);
        let link = e.attr("href");
        if (link.startsWith("/")) link = BASE_URL + link;
        chapters.push({
            name: e.text().trim(),
            url: link,
            host: BASE_URL
        });
    }

    return Response.success(chapters);
}
