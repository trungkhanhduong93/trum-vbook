load('config.js');

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/truyen-moi",  script: "search.js" },
        { title: "Hoàn Thành",   input: BASE_URL + "/hoan-thanh",  script: "search.js" }
    ]);
}
