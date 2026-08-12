load('config.js');

function execute() {
    return Response.success([
        { title: 'Trang chủ (Mới cập nhật)', input: '/api/proxy/v2/search?p=0&orders=updateTime', script: 'gen.js' },
        { title: 'Truyện Mới', input: '/api/proxy/v2/search?p=0&orders=createdAt', script: 'gen.js' },
        { title: 'Đang Hot', input: '/api/proxy/v2/search?p=0&orders=viewCount', script: 'gen.js' }
    ]);
}
