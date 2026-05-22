load('config.js');

function execute(url) {
    let bookId = url.split('/').pop()
    let response = fetch(`${API}/chapters/${bookId}?order=desc&take=5000`);
    if(response.ok) {
        const data = response.json()
        const chapters = data.chapters
        const list = chapters.map(book => {
            return {
                name: `Chapter ${book.num}`,
                url: `${url}/chapter-${book.num}-${book.chapterNumber}`,
                host: BASE_URL
            }
        }).reverse()

        return Response.success(list);
    }

    return null;
}