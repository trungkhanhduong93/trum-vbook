load("config.js");

// Site chỉ có đúng một trang danh sách thật (/newest); phần còn lại đi qua
// bộ lọc thẻ. Các thẻ dưới đây đã kiểm: mỗi thẻ trả về đủ truyện và có phân trang.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: SITE_URL + "/newest", script: "gen.js" },
        { title: "Manhwa", input: tagUrl("Manhwa"), script: "gen.js" },
        { title: "Manhua", input: tagUrl("Manhua"), script: "gen.js" },
        { title: "Truyện màu", input: tagUrl("Truyện Màu"), script: "gen.js" },
        { title: "Action", input: tagUrl("Action"), script: "gen.js" },
        { title: "Romance", input: tagUrl("Romance"), script: "gen.js" },
        { title: "Comedy", input: tagUrl("Comedy"), script: "gen.js" },
        { title: "Fantasy", input: tagUrl("Fantasy"), script: "gen.js" },
        { title: "Isekai", input: tagUrl("Isekai"), script: "gen.js" },
        { title: "Chuyển sinh", input: tagUrl("Chuyển Sinh"), script: "gen.js" },
        { title: "Ngôn tình", input: tagUrl("Ngôn Tình"), script: "gen.js" },
        { title: "Oneshot", input: tagUrl("Oneshot"), script: "gen.js" }
    ]);
}
