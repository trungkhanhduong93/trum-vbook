load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/", script: "gen.js" },
        { title: "Truyện Hot", input: BASE_URL + "/hot", script: "gen.js" },
        { title: "Truyện Mới", input: BASE_URL + "/tim-truyen?sort=15", script: "gen.js" },
        { title: "Top Ngày", input: BASE_URL + "/tim-truyen?status=-1&sort=13", script: "gen.js" },
        { title: "Top Tuần", input: BASE_URL + "/tim-truyen?status=-1&sort=12", script: "gen.js" },
        { title: "Top Tháng", input: BASE_URL + "/tim-truyen?status=-1&sort=11", script: "gen.js" },
        { title: "Top All", input: BASE_URL + "/tim-truyen?status=-1&sort=10", script: "gen.js" },
        { title: "Theo Dõi", input: BASE_URL + "/tim-truyen?status=-1&sort=20", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/tim-truyen?status=2", script: "gen.js" },
        { title: "Manhwa", input: BASE_URL + "/tim-truyen/manhwa-11400", script: "gen.js" },
        { title: "Manhua", input: BASE_URL + "/tim-truyen/manhua", script: "gen.js" },
        { title: "Manga", input: BASE_URL + "/tim-truyen/manga-112", script: "gen.js" },
        { title: "Tu Tiên", input: BASE_URL + "/tim-truyen/tu-tien", script: "gen.js" },
        { title: "Chuyển Sinh", input: BASE_URL + "/tim-truyen/chuyen-sinh-2130", script: "gen.js" },
        { title: "Xuyên Không", input: BASE_URL + "/tim-truyen/xuyen-khong-205", script: "gen.js" }
    ]);
}
