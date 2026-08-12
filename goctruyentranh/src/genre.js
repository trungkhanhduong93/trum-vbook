load('config.js');

// genre.js: Danh sách thể loại
// Mã data-code lấy từ HTML /danh-sach và đối chiếu với API /api/v2/search.
// Lưu ý: FAN không tồn tại, SCL = Học Đường (không phải Sci-Fi, đúng là SCF),
// MAA = Võ Thuật (không phải Manhua, đúng là MAU).
function execute() {
    return Response.success([
        { title: 'Hành Động (Action)', input: '/api/v2/search?categories=ACT&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Phiêu Lưu (Adventure)', input: '/api/v2/search?categories=ADV&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Hài Hước (Comedy)', input: '/api/v2/search?categories=COM&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Drama', input: '/api/v2/search?categories=DRA&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Viễn Tưởng (Fantasy/Sci-Fi)', input: '/api/v2/search?categories=FTS&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Harem', input: '/api/v2/search?categories=HAR&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Huyền Bí (Mystery)', input: '/api/v2/search?categories=MYS&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Lãng Mạn (Romance)', input: '/api/v2/search?categories=ROM&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Kinh Dị (Horror)', input: '/api/v2/search?categories=HOR&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Học Đường', input: '/api/v2/search?categories=SCL&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Lịch Sử (Historical)', input: '/api/v2/search?categories=HIS&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Isekai', input: '/api/v2/search?categories=ISE&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Thể Thao (Sports)', input: '/api/v2/search?categories=SPO&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Manhwa (Truyện Hàn)', input: '/api/v2/search?categories=MAW&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Manhua (Truyện Trung)', input: '/api/v2/search?categories=MAU&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Manga (Truyện Nhật)', input: '/api/v2/search?categories=MAG&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Võ Thuật', input: '/api/v2/search?categories=MAA&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Siêu Nhiên', input: '/api/v2/search?categories=SUN&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Tráng Sinh', input: '/api/v2/search?categories=RED&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Webtoons', input: '/api/v2/search?categories=WEB&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Shounen', input: '/api/v2/search?categories=SHO&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Hầm Ngục (Dungeon)', input: '/api/v2/search?categories=DUN&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Săn Bắn (Hunter)', input: '/api/v2/search?categories=HUNT&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Leo Tháp', input: '/api/v2/search?categories=LTT&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Murim', input: '/api/v2/search?categories=MRR&orders=viewCount&p=0', script: 'gen.js' },
        { title: 'Game', input: '/api/v2/search?categories=GAM&orders=viewCount&p=0', script: 'gen.js' }
    ]);
}
