load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/truyen-moi-cap-nhat",                script: "gen.js" },
        { title: "Truyện Hot",    input: BASE_URL + "/truyen-yeu-thich",                   script: "gen.js" },
        { title: "Top Tháng",     input: BASE_URL + "/top-thang",                          script: "gen.js" },
        { title: "Top Tuần",      input: BASE_URL + "/top-tuan",                           script: "gen.js" },
        { title: "Top Ngày",      input: BASE_URL + "/top-ngay",                           script: "gen.js" },
        { title: "Truyện Full",   input: BASE_URL + "/truyen-da-hoan-thanh",               script: "gen.js" },
        { title: "Truyện Mới",    input: BASE_URL + "/truyen-moi",                         script: "gen.js" },
        { title: "Truyện Màu",    input: BASE_URL + "/the-loai/truyen-mau-92",             script: "gen.js" },
        { title: "Manga",         input: BASE_URL + "/the-loai/manga-469",                 script: "gen.js" },
        { title: "Manhua",        input: BASE_URL + "/the-loai/manhua-35",                 script: "gen.js" },
        { title: "Manhwa",        input: BASE_URL + "/the-loai/manhwa-49",                 script: "gen.js" }
    ]);
}
