load("config.js");

// Site không có endpoint liệt kê thẻ (/tags trả 404). Danh sách dưới đây lấy từ
// trường tags của chính API chi tiết truyện, đã thử từng thẻ và đều ra kết quả.
function execute() {
    var tags = [
        ["Action", "action"], ["Adventure", "adventure"], ["Comedy", "comedy"],
        ["Drama", "drama"], ["Fantasy", "fantasy"], ["Romance", "romance"],
        ["Slice of Life", "slice of life"], ["Isekai", "isekai"],
        ["School Life", "school life"], ["Supernatural", "supernatural"],
        ["Sci-Fi", "sci-fi"], ["Mystery", "mystery"], ["Horror", "horror"],
        ["Psychological", "psychological"], ["Sports", "sports"],
        ["Historical", "historical"], ["Crime", "crime"], ["Animals", "animals"]
    ];
    var out = [];
    for (var i = 0; i < tags.length; i++) {
        out.push({ title: tags[i][0], input: tagPath(tags[i][1]), script: "gen.js" });
    }
    return Response.success(out);
}
