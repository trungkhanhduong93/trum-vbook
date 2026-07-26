load('config.js')
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "sortBy=NEW_CHAPTER_AT", script: "gen.js" },
        { title: "Truyện Mới",   input: "sortBy=CREATED_AT",     script: "gen.js" },
        { title: "Nổi Bật",      input: "isFeatured=true",       script: "gen.js" }
    ]);
}
