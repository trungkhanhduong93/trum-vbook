load('config.js');

// home.js: Trả danh sách categories trang chủ
// API: /api/comic?page=1 (cập nhật mới nhất)
function execute() {
    ensureSiteUrl();
    return Response.success([
        {title: 'Mới Cập Nhật', input: '/api/comic?page=1&sort=update', script: 'gen.js'},
        {title: 'Truyện Mới',   input: '/api/comic?page=1&sort=new',    script: 'gen.js'},
        {title: 'Đang Hot',     input: '/api/comic?page=1&sort=view',   script: 'gen.js'}
    ]);
}
