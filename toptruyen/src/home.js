load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",   input: BASE_URL + "/tim-truyen",                              script: "gen.js" },
        { title: "Hot Nhất",       input: BASE_URL + "/tim-truyen?sort=2",                       script: "gen.js" },
        { title: "Top Tháng",      input: BASE_URL + "/tim-truyen?sort=3",                       script: "gen.js" },
        { title: "Top Tuần",       input: BASE_URL + "/tim-truyen?sort=5",                       script: "gen.js" },
        { title: "Top Ngày",       input: BASE_URL + "/tim-truyen?sort=6",                       script: "gen.js" },
        { title: "Đã Hoàn Thành",  input: BASE_URL + "/tim-truyen?status=1&sort=2",              script: "gen.js" },
        { title: "Yêu Thích",      input: BASE_URL + "/tim-truyen?sort=9",                       script: "gen.js" },
        { title: "Manga",          input: BASE_URL + "/tim-truyen/manga",                        script: "gen.js" },
        { title: "Manhua",         input: BASE_URL + "/tim-truyen/manhua",                       script: "gen.js" },
        { title: "Manhwa",         input: BASE_URL + "/tim-truyen/manhwa",                       script: "gen.js" },
        { title: "Ngôn Tình",      input: BASE_URL + "/tim-truyen/ngon-tinh",                    script: "gen.js" }
    ]);
}
