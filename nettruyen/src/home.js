load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/", script: "gen.js" },
        { title: "Truyện Hot", input: BASE_URL + "/hot", script: "gen.js" },
        { title: "Top Ngày", input: BASE_URL + "/tim-truyen?status=-1&sort=13", script: "gen.js" },
        { title: "Top Tuần", input: BASE_URL + "/tim-truyen?status=-1&sort=12", script: "gen.js" },
        { title: "Top Tháng", input: BASE_URL + "/tim-truyen?status=-1&sort=11", script: "gen.js" },
        { title: "Top All", input: BASE_URL + "/tim-truyen?status=-1&sort=10", script: "gen.js" },
        { title: "Theo Dõi", input: BASE_URL + "/tim-truyen?status=-1&sort=20", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/truyen-full", script: "gen.js" },
        { title: "Manhwa", input: BASE_URL + "/the-loai/manhwa-1140", script: "gen.js" },
        { title: "Manhua", input: BASE_URL + "/the-loai/manhua", script: "gen.js" },
        { title: "Manga", input: BASE_URL + "/the-loai/manga-112", script: "gen.js" }
    ]);
}
