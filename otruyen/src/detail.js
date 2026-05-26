load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Khong tai duoc trang truyen");

    var doc = res.html();
    if (!doc) return Response.error("Khong parse duoc HTML");

    var titleEl = selFirst(doc, "h1");
    var coverEl = selFirst(doc, "div.cover img");
    var name = titleEl ? trimText(titleEl.text()) : "";
    var cover = coverEl ? (coverEl.attr("src") || "") : "";

    var genres = [];
    var seenGenres = {};
    var genreLinks = doc.select("a.tag");
    var ng = genreLinks.size();
    for (var i = 0; i < ng; i++) {
        var a = genreLinks.get(i);
        var gName = trimText(a.text());
        var gHref = a.attr("href") || "";
        if (!gName || !gHref || seenGenres[gHref]) continue;
        seenGenres[gHref] = true;
        genres.push({
            title: gName,
            input: resolveUrl(gHref),
            script: "gen.js"
        });
    }

    var chapterCount = extractChapterCount(doc);
    var chapterText = chapterCount > 0 ? (chapterCount + " chuong") : "";

    var description = "";
    var summaryBox = selFirst(doc, "div.grid2 div.box");
    if (summaryBox) {
        var summaryParas = summaryBox.select("p");
        for (var j = 0; j < summaryParas.size(); j++) {
            var text = trimText(summaryParas.get(j).text());
            if (!text) continue;
            if (description) description += "\n\n";
            description += text;
            if (j >= 1) break;
        }
        if (!description) description = trimText(summaryBox.text());
    }

    var detailParts = [];
    if (chapterText) detailParts.push(chapterText);

    var suggests = [];
    var seenSuggests = {};
    var relCards = doc.select("div.rel-cards a.rel-card");
    var nr = relCards.size();
    for (var k = 0; k < nr; k++) {
        var card = relCards.get(k);
        var sTitleEl = selFirst(card, "span.rel-title");
        var sImgEl = selFirst(card, "img");
        var sName = sTitleEl ? trimText(sTitleEl.text()) : "";
        var sHref = card.attr("href") || "";
        if (!sName || !sHref || seenSuggests[sHref]) continue;
        seenSuggests[sHref] = true;
        suggests.push({
            title: sName,
            input: resolveUrl(sHref),
            script: "detail.js"
        });
    }

    return Response.success({
        name: name,
        cover: resolveUrl(cover),
        host: HOST,
        author: "",
        description: description,
        detail: detailParts.join("<br>"),
        ongoing: true,
        genres: genres,
        suggests: suggests
    });
}
