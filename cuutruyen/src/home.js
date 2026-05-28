function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/newest",                          script: "gen.js" },
        { title: "Action",       input: "/search?tag_query=Action",         script: "gen.js" },
        { title: "Romance",      input: "/search?tag_query=Romance",        script: "gen.js" },
        { title: "Comedy",       input: "/search?tag_query=Comedy",         script: "gen.js" },
        { title: "Fantasy",      input: "/search?tag_query=Fantasy",        script: "gen.js" },
        { title: "Adventure",    input: "/search?tag_query=Adventure",      script: "gen.js" },
        { title: "Drama",        input: "/search?tag_query=Drama",          script: "gen.js" },
        { title: "Slice of Life",input: "/search?tag_query=Slice of Life",  script: "gen.js" },
        { title: "Supernatural", input: "/search?tag_query=Supernatural",   script: "gen.js" },
        { title: "School Life",  input: "/search?tag_query=School Life",    script: "gen.js" }
    ]);
}
