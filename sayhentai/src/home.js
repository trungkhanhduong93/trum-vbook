load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/", script: "gen.js" },
        { title: "Manhwa 18+", input: "/genre/manhwa", script: "gen.js" },
        { title: "Manga 18+", input: "/genre/manga", script: "gen.js" },
        { title: "Không Che", input: "/genre/khong-che", script: "gen.js" },
        { title: "Đang Hot", input: "/genre?sort=most", script: "gen.js" },
        { title: "Truyện Mới", input: "/genre?sort=newest", script: "gen.js" },
        { title: "Hoàn Thành", input: "/completed", script: "gen.js" }
    ]);
}
