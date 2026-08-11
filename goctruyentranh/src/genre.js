load('config.js');

// genre.js: Trả danh sách thể loại
// Site không có API genre riêng, dùng danh sách tĩnh theo thể loại phổ biến
function execute() {
    ensureSiteUrl();
    // Dùng /danh-sach với filter category (phải test URL phân trang sau)
    var genres = [
        {title: 'Hành Động',  input: '/api/comic/search?category=ACT&page=1',  script: 'gen.js'},
        {title: 'Tình Cảm',   input: '/api/comic/search?category=ROM&page=1',  script: 'gen.js'},
        {title: 'Phiêu Lưu',  input: '/api/comic/search?category=ADV&page=1',  script: 'gen.js'},
        {title: 'Hài Hước',   input: '/api/comic/search?category=COM&page=1',  script: 'gen.js'},
        {title: 'Fantasy',    input: '/api/comic/search?category=FAN&page=1',  script: 'gen.js'},
        {title: 'Kinh Dị',    input: '/api/comic/search?category=HOR&page=1',  script: 'gen.js'},
        {title: 'Thể Thao',   input: '/api/comic/search?category=SPT&page=1',  script: 'gen.js'},
        {title: 'Đời Thường', input: '/api/comic/search?category=SLI&page=1',  script: 'gen.js'},
        {title: 'Murim',      input: '/api/comic/search?category=MRR&page=1',  script: 'gen.js'},
        {title: 'Manhwa',     input: '/api/comic/search?category=MAW&page=1',  script: 'gen.js'},
        {title: 'Manga',      input: '/api/comic/search?category=MAA&page=1',  script: 'gen.js'},
        {title: 'Tu Tiên',    input: '/api/comic/search?category=XIA&page=1',  script: 'gen.js'}
    ];
    return Response.success(genres);
}
