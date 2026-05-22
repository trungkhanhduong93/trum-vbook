load('config.js');

function execute() {
    const res = fetch(`${API}/books/tags/list?take=60&category=${TYPE}`)
    if(res.ok) {
        const data = res.json().data
        const genres = data.map(item => ({
            title: item.name,
            input: `/${TYPE}/the-loai/${item.tagId}`,
            script: 'gen.js'       
        }))

        return Response.success(genres)
    }
}