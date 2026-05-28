load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",   input: API_BASE + "/danh-sach/truyen-moi",     script: "gen.js" },
        { title: "Đang Phát Hành", input: API_BASE + "/danh-sach/dang-phat-hanh", script: "gen.js" },
        { title: "Hoàn Thành",     input: API_BASE + "/danh-sach/hoan-thanh",     script: "gen.js" },
        { title: "Sắp Ra Mắt",     input: API_BASE + "/danh-sach/sap-ra-mat",     script: "gen.js" }
    ]);
}
