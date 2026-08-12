load('config.js');

function execute() {
    return Response.success([
        {title: "Action", input: BASE_URL + "/the-loai/action", script: "search.js"},
        {title: "Adventure", input: BASE_URL + "/the-loai/adventure", script: "search.js"},
        {title: "Comedy", input: BASE_URL + "/the-loai/comedy", script: "search.js"},
        {title: "Fantasy", input: BASE_URL + "/the-loai/fantasy", script: "search.js"},
        {title: "Manhua", input: BASE_URL + "/the-loai/manhua", script: "search.js"},
        {title: "Mystery", input: BASE_URL + "/the-loai/mystery", script: "search.js"},
        {title: "Truyện Màu", input: BASE_URL + "/the-loai/truyen-mau", script: "search.js"},
        {title: "Xuyên Không", input: BASE_URL + "/the-loai/xuyen-khong", script: "search.js"}
    ]);
}
