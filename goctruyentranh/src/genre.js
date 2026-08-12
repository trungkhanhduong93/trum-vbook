load('config.js');

function execute() {
    return Response.success([
        { title: 'Hành Động (Action)', input: '/api/proxy/v2/search?categories=ACT&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Phiêu Lưu (Adventure)', input: '/api/proxy/v2/search?categories=ADV&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Hài Hước (Comedy)', input: '/api/proxy/v2/search?categories=COM&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Drama', input: '/api/proxy/v2/search?categories=DRA&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Viễn Tưởng (Fantasy)', input: '/api/proxy/v2/search?categories=FTS&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Harem', input: '/api/proxy/v2/search?categories=HAR&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Huyền Bí (Mystery)', input: '/api/proxy/v2/search?categories=MYS&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Lãng Mạn (Romance)', input: '/api/proxy/v2/search?categories=ROM&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Kinh Dị (Horror)', input: '/api/proxy/v2/search?categories=HOR&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Học Đường', input: '/api/proxy/v2/search?categories=SCL&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Lịch Sử', input: '/api/proxy/v2/search?categories=HIS&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Isekai', input: '/api/proxy/v2/search?categories=ISE&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Manhwa (Truyện Hàn)', input: '/api/proxy/v2/search?categories=MAW&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Manhua (Truyện Trung)', input: '/api/proxy/v2/search?categories=MAU&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Manga (Truyện Nhật)', input: '/api/proxy/v2/search?categories=MAG&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Võ Thuật', input: '/api/proxy/v2/search?categories=MAA&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Webtoons', input: '/api/proxy/v2/search?categories=WEB&orders=viewCount&p=0', script: 'gen.js' }
    ]);
}
