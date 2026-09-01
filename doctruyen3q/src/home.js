load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/tim-truyen?sort=1", script: "gen.js" },
        { title: "Top All", input: BASE_URL + "/tim-truyen?sort=2", script: "gen.js" },
        { title: "Top Tháng", input: BASE_URL + "/tim-truyen?sort=3", script: "gen.js" },
        { title: "Top Tuần", input: BASE_URL + "/tim-truyen?sort=5", script: "gen.js" },
        { title: "Top Ngày", input: BASE_URL + "/tim-truyen?sort=6", script: "gen.js" },
        { title: "Theo Dõi", input: BASE_URL + "/tim-truyen?sort=9", script: "gen.js" },
        { title: "Bình Luận", input: BASE_URL + "/tim-truyen?sort=10", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/tim-truyen?status=2", script: "gen.js" },
        { title: "Manhua", input: BASE_URL + "/tim-truyen/manhua", script: "gen.js" },
        { title: "Manhwa", input: BASE_URL + "/tim-truyen/manhwa", script: "gen.js" },
        { title: "Manga", input: BASE_URL + "/tim-truyen/manga", script: "gen.js" },
        { title: "Chuyển Sinh", input: BASE_URL + "/tim-truyen/chuyen-sinh", script: "gen.js" },
        { title: "Xuyên Không", input: BASE_URL + "/tim-truyen/xuyen-khong", script: "gen.js" }
    ]);
}
