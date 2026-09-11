load("config.js");

function execute() {
    return Response.success([
        { title: "Manhwa", input: "/genre/manhwa", script: "gen.js" },
        { title: "Manga", input: "/genre/manga", script: "gen.js" },
        { title: "Không Che", input: "/genre/khong-che", script: "gen.js" },
        { title: "18+", input: "/genre/18", script: "gen.js" },
        { title: "One shot", input: "/genre/one-shot", script: "gen.js" },
        { title: "Doujinshi", input: "/genre/doujinshi", script: "gen.js" },
        { title: "NTR", input: "/genre/ntr", script: "gen.js" },
        { title: "Ngực Lớn", input: "/genre/nguc-lon", script: "gen.js" },
        { title: "Nữ Sinh", input: "/genre/nu-sinh", script: "gen.js" },
        { title: "Adult", input: "/genre/adult", script: "gen.js" },
        { title: "Group", input: "/genre/group", script: "gen.js" },
        { title: "Hậu Môn", input: "/genre/hau-mon", script: "gen.js" },
        { title: "Series", input: "/genre/series", script: "gen.js" },
        { title: "Hãm Hiếp", input: "/genre/ham-hiep", script: "gen.js" },
        { title: "Housewife", input: "/genre/housewife", script: "gen.js" },
        { title: "Bạo Dâm", input: "/genre/bao-dam", script: "gen.js" },
        { title: "Harem", input: "/genre/harem", script: "gen.js" },
        { title: "Milf", input: "/genre/milf", script: "gen.js" },
        { title: "Ngực Nhỏ", input: "/genre/nguc-nho", script: "gen.js" },
        { title: "Drama", input: "/genre/drama", script: "gen.js" },
        { title: "Romance", input: "/genre/romance", script: "gen.js" },
        { title: "Full Màu", input: "/genre/full-mau", script: "gen.js" },
        { title: "Gạ Chịch", input: "/genre/ga-chich", script: "gen.js" },
        { title: "Chị Dâu", input: "/genre/chi-dau", script: "gen.js" },
        { title: "Mẹ Kế", input: "/genre/me-ke", script: "gen.js" },
        { title: "Loạn Luân", input: "/genre/loan-luan", script: "gen.js" },
        { title: "Ngoại Tình", input: "/genre/ngoai-tinh", script: "gen.js" },
        { title: "Comedy", input: "/genre/comedy", script: "gen.js" }
    ]);
}
