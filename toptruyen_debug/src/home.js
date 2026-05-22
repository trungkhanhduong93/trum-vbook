load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/tim-truyen",               script: "gen.js" },
        { title: "Truyện Hot",     input: BASE_URL + "/hot",                       script: "gen.js" },
        { title: "Đã Hoàn Thành", input: BASE_URL + "/tim-truyen?status=1&sort=2", script: "gen.js" },
        { title: "Yêu Thích",    input: BASE_URL + "/tim-truyen?sort=9",           script: "gen.js" },
        { title: "BXH Ngày",     input: BASE_URL + "/tim-truyen?sort=6",           script: "gen.js" },
        { title: "BXH Tuần",     input: BASE_URL + "/tim-truyen?sort=5",           script: "gen.js" },
        { title: "BXH Tháng",    input: BASE_URL + "/tim-truyen?sort=3",           script: "gen.js" },
        { title: "BXH Tổng",     input: BASE_URL + "/tim-truyen?sort=2",           script: "gen.js" },
        { title: "Con Trai",     input: BASE_URL + "/truyen-con-trai",             script: "gen.js" },
        { title: "Con Gái",      input: BASE_URL + "/truyen-con-gai",              script: "gen.js" }
    ]);
}
