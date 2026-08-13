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
function loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // KHÔNG setUserAgent: đổi UA giữa chừng có nguy cơ mất phiên đăng nhập.
        // Mở /lien-he chứ KHÔNG mở trang chương: cùng origin nên XHR chạy được,
        // mà trang nhẹ (55KB), không có JS trình đọc, không dính redirect
        // `;usid=` của trang chương — đúng cách v15 từng né được vòng lặp xác minh.
        browser.launch(SITE_URL + '/lien-he', 12);

        var body = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);

        // XHR ĐỒNG BỘ: callJs trả về là browser.html() bị đọc ngay. Dùng async thì
        // đó là cuộc đua — mạng chậm hơn cửa sổ chờ là body chưa kịp có gì,
        // và "chưa kịp" không phân biệt được với "site từ chối" (ca NO_SENTINEL).
        var js = '' +
            '(function(){' +
            '  var mark=function(s){try{document.body.innerHTML="GTTSTART"+s+"GTTEND";}catch(e){}};' +
            '  var tk=null; try{tk=localStorage.getItem("Authorization");}catch(e){}' +
            '  var has=tk?"1":"0";' +
            '  var t=(document.title||"")+" "+(document.body?document.body.className:"");' +
            '  if(/just a moment|attention required|checking your browser|cf-chl|challenge/i.test(t)){' +
            '    mark(has+"|CFWALL|"+t.substring(0,60)); return;' +
            '  }' +
            '  try{' +
            '    var x=new XMLHttpRequest();' +
            '    x.open("POST","/api/chapter/loadAll",false);' +
            '    x.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");' +
            '    x.setRequestHeader("X-Requested-With","XMLHttpRequest");' +
            '    if(tk){x.setRequestHeader("Authorization",tk);}' +
            '    x.send(' + JSON.stringify(body) + ');' +
            '    mark(has+"|"+(x.status===200?"OK":("HTTP"+x.status))+"|"+x.responseText);' +
            '  }catch(e){mark(has+"|EXC|"+(e&&e.message?e.message:"loi khong ro"));}' +
            '})();';

        browser.callJs(js, 10000);
        var doc = browser.html();
        browser.close();
        browser = null;

        if (!doc) return { err: 'WEBVIEW_EMPTY' };

        var text = doc.select('body').text();
        var m = String(text).match(/GTTSTART([\s\S]*?)GTTEND/);
        if (!m) {
            // Không có sentinel = callJs không chạy được, hoặc trang bị thay bằng
            // tường xác minh. Đọc title để phân biệt thay vì báo chung chung.
            var ttl = '';
            try { ttl = doc.select('title').text(); } catch (e) {}
            if (/just a moment|attention required|checking your browser/i.test(String(ttl))) {
                return { err: 'CFWALL', detail: ttl };
            }
            return { err: 'NO_SENTINEL', detail: String(ttl).substring(0, 40) };
        }

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
        if (b && b.err === 'CFWALL') {
            return Response.error('[GTT-CF] Cloudflare chặn. Mở trang nguồn → tick xác minh → đăng nhập Gmail ngay trong app.');
        }

        return Response.error('[GTT-' + ((b && b.err) ? b.err : 'WEBVIEW') + '] Chương ' + chapNum +
            (b && b.hasToken === false ? ': WebView chưa đăng nhập.' : ': mở trang nguồn một lần.') +
            (b && b.detail ? ' (' + String(b.detail).substring(0, 40) + ')' : ''));
    }

    if (r && r.codeState === '02') {
        return Response.error('[GTT-02] Hết lượt đọc miễn phí cho chương ' + chapNum + '.');
    }

    return Response.error('[GTT-EMPTY] Chương ' + chapNum + ' chưa có ảnh trên site.');
}
