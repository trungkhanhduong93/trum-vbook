load('config.js');

function siteImage(u) {
    var url = String(u).trim().replace(/^https?:\/\/vn\d*\.gtt-bk\.pro/i, SITE_URL);
    if (GTT_IMG_PROXY) return GTT_IMG_PROXY + encodeURIComponent(url);
    return url;
}

function imagesFrom(result) {
    if (!result || !result.data || !result.data.length) return null;
    var out = [];
    for (var i = 0; i < result.data.length; i++) {
        var u = String(result.data[i] || '').trim();
        if (u) out.push(siteImage(u));
    }
    return out.length ? out : null;
}

function readSentinel(browser) {
    var doc = null;
    try { doc = browser.html(); } catch (e) {}
    if (!doc) return null;
    var text = '';
    try { text = String(doc.select('body').text()); } catch (e) { return null; }
    var m = text.match(/GTTSTART([\s\S]*?)GTTEND/);
    return m ? m[1] : null;
}

function browserTitle(browser) {
    try {
        var doc = browser.html();
        if (doc) return String(doc.select('title').text());
    } catch (e) {}
    return '';
}

function buildLoadAllJs(body) {
    return '' +
        '(function(){' +
        '  var mark=function(s){try{document.body.innerHTML="GTTSTART"+s+"GTTEND";}catch(e){}};' +
        '  var loc=""; try{loc=String(location.href);}catch(e){}' +
        '  var tk=null; try{tk=localStorage.getItem("Authorization");}catch(e){}' +
        '  var has=tk?"1":"0";' +
        '  if(loc.indexOf("goctruyentranhvui")<0){mark(has+"|NOTLOADED|"+loc.substring(0,80));return;}' +
        '  var t=(document.title||"")+" "+(document.body?document.body.className:"");' +
        '  if(/just a moment|attention required|checking your browser|cf-chl|challenge/i.test(t)){' +
        '    mark(has+"|CFWALL|"+t.substring(0,60)); return;' +
        '  }' +
        '  try{' +
        '    var x=new XMLHttpRequest();' +
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
        src = siteImage(src);
        if (seen[src]) continue;
        seen[src] = true;
        out.push(src);
    }
    return out.length ? out : null;
}

function isLockedChapter(detailResult, chapNum) {
    var chs = (detailResult && detailResult.chapters) || [];
    for (var i = 0; i < chs.length; i++) {
        if (String(chs[i].numberChapter || '') === String(chapNum)) {
            return String(chs[i].type || '') === 'TRIPLE';
        }
    }
    return false;
}

function loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        try {
            browser.block([".*google.*", ".*facebook.*", ".*analytics.*", ".*doubleclick.*", ".*adservice.*", ".*\\.gif"]);
        } catch (eBlock) {}

        try { browser.launch(pageUrl, 4); } catch (e) {}
        try { browser.callJs('void 0;', 2); } catch (e) {}

        var domImgs = null;
        try { domImgs = imagesFromDoc(browser.html()); } catch (e) {}
        if (domImgs && domImgs.length > 0) {
            return { images: domImgs };
        }

        var body = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);
        var js = buildLoadAllJs(body);

        try { browser.callJs(js, 4); } catch (e) {}
        var payload = readSentinel(browser);

        if (payload === null) {
            try { browser.callJs('void 0;', 2); } catch (e) {}
            try { browser.callJs(js, 4); } catch (e) {}
            payload = readSentinel(browser);
        }

        var title = (payload === null) ? browserTitle(browser) : '';
        var out = (payload === null) ? null : parsePayload(payload);

        if (out && out.json) return out;
        if (domImgs) return { images: domImgs };
        if (out) return out;

        if (/just a moment|attention required|checking your browser/i.test(title)) {
            return { err: 'CFWALL', detail: title };
        }
        return { err: 'NO_SENTINEL', detail: title.substring(0, 60) };
    } catch (e) {
        return { err: 'BROWSER_EXC', detail: e.message };
    } finally {
        if (browser) {
            try { browser.close(); } catch (eClose) {}
        }
    }
}

function execute(url) {
    var sUrl = String(url).trim();
    syncBaseFromUrl(sUrl);

    var slug = comicSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    var match = extractSlug(sUrl).match(/\/chuong-([0-9.]+)$/i);
    if (!match) return Response.error('Không đọc được số chương từ đường dẫn.');
    var chapNum = match[1];

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

    // Fast Path: Thử gọi REST API trực tiếp (~0.3s)
    var res = sitePost('/api/chapter/loadAll', body, pageUrl);

    if (isRateLimited(res)) {
        return Response.error('[GTT-429] Máy chủ tạm giới hạn tốc độ (Error 1015). Vui lòng chờ 1 phút rồi tải lại.');
    }

    var r = (res && res.result) ? res.result : null;

    if (r && r.codeState === '00') {
        var imgs = imagesFrom(r);
        if (imgs && imgs.length > 0) return Response.success(imgs);
    }

    if (r && r.codeState === '01' && hasToken()) {
        return Response.error('[GTT-TOKEN] Chương ' + chapNum + ': Token cá nhân đã hết hạn hoặc tài khoản không đủ quyền.');
    }

    if (r && r.codeState === '02') {
        return Response.error('[GTT-02] Hết lượt đọc miễn phí cho chương ' + chapNum + '.');
    }

    // Fallback Path: Mượn WebView ngầm để vượt Cloudflare và tải ảnh
    var b = loadAllViaBrowser(pageUrl, comicId, chapNum, nameEn);

    if (b && b.images && b.images.length > 0) {
        return Response.success(b.images);
    }

    if (b && b.json && b.json.result) {
        var br = b.json.result;
        if (br.codeState === '00') {
            var bimgs = imagesFrom(br);
            if (bimgs && bimgs.length > 0) return Response.success(bimgs);
        }
        if (br.codeState === '01') {
            return Response.error(b.hasToken
                ? '[GTT-01] Chương ' + chapNum + ': Đã đăng nhập nhưng chưa đủ quyền đọc chương VIP này.'
                : '[GTT-01] Chương ' + chapNum + ' là chương VIP (🔒). Bấm "Trang nguồn" để đăng nhập.');
        }
        if (br.codeState === '02') {
            return Response.error('[GTT-02] Hết lượt đọc miễn phí cho chương ' + chapNum + '.');
        }
    }

    if (b && b.err === 'CFWALL') {
        return Response.error('[GTT-CF] Cloudflare chặn. Hãy bấm "Trang nguồn" bên dưới một lần để vượt xác minh.');
    }

    if (isLockedChapter(detail.result, chapNum)) {
        return Response.error('[GTT-01] Chương ' + chapNum + ' là chương VIP (🔒). Bấm "Trang nguồn" để đăng nhập.');
    }

    if (r && r.message) {
        return Response.error('[GTT-MSG] ' + r.message);
    }

    if (res && res.messages && res.messages.length > 0) {
        return Response.error('[GTT-ERR] ' + res.messages.join(' '));
    }

    return Response.error('[GTT-EMPTY] Chương ' + chapNum + ' chưa có ảnh trên máy chủ.');
}
