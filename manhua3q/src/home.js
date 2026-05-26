load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/",  script: "search.js" },
        { title: "Truyện Con Gái",  input: BASE_URL + "/danh-sach/truyen-con-gai",  script: "search.js" },
        { title: "Truyện Con Trai",  input: BASE_URL + "/danh-sach/truyen-con-trai",  script: "search.js" },
        { title: "Top Tuần",  input: BASE_URL + "/danh-sach/top-tuan",  script: "search.js" },
        { title: "Top Tháng",  input: BASE_URL + "/danh-sach/top-thang",  script: "search.js" },
        { title: "Truyện Full",  input: BASE_URL + "/danh-sach/truyen-hoan-thanh",  script: "search.js" }
    ]);
}
