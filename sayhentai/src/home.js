load("config.js");

function execute() {
    return Response.success([
        { title: "Manhwa 18+", input: "/genre/manhwa", script: "gen.js" },
        { title: "Mới Cập Nhật", input: "/", script: "gen.js" },
        { title: "Manga 18+", input: "/genre/manga", script: "gen.js" },
        { title: "Không Che", input: "/genre/khong-che", script: "gen.js" },
        { title: "Hoàn Thành", input: "/completed", script: "gen.js" },
        { title: "Dâm Đãng", input: "/genre/dam-dang", script: "gen.js" },
        { title: "Harem", input: "/genre/harem", script: "gen.js" }
    ]);
}
