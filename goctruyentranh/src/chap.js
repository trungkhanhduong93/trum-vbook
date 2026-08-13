load('config.js');

// Ảnh thông báo — VBook nuốt Response.error của chap.js rồi tự hiện câu
// "bấm trang nguồn để xác minh bạn là con người", làm 3 vòng chẩn đoán trước
// đổ nhầm cho Cloudflare. Trả lý do thật thành ảnh để đọc được trên màn hình.
function noticeImage(lines) {
    var text = '';
    for (var i = 0; i < lines.length; i++) {
        text += (i ? '\n' : '') + lines[i];
    }
    return [
        'https://placehold.co/900x1300/111827/f9fafb/png?font=roboto&text=' +
        encodeURIComponent(text)
    ];
}

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
function loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // KHÔNG setUserAgent: đổi UA giữa chừng có nguy cơ mất phiên đăng nhập
        browser.launch(pageUrl, 12);

        var body = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);

        var js = '' +
            '(function(){' +
            '  var mark=function(s){document.body.innerHTML="GTTSTART"+s+"GTTEND";};' +
            '  var tk=null; try{tk=localStorage.getItem("Authorization");}catch(e){}' +
            '  var has=tk?"1":"0";' +
            '  try{' +
            '    var x=new XMLHttpRequest();' +
            '    x.open("POST","/api/chapter/loadAll",true);' +
            '    x.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");' +
            '    x.setRequestHeader("X-Requested-With","XMLHttpRequest");' +
            '    if(tk){x.setRequestHeader("Authorization",tk);}' +
            '    x.onload=function(){mark(has+"|OK|"+x.responseText);};' +
            '    x.onerror=function(){mark(has+"|NET|loi mang trong webview");};' +
            '    x.send(' + JSON.stringify(body) + ');' +
            '  }catch(e){mark(has+"|EXC|"+e.message);}' +
            '})();';

        browser.callJs(js, 8000);
        var doc = browser.html();
        browser.close();
        browser = null;

        if (!doc) return { err: 'WEBVIEW_EMPTY' };

        var text = doc.select('body').text();
        var m = String(text).match(/GTTSTART([\s\S]*?)GTTEND/);
        if (!m) return { err: 'NO_SENTINEL' };

        var payload = m[1];
        var p1 = payload.indexOf('|');
        var p2 = payload.indexOf('|', p1 + 1);
        if (p1 < 0 || p2 < 0) return { err: 'BAD_PAYLOAD' };

        var hasToken = payload.substring(0, p1) === '1';
        var kind = payload.substring(p1 + 1, p2);
        var rest = payload.substring(p2 + 1);

        if (kind !== 'OK') return { err: kind, hasToken: hasToken, detail: rest };

        try {
            var json = JSON.parse(rest);
            return { json: json, hasToken: hasToken };
        } catch (e) {
            return { err: 'BAD_JSON', hasToken: hasToken };
        }
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return { err: 'BROWSER_EXC', detail: e.message };
    }
}

function execute(url) {
    var sUrl = String(url);
    var slug = comicSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    var match = extractSlug(sUrl).match(/\/chuong-([0-9.]+)$/i);
    if (!match) return Response.error('Không đọc được số chương từ đường dẫn.');
    var chapNum = match[1];

    primeSession();

    var detail = siteGet('/api/comic/' + slug);
    if (!detail || !detail.result || !detail.result.id) {
        return Response.success(noticeImage([
            '[GTT-DETAIL] Khong lay duoc',
            'thong tin truyen',
            '', slug
        ]));
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

    // ── Đường 2: chương khoá (codeState 01) hoặc phiên hỏng → mượn WebView.
    var needBrowser = !r || r.codeState === '01' || r.codeState === '03' || !r.state;
    if (needBrowser) {
        var b = loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn);

        if (b && b.json && b.json.result) {
            var br = b.json.result;
            if (br.codeState === '00') {
                var bimgs = imagesFrom(br);
                if (bimgs) return Response.success(bimgs);
            }
            if (br.codeState === '01') {
                return Response.success(noticeImage(
                    b.hasToken
                        ? ['Chuong ' + chapNum + ' bi khoa',
                           '', 'Da dang nhap nhung site van',
                           'tu choi — co the het luot doc',
                           'hoac tai khoan chua du quyen.']
                        : ['Chuong ' + chapNum + ' can dang nhap',
                           '', 'Bam "trang nguon", dang nhap',
                           'Gmail NGAY TRONG APP,',
                           'roi mo lai chuong nay.',
                           '', '(Dang nhap bang Chrome ngoai',
                           'app khong dung duoc)']
                ));
            }
            if (br.codeState === '02') {
                return Response.success(noticeImage([
                    '[GTT-02] Het luot doc mien phi',
                    '', 'Cho reset hoac dung tai khoan',
                    'co quyen doc chuong nay.'
                ]));
            }
        }

        return Response.success(noticeImage([
            '[GTT-' + ((b && b.err) ? b.err : 'WEBVIEW') + ']',
            'Chuong ' + chapNum + ' khong tai duoc',
            '', (b && b.hasToken === false)
                    ? 'WebView chua dang nhap Gmail.'
                    : 'Thu mo "trang nguon" mot lan.'
        ]));
    }

    if (r && r.codeState === '02') {
        return Response.success(noticeImage(['[GTT-02] Het luot doc mien phi']));
    }

    return Response.success(noticeImage([
        '[GTT-EMPTY] Chuong ' + chapNum,
        'chua co anh tren site.'
    ]));
}
