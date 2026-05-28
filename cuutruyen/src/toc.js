load('config.js');

function execute(url) {
    var html = httpGet(String(url));
    if (!html) return null;

    // Cắt vùng chứa danh sách chapter
    var startIdx = html.indexOf('id="chapters-list-container"');
    if (startIdx < 0) return null;
    var section = html.substring(startIdx);

    var list = [];
    var seen = {};

    // Mỗi chapter là 1 <div class="chapter-item" ...> ... <a href=".../chapters/{id}"> ... <span>{N}</span> ... <span class="text-gray-800">{name}</span>? ...
    var parts = section.split('class="chapter-item"');
    for (var i = 1; i < parts.length; i++) {
        var block = parts[i];
        var linkM = block.match(/href="(https?:\/\/[^"]*cuutruyen\.cc\/chapters\/[a-z0-9-]+)"/);
        if (!linkM) {
            var linkM2 = block.match(/href="(\/chapters\/[a-z0-9-]+)"/);
            if (linkM2) linkM = [linkM2[0], toAbs(linkM2[1])];
        }
        if (!linkM) continue;
        var link = linkM[1];
        if (seen[link]) continue;
        seen[link] = true;

        // Số chương: <span>139</span> (sau "C." / "Chương")
        var numM = block.match(/<span>([\s\S]{1,30}?)<\/span>/);
        var chapNum = numM ? strip(numM[1]) : "";

        // Tiêu đề phụ (optional): <span class="text-gray-800">Bí mật...</span>
        var subM = block.match(/<span class="text-gray-800">([\s\S]{1,200}?)<\/span>/);
        var sub = subM ? strip(subM[1]) : "";

        var name = "Chương " + chapNum;
        if (sub) name += ": " + sub;

        list.push({
            name: name,
            url: link,
            host: SITE_URL
        });
    }

    if (list.length === 0) return null;

    // Trang detail trả về mới → cũ, đảo lại để đọc từ chương đầu
    list.reverse();
    return Response.success(list);
}
