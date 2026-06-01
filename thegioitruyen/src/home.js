load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/truyen/",                 script: "gen.js" },
        { title: "Action",       input: BASE_URL + "/the-loai/action/",        script: "gen.js" },
        { title: "Chuyển Sinh",  input: BASE_URL + "/the-loai/chuyen-sinh/",   script: "gen.js" },
        { title: "Ngôn Tình",    input: BASE_URL + "/the-loai/ngon-tinh/",     script: "gen.js" },
        { title: "Tu Tiên",      input: BASE_URL + "/the-loai/tu-tien/",       script: "gen.js" },
        { title: "Manhua",       input: BASE_URL + "/the-loai/manhua/",        script: "gen.js" },
        { title: "Manhwa",       input: BASE_URL + "/the-loai/manhwa/",        script: "gen.js" },
        { title: "Manga",        input: BASE_URL + "/the-loai/manga/",         script: "gen.js" },
        { title: "Comedy",       input: BASE_URL + "/the-loai/comedy/",        script: "gen.js" },
        { title: "Fantasy",      input: BASE_URL + "/the-loai/fantasy/",       script: "gen.js" }
    ]);
}
