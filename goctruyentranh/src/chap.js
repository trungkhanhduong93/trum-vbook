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

    // Gọi trực tiếp API backend qua HTTP thuần
    var res = sitePost('/api/chapter/loadAll', body, pageUrl);

    if (isRateLimited(res)) {
        return Response.error('[GTT-429] Máy chủ tạm giới hạn tốc độ (Error 1015). Vui lòng chờ 1 phút rồi tải lại.');
    }

    var r = (res && res.result) ? res.result : null;

    if (r && r.codeState === '00') {
        var imgs = imagesFrom(r);
        if (imgs && imgs.length > 0) return Response.success(imgs);
    }

    if (r && r.codeState === '01') {
        if (hasToken()) {
            return Response.error('[GTT-TOKEN] Chương ' + chapNum + ': Token cá nhân đã hết hạn hoặc tài khoản không đủ quyền mở chương VIP này.');
        } else {
            return Response.error('[GTT-01] Chương ' + chapNum + ' là chương VIP (🔒). Vui lòng cập nhật token trong config.js để đọc chương này.');
        }
    }

    if (r && r.codeState === '02') {
        return Response.error('[GTT-02] Hết lượt đọc miễn phí cho chương ' + chapNum + '.');
    }

    return Response.error('[GTT-EMPTY] Chương ' + chapNum + ' chưa có ảnh trên máy chủ.');
}
