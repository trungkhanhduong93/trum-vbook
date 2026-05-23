load("config.js");

function execute() {
    return Response.success([
        { title: "Moi cap nhat", input: BASE_URL + "/", script: "gen.js" },
        { title: "Action", input: BASE_URL + "/the-loai/action", script: "gen.js" },
        { title: "Co Dai", input: BASE_URL + "/the-loai/co-dai", script: "gen.js" },
        { title: "Fantasy", input: BASE_URL + "/the-loai/fantasy", script: "gen.js" },
        { title: "Harem", input: BASE_URL + "/the-loai/harem", script: "gen.js" },
        { title: "Manhua", input: BASE_URL + "/the-loai/manhua", script: "gen.js" },
        { title: "Martial Arts", input: BASE_URL + "/the-loai/martial-arts", script: "gen.js" },
        { title: "Truyen Mau", input: BASE_URL + "/the-loai/truyen-mau", script: "gen.js" },
        { title: "Xuyen Khong", input: BASE_URL + "/the-loai/xuyen-khong", script: "gen.js" }
    ]);
}
