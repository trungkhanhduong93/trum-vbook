load('config.js');

function noticeUrl(size, lines) {
    var text = '';
    for (var i = 0; i < lines.length; i++) {
        text += (i ? '\n' : '') + lines[i];
    }
    return 'https://placehold.co/' + size + '/111827/f9fafb/png?font=roboto&text=' +
           encodeURIComponent(text);
}

function noticeImage(lines) {
    return [noticeUrl('900x1300', lines)];
}

function execute(url) {
    var sUrl = String(url);
    var slug = comicSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    var match = extractSlug(sUrl).match(/\/chuong-([0-9.]+)$/i);
    if (!match) return Response.error('Không đọc được số chương từ đường dẫn.');
    var chapNum = match[1];

    var jsonDetail = proxyGet('/api/proxy/comic/' + slug);
    if (!jsonDetail || !jsonDetail.status || !jsonDetail.result || !jsonDetail.result.id) {
        return Response.success(noticeImage([
            '[GTT] Khong lay duoc',
            'thong tin truyen',
            '',
            slug
        ]));
    }
    var comicId = String(jsonDetail.result.id);
    var nameEn = jsonDetail.result.nameEn ? String(jsonDetail.result.nameEn) : slug;

    var postData = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);

    // Gọi API loadAll qua Server Proxy
    var res = proxyPost('/api/proxy/chapter/loadAll', postData);

    if (!res || !res.status || !res.result) {
        var why = (res && res.messages && res.messages.length) ? String(res.messages[0]) : '';
        return Response.success(noticeImage([
            '[GTT-API] Chuong ' + chapNum,
            'khong tai duoc',
            '',
            why || 'Proxy hoac site khong tra du lieu.'
        ]));
    }

    var r = res.result;

    if (r.codeState === '01') {
        return Response.success(noticeImage([
            'Chuong ' + chapNum + ' can dang nhap',
            '',
            'Khoa bang tai khoản cua site.'
        ]));
    }
    if (r.codeState === '02') {
        return Response.success(noticeImage([
            '[GTT-02] Het luot doc mien phi'
        ]));
    }
    if (!r.state) {
        return Response.success(noticeImage([
            '[GTT-ERR] Khong tai duoc chuong ' + chapNum,
            '',
            String(r.message || 'Loi tu site.')
        ]));
    }

    var imgs = r.data;
    if (!imgs || !imgs.length) {
        return Response.success(noticeImage([
            '[GTT-EMPTY] Chuong ' + chapNum,
            'chua co anh tren site.'
        ]));
    }

    var images = [];
    for (var i = 0; i < imgs.length; i++) {
        var imgUrl = String(imgs[i] || '').trim();
        if (imgUrl) images.push(imgUrl);
    }

    if (!images.length) {
        return Response.error('Chương ' + chapNum + ' chưa có ảnh.');
    }

    return Response.success(images);
}
