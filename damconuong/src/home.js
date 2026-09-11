load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/", script: "gen.js" },
        { title: "Xem Nhiều", input: "/truyen-hentai/?m_orderby=views", script: "gen.js" },
        { title: "Xếp Hạng", input: "/truyen-hentai/?m_orderby=rating", script: "gen.js" },
        { title: "Trending", input: "/truyen-hentai/?m_orderby=trending", script: "gen.js" },
        { title: "Truyện Mới", input: "/truyen-hentai/?m_orderby=new-manga", script: "gen.js" },
        { title: "Manhwa 18+", input: "/the-loai/manhwa/", script: "gen.js" },
        { title: "Không Che", input: "/the-loai/khong-che/", script: "gen.js" },
        { title: "Truyện Màu", input: "/the-loai/truyen-mau/", script: "gen.js" }
    ]);
}
