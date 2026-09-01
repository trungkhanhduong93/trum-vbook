load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/tim-truyen?sort=new", script: "gen.js" },
        { title: "Top Ngày", input: BASE_URL + "/tim-truyen?sort=top_day", script: "gen.js" },
        { title: "Top Tuần", input: BASE_URL + "/tim-truyen?sort=top_week", script: "gen.js" },
        { title: "Top Tháng", input: BASE_URL + "/tim-truyen?sort=top_month", script: "gen.js" },
        { title: "Top All", input: BASE_URL + "/tim-truyen?sort=top_all", script: "gen.js" },
        { title: "Theo Dõi", input: BASE_URL + "/tim-truyen?sort=follow", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/tim-truyen?status=2", script: "gen.js" },
        { title: "Manhua", input: BASE_URL + "/the-loai/manhua", script: "gen.js" },
        { title: "Manhwa", input: BASE_URL + "/the-loai/manhwa", script: "gen.js" },
        { title: "Manga", input: BASE_URL + "/the-loai/manga", script: "gen.js" }
    ]);
}
