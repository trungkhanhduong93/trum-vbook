function execute() {
    return Response.success([
        {title: "Mới Cập Nhật", input: "/the-loai/all?sort=updated_desc", script: "gen.js"},
        {title: "Lượt Xem", input: "/the-loai/all?sort=views_desc", script: "gen.js"},
        {title: "Yêu Thích", input: "/the-loai/all?sort=likes_desc", script: "gen.js"},
        {title: "Số Chương", input: "/the-loai/all?sort=total_chapters_desc", script: "gen.js"},
        {title: "Đã Hoàn Thành", input: "/the-loai/all?status=completed", script: "gen.js"}
    ]);
}
