load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: "/manga?sort=latest",       script: "gen.js" },
        { title: "Top Tuần",      input: "/manga/top",                script: "gen.js" },
        { title: "Top Mọi Thời",  input: "/manga/top/all-time",       script: "gen.js" },
        { title: "Staff Picks",   input: "/manga/staff-picks",        script: "gen.js" },
        { title: "Ngẫu Nhiên",    input: "/manga/random",             script: "gen.js" },
        { title: "Lượt Xem",      input: "/manga?sort=view",          script: "gen.js" },
        { title: "Theo Dõi",      input: "/manga?sort=follows",       script: "gen.js" }
    ]);
}
