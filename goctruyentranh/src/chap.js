load('config.js');

// LƯU Ý cho lần sửa sau: v11–v23 từng trả lý do lỗi thành ẢNH thông báo
// (Response.success + placehold.co) để né việc VBook nuốt Response.error rồi
// tự hiện câu "bấm trang nguồn để xác minh bạn là con người".
// Đó là sai lầm: success = VBook tưởng chương tải xong → KHÔNG hiện nút
// "trang nguồn" → người dùng đọc được lý do nhưng MẤT ĐƯỜNG THOÁT, trong khi
// chính cái nút đó là chỗ duy nhất để tick xác minh và đăng nhập Gmail.
// Mọi nhánh hỏng phải dùng Response.error, kể cả khi thông báo bị thay.

function imagesFrom(result) {
    if (!result || !result.data || !result.data.length) return null;
    var out = [];
    for (var i = 0; i < result.data.length; i++) {
        var u = String(result.data[i] || '').trim();
        if (u) out.push(u);   // URL trần, giữ nguyên như site trả
    }
    return out.length ? out : null;
}

// ─── Đường 2: gọi API TỪ BÊN TRONG WebView ────────────────────
// Site xác thực bằng header Authorization lấy từ localStorage (xem beforeAuth
// trong /contents/v2/js/common.js). localStorage KHÔNG nằm trong cookie jar nên
// không mượn ra ngoài được — phải chạy JS ngay trong trang để dùng cả cookie,
// localStorage lẫn phiên Cloudflare mà WebView của app đang giữ.

// Đọc kết quả một lượt callJs. Trả chuỗi payload giữa hai mốc, hoặc null.
function readSentinel(browser) {
    var doc = null;
    try { doc = browser.html(); } catch (e) {}
    if (!doc) return null;
    var text = '';
    try { text = String(doc.select('body').text()); } catch (e) { return null; }
    var m = text.match(/GTTSTART([\s\S]*?)GTTEND/);
    return m ? m[1] : null;
}

// Tiêu đề trang — dùng để phân biệt tường Cloudflare với "chưa nạp xong".
function browserTitle(browser) {
    try {
        var doc = browser.html();
        if (doc) return String(doc.select('title').text());
    } catch (e) {}
    return '';
}

function buildLoadAllJs(body) {
    // XHR ĐỒNG BỘ: callJs trả về là browser.html() bị đọc ngay. Dùng async thì
    // đó là cuộc đua — mạng chậm hơn cửa sổ chờ là body chưa kịp có gì,
    // và "chưa kịp" không phân biệt được với "site từ chối" (ca NO_SENTINEL).
    return '' +
        '(function(){' +
        '  var mark=function(s){try{document.body.innerHTML="GTTSTART"+s+"GTTEND";}catch(e){}};' +
        '  var loc=""; try{loc=String(location.href);}catch(e){}' +
        '  var tk=null; try{tk=localStorage.getItem("Authorization");}catch(e){}' +
        '  var has=tk?"1":"0";' +
        // Chưa đứng trên trang site (about:blank vì launch chưa nạp xong) thì
        // localStorage ném lỗi VÀ x.open() với URL tương đối ném "Invalid URL".
        // Phải báo đúng tên ca này, đừng để nó đội lốt "chưa đăng nhập".
        '  if(loc.indexOf("goctruyentranhvui")<0){mark(has+"|NOTLOADED|"+loc.substring(0,80));return;}' +
        '  var t=(document.title||"")+" "+(document.body?document.body.className:"");' +
        '  if(/just a moment|attention required|checking your browser|cf-chl|challenge/i.test(t)){' +
        '    mark(has+"|CFWALL|"+t.substring(0,60)); return;' +
        '  }' +
        '  try{' +
        '    var x=new XMLHttpRequest();' +
        // URL tuyệt đối dựng từ chính trang đang đứng: không phụ thuộc base URI,
        // và giữ đúng scheme/host của phiên đăng nhập.
        '    x.open("POST",location.protocol+"//"+location.host+"/api/chapter/loadAll",false);' +
        '    x.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");' +
        '    x.setRequestHeader("X-Requested-With","XMLHttpRequest");' +
        '    if(tk){x.setRequestHeader("Authorization",tk);}' +
        '    x.send(' + JSON.stringify(body) + ');' +
        '    mark(has+"|"+(x.status===200?"OK":("HTTP"+x.status))+"|"+x.responseText);' +
        '  }catch(e){mark(has+"|EXC|"+(e&&e.message?e.message:"loi khong ro"));}' +
        '})();';
}

