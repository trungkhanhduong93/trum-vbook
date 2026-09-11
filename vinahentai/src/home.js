load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/", script: "gen.js" },
        { title: "Manhwa 18+", input: "/genres/manhwa", script: "gen.js" },
        { title: "Hentai Không Che", input: "/genres/hentai-khong-che", script: "gen.js" },
        { title: "3D Hentai", input: "/genres/3d-hentai", script: "gen.js" },
        { title: "NTR", input: "/genres/ntr", script: "gen.js" },
        { title: "Milf", input: "/genres/milf", script: "gen.js" },
        { title: "Full Color", input: "/genres/full-color", script: "gen.js" },
        { title: "Oneshot", input: "/genres/oneshot", script: "gen.js" }
    ]);
}
