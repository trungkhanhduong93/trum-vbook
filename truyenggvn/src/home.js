load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/truyen-moi-cap-nhat.html",  script: "search.js" },
        { title: "Truyện Hot",    input: BASE_URL + "/top-ngay.html",              script: "search.js" },
        { title: "Top Tháng",     input: BASE_URL + "/danh-sach/top-thang",        script: "search.js" }
    ]);
}
