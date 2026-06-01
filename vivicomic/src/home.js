load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/danh-sach-truyen",  script: "gen.js" },
        { title: "Bảng Xếp Hạng", input: BASE_URL + "/bang-xep-hang",     script: "gen.js" },
        { title: "Trọn Bộ",       input: BASE_URL + "/tron-bo",           script: "gen.js" }
    ]);
}
