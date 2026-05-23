load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",   input: BASE_URL + "/",                                        script: "gen.js" },
        { title: "Manga",          input: BASE_URL + "/the-loai-noi-bat/manga/",                 script: "gen.js" },
        { title: "Manhua",         input: BASE_URL + "/the-loai-noi-bat/manhua/",                script: "gen.js" },
        { title: "Manhwa",         input: BASE_URL + "/the-loai-noi-bat/manhwa/",                script: "gen.js" },
        { title: "Webtoon",        input: BASE_URL + "/the-loai-noi-bat/webtoon/",               script: "gen.js" },
        { title: "Comic",          input: BASE_URL + "/the-loai-noi-bat/comic/",                 script: "gen.js" },
        { title: "Anime",          input: BASE_URL + "/the-loai-noi-bat/anime/",                 script: "gen.js" },
        { title: "Truyện Màu",     input: BASE_URL + "/the-loai-noi-bat/truyen-mau/",            script: "gen.js" },
        { title: "Truyện Scan",    input: BASE_URL + "/the-loai-noi-bat/truyen-scan/",           script: "gen.js" },
        { title: "Dưới 100 chap",  input: BASE_URL + "/tap-chi-truyen-tranh/duoi-100-chuong/",   script: "gen.js" },
        { title: "Dưới 1000 chap", input: BASE_URL + "/tap-chi-truyen-tranh/duoi-1000-chuong/",  script: "gen.js" },
        { title: "Trên 1000 chap", input: BASE_URL + "/tap-chi-truyen-tranh/tren-1000-chuong/",  script: "gen.js" }
    ]);
}
