load('config.js');

function execute() {
    return Response.success([
        { title: 'Action (Hành Động)', input: '/danh-sach?category=ACT&p=1', script: 'gen.js' },
        { title: 'Adventure (Phiêu Lưu)', input: '/danh-sach?category=ADV&p=1', script: 'gen.js' },
        { title: 'Comedy (Hài Hước)', input: '/danh-sach?category=COM&p=1', script: 'gen.js' },
        { title: 'Drama (Kịch Tính)', input: '/danh-sach?category=DRA&p=1', script: 'gen.js' },
        { title: 'Fantasy (Huyền Tưởng)', input: '/danh-sach?category=FAN&p=1', script: 'gen.js' },
        { title: 'Manhua (Truyện Trung)', input: '/danh-sach?category=MAA&p=1', script: 'gen.js' },
        { title: 'Manhwa (Truyện Hàn)', input: '/danh-sach?category=MAW&p=1', script: 'gen.js' },
        { title: 'Mystery (Bí Ẩn)', input: '/danh-sach?category=MYS&p=1', script: 'gen.js' },
        { title: 'Romance (Lãng Mạn)', input: '/danh-sach?category=ROM&p=1', script: 'gen.js' },
        { title: 'Sci-Fi (Viễn Tưởng)', input: '/danh-sach?category=SCL&p=1', script: 'gen.js' },
        { title: 'Webtoon', input: '/danh-sach?category=WEB&p=1', script: 'gen.js' }
    ]);
}
