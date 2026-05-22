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

                let browser = Engine.newBrowser();
                browser.launch(apiUrl + "?page=1", 15000); // Wait for Cloudflare to clear
                
                var fetchScript = "" +
                "(async function() {\n" +
                "    try {\n" +
                "        let res = await fetch('" + apiUrl + "?page=1');\n" +
                "        let json = await res.json();\n" +
                "        let lastPage = json.data.last_page || 1;\n" +
                "        let chaps = json.data.chapters;\n" +
                "        for (let i = 2; i <= lastPage; i++) {\n" +
                "            let r = await fetch('" + apiUrl + "?page=' + i);\n" +
                "            let j = await r.json();\n" +
                "            chaps = chaps.concat(j.data.chapters);\n" +
                "        }\n" +
                "        document.body.innerHTML = 'VBOOK_CHAPS_START' + JSON.stringify(chaps) + 'VBOOK_CHAPS_END';\n" +
                "    } catch(e) {\n" +
                "        document.body.innerHTML = 'VBOOK_CHAPS_ERROR' + e;\n" +
                "    }\n" +
                "})();";
                
                browser.callJs(fetchScript, 3000);
                let browserDoc = browser.html();
                browser.close();
                
                if (browserDoc) {
                    let htmlContent = browserDoc.select("body").text();
                    let match = htmlContent.match(/VBOOK_CHAPS_START(.*?)VBOOK_CHAPS_END/);
                    if (match) {
                        let chaps = JSON.parse(match[1]);
                        for(let i = 0; i < chaps.length; i++) {
                            let c = chaps[i];
                            chaptersData.push({
                                name: c.chapter_name || 'Chapter ' + c.chapter_num,
                                url: routeTemplate.replace('CHAPTER_NUM', c.chapter_num).replace('CHAPTER_SLUG', c.chapter_slug || c.chapter_num),
                                host: BASE_URL
                            });
                        }
                    }
                }

                if (chaptersData.length > 1) {
                    let first = chaptersData[0].name.toLowerCase();
                    let last = chaptersData[chaptersData.length-1].name.toLowerCase();
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
