load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: API_BASE + "/danh-sach/truyen-moi",  script: "search.js" },
        { title: "Hoàn Thành",   input: API_BASE + "/danh-sach/hoan-thanh",  script: "search.js" }
    ]);
}
