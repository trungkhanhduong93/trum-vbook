load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: BASE_URL + "/danh-sach/truyen-moi-cap-nhat", script: "gen.js" },
        { title: "Top Ngày", input: BASE_URL + "/danh-sach/top-ngay", script: "gen.js" },
        { title: "Top Tuần", input: BASE_URL + "/danh-sach/top-tuan", script: "gen.js" },
        { title: "Top Tháng", input: BASE_URL + "/danh-sach/top-thang", script: "gen.js" },
        { title: "Truyện Tranh Mới", input: BASE_URL + "/danh-sach/truyen-tranh-moi", script: "gen.js" },
        { title: "Đã Hoàn Thành", input: BASE_URL + "/danh-sach/truyen-full", script: "gen.js" },
        { title: "Manga", input: BASE_URL + "/the-loai/manga", script: "gen.js" },
        { title: "Manhwa", input: BASE_URL + "/the-loai/manhwa", script: "gen.js" },
        { title: "Manhua", input: BASE_URL + "/the-loai/manhua", script: "gen.js" }
    ]);
}
