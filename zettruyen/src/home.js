load('config.js');

function execute() {
    return Response.success([
        {title: "Mới cập nhật", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=updated_at", script: "search.js"},
        {title: "Lượt xem cao", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=views", script: "search.js"},
        {title: "Theo dõi nhiều", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=followers", script: "search.js"},
        {title: "Mới nhất", input: "https://www.zettruyen.top/tim-kiem-nang-cao?sort=created_at", script: "search.js"}
    ]);
}