function parsePayload(payload) {
    var p1 = payload.indexOf('|');
    var p2 = payload.indexOf('|', p1 + 1);
    if (p1 < 0 || p2 < 0) return { err: 'BAD_PAYLOAD' };

    var hasToken = payload.substring(0, p1) === '1';
    var kind = payload.substring(p1 + 1, p2);
    var rest = payload.substring(p2 + 1);

    if (kind !== 'OK') return { err: kind, hasToken: hasToken, detail: rest };

    try {
        return { json: JSON.parse(rest), hasToken: hasToken };
    } catch (e) {
        return { err: 'BAD_JSON', hasToken: hasToken };
    }
}

// /api/comic/{slug} trả kèm 21 chương mới nhất, mỗi chương có cờ `type`.
// Chương bị site bắt đăng nhập được đánh dấu TRIPLE — biết trước mà không tốn
// thêm request nào, để báo cho đúng thay vì đổ tại WebView.
function isLockedChapter(detailResult, chapNum) {
    var chs = (detailResult && detailResult.chapters) || [];
    for (var i = 0; i < chs.length; i++) {
        if (String(chs[i].numberChapter || '') === String(chapNum)) {
            return String(chs[i].type || '') === 'TRIPLE';
        }
    }
    return false;   // ngoài 21 chương mới nhất → hầu như luôn là chương free
}

// Trang đã nạp thật chưa? about:blank có <title> rỗng và body gần như trống.
// Đọc bằng browser.html() nên KHÔNG phá DOM — phải giữ DOM để còn bóc ảnh.
function pageLoaded(browser) {
    try {
        var doc = browser.html();
        if (!doc) return false;
        if (String(doc.select('title').text() || '').length > 0) return true;
        return String(doc.select('body').html() || '').length > 300;
    } catch (e) {}
    return false;
}

// Bóc ảnh chương từ DOM đã render. Ảnh chương nằm trên CDN gtt-bk.pro; ảnh bìa
// và ảnh liên quan đi qua chính domain site (`/image/{slug-id}/...?code=`) nên
// lọc theo host là tách được hai loại.
function imagesFromDoc(doc) {
    if (!doc) return null;
    var out = [], seen = {};
    var imgs = doc.select('img');
    for (var i = 0; i < imgs.size(); i++) {
        var el = imgs.get(i);
        var src = el.attr('src') || el.attr('data-src') || el.attr('data-original') || '';
        src = String(src).trim();
        if (src.indexOf('http') !== 0) continue;
        if (src.indexOf('gtt-bk.pro') < 0) continue;
        if (seen[src]) continue;
        seen[src] = true;
        out.push(src);
    }
    return out.length ? out : null;
}

function loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // KHÔNG setUserAgent: đổi UA giữa chừng có nguy cơ mất phiên đăng nhập.

        // Đo trên máy thật 30/08/2026 (v27): mở /lien-he thì WebView đứng nguyên ở
        // `about:blank`, chờ thêm 6,5s cũng không nhúc nhích — nên chờ lâu hơn KHÔNG
        // phải là cách chữa. Cùng lúc đó nút "Trang nguồn" (mở đúng URL chương) lại
        // vào được. Vì vậy: mở CHÍNH trang chương, và thử nhiều kiểu gọi launch vì
        // đơn vị tham số thứ hai không thống nhất trong repo (luottruyen 8, cuutruyen
        // 15000) — không đoán đơn vị nữa, thử cả hai.
        // Mỗi lượt đổi MỘT biến: số timeout, rồi tới đường dẫn. Nếu bộ chặn quảng cáo
        // chặn theo mẫu đường dẫn thì trang gốc "/" có thể lọt trong khi "/truyen/..."
        // thì không. Cả 4 đều cùng origin nên localStorage (chứa token) vẫn dùng được.
        var tries = [
            { url: pageUrl,                 t: 8     },   // khuôn luottruyen v28 chạy được trên máy thật
            { url: pageUrl,                 t: 15000 },   // khuôn cuutruyen
            { url: SITE_URL + '/lien-he',   t: 15000 },   // trang nhẹ 55KB
            { url: SITE_URL + '/',          t: 15000 }    // đường dẫn khác hẳn
        ];

        var loaded = false;
        for (var k = 0; k < tries.length && !loaded; k++) {
            try { browser.launch(tries[k].url, tries[k].t); } catch (e) {}
            // callJs cũng là chỗ chờ: luottruyen v28 chờ đúng kiểu này.
            try { browser.callJs('void 0;', k === 0 ? 3000 : 5000); } catch (e) {}
            loaded = pageLoaded(browser);
        }

        // Bóc ảnh có sẵn trên DOM TRƯỚC khi tiêm JS (tiêm JS ghi đè body, xoá mất ảnh).
        // Chỉ giữ làm PHƯƠNG ÁN CUỐI: trang chương lazy-load nên DOM lúc này có thể
        // mới chỉ có vài ảnh đầu, trả về là ra chương cụt mà không ai biết.
        var domImgs = null;
        if (loaded) {
            try { domImgs = imagesFromDoc(browser.html()); } catch (e) {}
        }

        var body = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);
        var js = buildLoadAllJs(body);

        // XHR trong trang: lấy ĐỦ ảnh một lần (trang chương lazy-load nên DOM có thể
        // mới chỉ có vài ảnh đầu — đó là lý do XHR vẫn là đường chính).
        try { browser.callJs(js, 10000); } catch (e) {}
        var payload = readSentinel(browser);

        if (payload === null) {
            // chờ thêm một nhịp rồi thử lại đúng một lần
            try { browser.callJs('void 0;', 4000); } catch (e) {}
            try { browser.callJs(js, 10000); } catch (e) {}
            payload = readSentinel(browser);
        }

        var title = (payload === null) ? browserTitle(browser) : '';
        var out = (payload === null) ? null : parsePayload(payload);

        browser.close();
        browser = null;

        // XHR ăn thì dùng nó — đó là danh sách ĐỦ cả chương.
        if (out && out.json) return out;

        // XHR không ăn mà DOM đã có ảnh thì còn hơn không.
        if (domImgs) return { images: domImgs };

        if (out) return out;

        // Không có sentinel = callJs không chạy được, hoặc trang bị thay bằng
        // tường xác minh. Đọc title để phân biệt thay vì báo chung chung.
        if (/just a moment|attention required|checking your browser/i.test(title)) {
            return { err: 'CFWALL', detail: title };
        }
        return { err: 'NO_SENTINEL', detail: title.substring(0, 60) };
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return { err: 'BROWSER_EXC', detail: e.message };
    }
}

