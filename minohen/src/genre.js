load('config.js');

function execute() {
    var data = jsonGet(API + '/books/tags?take=60&category=' + TYPE);
    if (!data) {
        data = jsonGet(API + '/books/tags/list?take=60&category=' + TYPE);
    }
    if (data && data.data) {
        var items = (data.data.tags && data.data.tags.length) ? data.data.tags : (data.data.length ? data.data : []);
        var genres = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item && item.name && item.tagId) {
                genres.push({
                    title: item.name,
                    input: '/' + TYPE + '/the-loai/' + item.tagId,
                    script: 'gen.js'
                });
            }
        }
        if (genres.length) return Response.success(genres);
    }
    return null;
}