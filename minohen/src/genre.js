load('config.js');

function execute() {
    var res = fetch(API + '/books/tags/list?take=60&category=' + TYPE);
    if (res && res.ok) {
        var data = res.json().data;
        var genres = [];
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            genres.push({
                title: item.name,
                input: '/' + TYPE + '/the-loai/' + item.tagId,
                script: 'gen.js'
            });
        }
        return Response.success(genres);
    }
    return null;
}