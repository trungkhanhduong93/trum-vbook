load("config.js");

function execute() {
    var b = BASE_URL + "/truyen-tranh/";
    return Response.success([
        { title: "Mới Cập Nhật", input: b + "?m_orderby=latest",    script: "gen.js" },
        { title: "Truyện Mới",   input: b + "?m_orderby=new-manga", script: "gen.js" },
        { title: "Đang Hot",     input: b + "?m_orderby=trending",  script: "gen.js" },
        { title: "Xem Nhiều",    input: b + "?m_orderby=views",     script: "gen.js" },
        { title: "Đánh Giá Cao", input: b + "?m_orderby=rating",    script: "gen.js" },
        { title: "Bảng Chữ Cái", input: b + "?m_orderby=alphabet",  script: "gen.js" }
    ]);
}
