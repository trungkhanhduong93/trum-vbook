load("config.js");

function execute() {
    resolveBaseUrl();
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/tim-truyen?status=-1&sort=0",   script: "gen.js" },
        { title: "Truyện Full",   input: BASE_URL + "/tim-truyen?status=2&sort=0",     script: "gen.js" },
        { title: "Yêu Thích",    input: BASE_URL + "/tim-truyen?status=-1&sort=20",    script: "gen.js" },
        { title: "Truyện Mới",   input: BASE_URL + "/tim-truyen?status=-1&sort=15",    script: "gen.js" },
        { title: "Theo Dõi",     input: BASE_URL + "/tim-truyen?status=-1&sort=20",    script: "gen.js" },
        { title: "Lịch Sử",     input: BASE_URL + "/lich-su",                          script: "gen.js" },
        { title: "BXH Ngày",     input: BASE_URL + "/tim-truyen?status=-1&sort=13",    script: "gen.js" },
        { title: "BXH Tuần",     input: BASE_URL + "/tim-truyen?status=-1&sort=12",    script: "gen.js" },
        { title: "BXH Tháng",    input: BASE_URL + "/tim-truyen?status=-1&sort=11",    script: "gen.js" },
        { title: "BXH Tổng",     input: BASE_URL + "/tim-truyen?status=-1&sort=10",    script: "gen.js" }
    ]);
}
