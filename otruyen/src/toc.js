load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Khong tai duoc muc luc");

    var doc = res.html();
    if (!doc) return Response.error("Khong parse duoc HTML");

    var count = extractChapterCount(doc);
    var buttons = doc.select("div.cta a.btn");
    var latestHref = "";
    if (buttons.size() > 1) latestHref = buttons.get(1).attr("href") || "";
    if (!latestHref && buttons.size() > 0) latestHref = buttons.get(0).attr("href") || "";

    var latestNumber = parsePositiveInt(latestHref);
    if (latestNumber > 0 && latestNumber > count) count = latestNumber;
    if (count <= 0) return Response.error("Khong tim thay chapter");

    var storyBase = latestHref ? String(latestHref).replace(/-chap-\d+\/?$/, "") : extractStoryBase(url);
    storyBase = storyBase.replace(/\/$/, "");

    // Site hien tai dung mau URL chap lien tuc: /truyen-tranh/<slug>-chap-N
    var chapters = [];
    for (var i = 1; i <= count; i++) {
        chapters.push({
            name: "Chuong " + i,
            url: storyBase + "-chap-" + i,
            host: HOST
        });
    }

    return Response.success(chapters);
}
