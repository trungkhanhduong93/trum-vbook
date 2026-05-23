load("config.js");

function execute() {
    var res = apiFetch("/genres");
    if (!res || !res.ok) return Response.success([]);

    var genres = [];
    try {
        var data = JSON.parse(res.text());
        if (!data || !data.length) return Response.success([]);
        for (var i = 0; i < data.length; i++) {
            var g = data[i];
            if (!g || !g.id || !g.name) continue;
            genres.push({
                title: g.name,
                input: "/manga?genre_id=" + g.id,
                script: "gen.js"
            });
        }
    } catch (e) {
        return Response.success([]);
    }

    return Response.success(genres);
}
