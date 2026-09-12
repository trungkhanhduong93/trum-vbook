load("config.js");

// input là ĐƯỜNG DẪN API, gen.js tự nối page & per_page.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/mangas/recently_updated", script: "gen.js" },
        { title: "Top ngày", input: "/mangas/top?duration=day", script: "gen.js" },
        { title: "Top tuần", input: "/mangas/top?duration=week", script: "gen.js" },
        { title: "Top tháng", input: "/mangas/top?duration=month", script: "gen.js" },
        { title: "Top mọi thời đại", input: "/mangas/top?duration=all", script: "gen.js" },
        { title: "Action", input: tagPath("action"), script: "gen.js" },
        { title: "Romance", input: tagPath("romance"), script: "gen.js" },
        { title: "Comedy", input: tagPath("comedy"), script: "gen.js" },
        { title: "Fantasy", input: tagPath("fantasy"), script: "gen.js" },
        { title: "Isekai", input: tagPath("isekai"), script: "gen.js" }
    ]);
}
