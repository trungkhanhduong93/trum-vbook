load('config.js');

function execute() {
    return Response.success([
        {title: "Mới cập nhật", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=latest", script: "search.js"},
        {title: "Đánh giá cao", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=rating", script: "search.js"},
        {title: "Theo dõi nhiều", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=bookmark", script: "search.js"}
    ]);
}
