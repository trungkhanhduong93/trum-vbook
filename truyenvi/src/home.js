function execute() {
    return Response.success([
        { title: "Mới Đăng",         input: "/danh-sach-truyen/moi-dang/1",          script: "gen.js" },
        { title: "Cập Nhật Mới",      input: "/danh-sach-truyen/cap-nhat-chuong-moi/1", script: "gen.js" },
        { title: "Xem Nhiều",         input: "/danh-sach-truyen/xem-nhieu/1",         script: "gen.js" },
        { title: "Danh Sách A-Z",     input: "/danh-sach-truyen/a-z/1",               script: "gen.js" }
    ]);
}
