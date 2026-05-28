function execute() {
    return Response.success([
        {title: "Mới Cập Nhật",   input: "/danh-sach?sort=-updated_at",   script: "gen.js"},
        {title: "Truyện Mới",      input: "/danh-sach?sort=-created_at",   script: "gen.js"},
        {title: "Xem Nhiều",       input: "/danh-sach?sort=-views",        script: "gen.js"},
        {title: "Hot Tuần",        input: "/danh-sach?sort=-views_week",   script: "gen.js"},
        {title: "Hot Hôm Nay",     input: "/danh-sach?sort=-views_day",    script: "gen.js"},
        {title: "Đã Hoàn Thành",   input: "/danh-sach?sort=-updated_at&filter[status]=2", script: "gen.js"},
        {title: "Đang Tiến Hành",  input: "/danh-sach?sort=-updated_at&filter[status]=1", script: "gen.js"}
    ]);
}
