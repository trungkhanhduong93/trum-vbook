load('config.js');

// Đã đo 13/08/2026: /api/v2/search chỉ nhận orders=viewCount và orders=createdAt.
// updateTime / UPDATE_TIME / followCount / chapterLatestTime đều trả
// {"status":false,"messages":["lỗi không xác định được."]}.
// Không truyền orders = danh sách mặc định (mới cập nhật).
function execute() {
    return Response.success([
        { title: 'Mới Cập Nhật', input: '/api/v2/search?p=0', script: 'gen.js' },
        { title: 'Truyện Mới',   input: '/api/v2/search?p=0&orders=createdAt', script: 'gen.js' },
        { title: 'Đang Hot',     input: '/api/v2/search?p=0&orders=viewCount', script: 'gen.js' }
    ]);
}
