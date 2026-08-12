load('config.js');

function execute() {
    return Response.success([
        {title: "Mới cập nhật", input: BASE_URL + "/tim-kiem-nang-cao?sort=latest", script: "search.js"},
        {title: "Đánh giá cao", input: BASE_URL + "/tim-kiem-nang-cao?sort=rating", script: "search.js"},
        {title: "Theo dõi nhiều", input: BASE_URL + "/tim-kiem-nang-cao?sort=bookmark", script: "search.js"}
    ]);
}
