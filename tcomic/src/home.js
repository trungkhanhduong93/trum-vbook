function execute() {
    return Response.success([
        {title: "Mới Cập Nhật", input: "/api/web/comic/recent-update-comics", script: "gen.js"},
        {title: "Truyện Mới", input: "/api/web/comic/new-comics", script: "gen.js"},
        {title: "Đang Hot", input: "/api/web/comic/trending-comics", script: "gen.js"},
        {title: "Đề Xuất", input: "/api/web/comic/recommend-comics", script: "gen.js"},
        {title: "Đã Hoàn Thành", input: "/api/web/comic/completed-comics", script: "gen.js"},
        {title: "Truyện Cho Nam", input: "/api/web/comic/boy-comics", script: "gen.js"},
        {title: "Truyện Cho Nữ", input: "/api/web/comic/girl-comics", script: "gen.js"},
        {title: "Top Ngày", input: "/api/web/comic/top/daily", script: "gen.js"},
        {title: "Top Tuần", input: "/api/web/comic/top/weekly", script: "gen.js"},
        {title: "Top Tháng", input: "/api/web/comic/top/monthly", script: "gen.js"},
        {title: "Top Theo Dõi", input: "/api/web/comic/top/follow", script: "gen.js"}
    ]);
}
