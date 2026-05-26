load('config.js');

function execute() {
    return Response.success([
        { title: "Action",       input: BASE_URL + "/the-loai/action",       script: "search.js" },
        { title: "Adventure",    input: BASE_URL + "/the-loai/adventure",    script: "search.js" },
        { title: "Comedy",       input: BASE_URL + "/the-loai/comedy",       script: "search.js" },
        { title: "Drama",        input: BASE_URL + "/the-loai/drama",        script: "search.js" },
        { title: "Fantasy",      input: BASE_URL + "/the-loai/fantasy",      script: "search.js" },
        { title: "Harem",        input: BASE_URL + "/the-loai/harem",        script: "search.js" },
        { title: "Historical",   input: BASE_URL + "/the-loai/historical",   script: "search.js" },
        { title: "Horror",       input: BASE_URL + "/the-loai/horror",       script: "search.js" },
        { title: "Manhua",       input: BASE_URL + "/the-loai/manhua",       script: "search.js" },
        { title: "Manhwa",       input: BASE_URL + "/the-loai/manhwa",       script: "search.js" },
        { title: "Martial Arts", input: BASE_URL + "/the-loai/martial-arts", script: "search.js" },
        { title: "Mystery",      input: BASE_URL + "/the-loai/mystery",      script: "search.js" },
        { title: "Ngôn Tình",    input: BASE_URL + "/the-loai/ngon-tinh",    script: "search.js" },
        { title: "Psychological",input: BASE_URL + "/the-loai/psychological",script: "search.js" },
        { title: "Romance",      input: BASE_URL + "/the-loai/romance",      script: "search.js" },
        { title: "School Life",  input: BASE_URL + "/the-loai/school-life",  script: "search.js" },
        { title: "Sci-fi",       input: BASE_URL + "/the-loai/sci-fi",       script: "search.js" },
        { title: "Seinen",       input: BASE_URL + "/the-loai/seinen",       script: "search.js" },
        { title: "Shounen",      input: BASE_URL + "/the-loai/shounen",      script: "search.js" },
        { title: "Slice of Life",input: BASE_URL + "/the-loai/slice-of-life",script: "search.js" },
        { title: "Supernatural", input: BASE_URL + "/the-loai/supernatural", script: "search.js" },
        { title: "Tragedy",      input: BASE_URL + "/the-loai/tragedy",      script: "search.js" },
        { title: "Truyện Màu",   input: BASE_URL + "/the-loai/truyen-mau",   script: "search.js" },
        { title: "Webtoon",      input: BASE_URL + "/the-loai/webtoon",      script: "search.js" },
        { title: "Xuyên Không",  input: BASE_URL + "/the-loai/xuyen-khong",  script: "search.js" },
        { title: "Việt Nam",     input: BASE_URL + "/the-loai/viet-nam",     script: "search.js" }
    ]);
}
