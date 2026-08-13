load('config.js');

// 29 mã thể loại lấy từ chính dữ liệu API (trường categoryCode/category của
// /api/v2/search, gộp 4 trang) — không phải đoán. Bản cũ có mã sai như "FAN"
// (không tồn tại) nên bấm vào là danh sách rỗng.
var CATS = [
    ['ACT', 'Hành Động'],   ['ADV', 'Phiêu Lưu'],    ['MAA', 'Võ Thuật'],
    ['ROM', 'Lãng Mạn'],    ['COM', 'Hài Hước'],     ['DRA', 'Drama'],
    ['FTS', 'Viễn Tưởng'],  ['MYS', 'Huyền Bí'],     ['HOR', 'Kinh Dị'],
    ['SUN', 'Siêu Nhiên'],  ['RED', 'Trùng Sinh'],   ['LTT', 'Leo Tháp'],
    ['DUN', 'Hầm Ngục'],    ['MRR', 'Murim'],        ['SCL', 'Học Đường'],
    ['SCF', 'Khoa Học'],    ['HIS', 'Lịch Sử'],      ['SPO', 'Thể Thao'],
    ['SOL', 'Slice of life'], ['COO', 'Nấu Ăn'],     ['GAM', 'Game'],
    ['SHO', 'Shounen'],     ['MAW', 'Manhwa'],       ['MAU', 'Manhua'],
    ['MAG', 'Manga'],       ['WEB', 'Webtoons'],     ['COI', 'Truyện Màu'],
    ['MAT', 'Mature'],      ['NTNC', 'Ngôn Từ Nhạy Cảm']
];

function execute() {
    var list = [];
    for (var i = 0; i < CATS.length; i++) {
        list.push({
            title: CATS[i][1],
            input: '/api/v2/search?p=0&categories=' + CATS[i][0],
            script: 'gen.js'
        });
    }
    return Response.success(list);
}
