load('config.js');

function execute() {
    return Response.success([
        { title: 'Trang chủ (Mới cập nhật)', input: '/truyen-cap-nhat?p=1', script: 'gen.js' },
        { title: 'Truyện Mới', input: '/danh-sach?p=1', script: 'gen.js' },
        { title: 'Đang Hot', input: '/danh-sach?sort=view&p=1', script: 'gen.js' }
    ]);
}
