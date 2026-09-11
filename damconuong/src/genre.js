load("config.js");

function execute() {
    return Response.success([
        { title: "Truyện Ngắn", input: "/the-loai/truyen-ngan/", script: "gen.js" },
        { title: "Truyện Dài", input: "/the-loai/truyen-dai/", script: "gen.js" },
        { title: "Không Che", input: "/the-loai/khong-che/", script: "gen.js" },
        { title: "Truyện Màu", input: "/the-loai/truyen-mau/", script: "gen.js" },
        { title: "Truyện Ngọt", input: "/the-loai/truyen-ngot/", script: "gen.js" },
        { title: "Manhwa 18+", input: "/the-loai/manhwa/", script: "gen.js" },
        { title: "Doujinshi", input: "/the-loai/doujinshi/", script: "gen.js" },
        { title: "Loạn Luân", input: "/the-loai/loan-luan/", script: "gen.js" },
        { title: "Hấp Diêm", input: "/the-loai/ham-hiep/", script: "gen.js" },
        { title: "Ngực Lớn", input: "/the-loai/nguc-lon/", script: "gen.js" },
        { title: "Loli", input: "/the-loai/loli/", script: "gen.js" },
        { title: "Quái Vật", input: "/the-loai/quai-vat/", script: "gen.js" },
        { title: "Webtoon", input: "/the-loai/webtoon/", script: "gen.js" },
        { title: "Yuri", input: "/the-loai/yuri/", script: "gen.js" },
        { title: "NTR", input: "/the-loai/ntr/", script: "gen.js" },
        { title: "Chị Dâu", input: "/the-loai/chi-dau/", script: "gen.js" },
        { title: "Mẹ Kế", input: "/the-loai/me-ke/", script: "gen.js" },
        { title: "Hầu Gái", input: "/the-loai/hau-gai/", script: "gen.js" },
        { title: "Gái Ngoan", input: "/the-loai/gai-ngoan/", script: "gen.js" },
        { title: "Milf", input: "/the-loai/milf/", script: "gen.js" }
    ]);
}