function execute(url) {
    syncBaseFromUrl(url);

    var sUrl = String(url);
    var slug = comicSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    var match = extractSlug(sUrl).match(/\/chuong-([0-9.]+)$/i);
    if (!match) return Response.error('Không đọc được số chương từ đường dẫn.');
    var chapNum = match[1];

    primeSession();

    var detail = siteGet('/api/comic/' + slug);
    if (!detail || !detail.result || !detail.result.id) {
        return Response.error('[GTT-DETAIL] Không lấy được thông tin truyện (' + slug + ').');
    }
    var comicId = String(detail.result.id);
    var nameEn = detail.result.nameEn ? String(detail.result.nameEn) : slug;
    var pageUrl = SITE_URL + '/truyen/' + slug + '/chuong-' + chapNum;

    var body = 'comicId=' + encodeURIComponent(comicId) +
               '&chapterNumber=' + encodeURIComponent(chapNum) +
               '&nameEn=' + encodeURIComponent(nameEn);

    // ── Đường 1: HTTP thẳng. Chương thường ăn ngay, ~0,3s, không cần browser.
    var res = sitePost('/api/chapter/loadAll', body, pageUrl);
    var r = (res && res.result) ? res.result : null;

    if (r && r.codeState === '00') {
        var imgs = imagesFrom(r);
        if (imgs) return Response.success(imgs);
    }

    if (r && r.codeState === '02') {
        return Response.error('[GTT-02] Hết lượt đọc miễn phí cho chương ' + chapNum + '.');
    }

    // ── Đường 2: chương khoá (codeState 01) hoặc phiên hỏng → mượn WebView.
    // codeState 01 là site đánh dấu chương phải đăng nhập (type=TRIPLE trong
    // mục lục, đã hiện 🔒). Đo 30/08/2026: site khoá ~18 chương MỚI NHẤT nhưng
    // luôn chừa 3 chương đầu — truyện ít chương thì gần như chỉ đọc free được
    // chương 1-3, đó là ràng buộc của site chứ không phải plugin hỏng.
    var needBrowser = !r || r.codeState === '01' || r.codeState === '03' || !r.state;
    if (needBrowser) {
        var b = loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn);

        if (b && b.images && b.images.length) {
            return Response.success(b.images);
        }

        if (b && b.json && b.json.result) {
            var br = b.json.result;
            if (br.codeState === '00') {
                var bimgs = imagesFrom(br);
                if (bimgs) return Response.success(bimgs);
            }
            if (br.codeState === '01') {
                return Response.error(b.hasToken
                    ? '[GTT-01] Chương ' + chapNum + ': đã đăng nhập nhưng site vẫn từ chối (hết lượt đọc hoặc tài khoản chưa đủ quyền).'
                    : '[GTT-01] Chương ' + chapNum + ' cần đăng nhập. Mở trang nguồn → đăng nhập Gmail ngay trong app.');
            }
            if (br.codeState === '02') {
                return Response.error('[GTT-02] Hết lượt đọc miễn phí cho chương ' + chapNum + '.');
            }
        }

        // Cloudflare chặn ngay trong WebView → người dùng phải tự tick xác minh
        // một lần trong app; phiên đó nằm lại cookie jar cho lần sau.
        // Vé Cloudflare gắn theo IP nên đổi mạng (4G ↔ wifi) là phải xác minh lại
        // — bình thường, không phải plugin hỏng.
        // TẮT CHẶN QUẢNG CÁO là bước quan trọng nhất và dễ quên nhất: bộ chặn của
        // VBook chặn luôn tài nguyên challenges.cloudflare.com nên ô xác minh
        // quay vô tận, tick bao nhiêu lần cũng không xong (13/08/2026).
        if (b && b.err === 'CFWALL') {
            return Response.error('[GTT-CF] Cloudflare chặn. Mở trang nguồn → TẮT CHẶN QUẢNG CÁO → tick xác minh → đăng nhập Gmail, tất cả ngay trong app.');
        }

        // Chương bị site khoá thì nói thẳng ra, đừng để người đọc tưởng plugin hỏng.
        var lockNote = isLockedChapter(detail.result, chapNum)
            ? ' Chương này site đánh dấu KHOÁ (🔒 trong mục lục) — phải đăng nhập Gmail ngay trong app mới đọc được.'
            : '';

        if (b && b.err === 'NOTLOADED') {
            // Đã thử 3 kiểu launch mà WebView vẫn đứng ở about:blank → không phải
            // mạng chậm. Thủ phạm hay gặp nhất là bộ chặn quảng cáo của VBook.
            return Response.error('[GTT-NOTLOADED] Chương ' + chapNum + ': WebView của app không vào được trang nguồn '
                + '(đứng ở ' + String(b.detail || '?').substring(0, 60) + '). Vào Cài đặt VBook → TẮT CHẶN QUẢNG CÁO, '
                + 'rồi mở lại chương.' + lockNote);
        }

        return Response.error('[GTT-' + ((b && b.err) ? b.err : 'WEBVIEW') + '] Chương ' + chapNum +
            (b && b.hasToken === false ? ': WebView chưa đăng nhập.' : ': mở trang nguồn một lần.') +
            lockNote +
            (b && b.detail ? ' (' + String(b.detail).substring(0, 100) + ')' : ''));
    }

    return Response.error('[GTT-EMPTY] Chương ' + chapNum + ' chưa có ảnh trên site.');
}
