load('config.js');

// Tab Mới Cập Nhật dùng endpoint /api/v2/home/filter?p=0&value=all (đúng theo trang chủ web).
// /api/v2/search nhận orders=createdAt (truyện mới tạo) và orders=viewCount (đang hot).
function execute() {
    return Response.success([
        { title: 'Mới Cập Nhật', input: '/api/v2/home/filter?p=0&value=all', script: 'gen.js' },
        { title: 'Truyện Mới',   input: '/api/v2/search?p=0&orders=createdAt', script: 'gen.js' },
        { title: 'Đang Hot',     input: '/api/v2/search?p=0&orders=viewCount', script: 'gen.js' }
    ]);
}
