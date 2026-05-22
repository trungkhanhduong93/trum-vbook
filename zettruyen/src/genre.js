load('config.js');

function execute() {
    return Response.success([
        {title: "Action", input: "https://www.zettruyen.top/the-loai/action", script: "search.js"},
        {title: "Adventure", input: "https://www.zettruyen.top/the-loai/adventure", script: "search.js"},
        {title: "Comedy", input: "https://www.zettruyen.top/the-loai/comedy", script: "search.js"},
        {title: "Fantasy", input: "https://www.zettruyen.top/the-loai/fantasy", script: "search.js"},
        {title: "Manhua", input: "https://www.zettruyen.top/the-loai/manhua", script: "search.js"},
        {title: "Mystery", input: "https://www.zettruyen.top/the-loai/mystery", script: "search.js"},
        {title: "Truyện Màu", input: "https://www.zettruyen.top/the-loai/truyen-mau", script: "search.js"},
        {title: "Xuyên Không", input: "https://www.zettruyen.top/the-loai/xuyen-khong", script: "search.js"}
    ]);
}
