load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/", script: "search.js" },
        { title: "Truyện Hot", input: BASE_URL + "/truyen-hot/", script: "search.js" }
    ]);
}
