load('config.js');

// home.js: Trang chủ
// "Trang chủ" dùng HTML /truyen-cap-nhat (parseHtmlCards).
// "Truyện Mới" và "Đang Hot" dùng API /api/v2/search (trả JSON).
// KHÔNG dùng /danh-sach vì trang đó render bằng JS → HTML rỗng.
function execute() {
    return Response.success([
        { title: 'Trang chủ (Mới cập nhật)', input: '/truyen-cap-nhat?p=1', script: 'gen.js' },
        { title: 'Truyện Mới', input: '/api/v2/search?p=0&orders=createdAt', script: 'gen.js' },
        { title: 'Đang Hot', input: '/api/v2/search?p=0&orders=viewCount', script: 'gen.js' }
    ]);
}
