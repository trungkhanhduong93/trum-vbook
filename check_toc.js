const fs = require('fs');

const tv = fs.readFileSync('truyenvi_manga.html', 'utf-8');
const tableM = tv.match(/<table[^>]*class="table[^"]*"[^>]*>([\s\S]+?)<\/table>/);
if (tableM) {
    const a = tableM[1].match(/<a[^>]+>/g);
    console.log('TruyenVI a tags:', a ? a.slice(0, 5) : null);
} else {
    console.log('TruyenVI no table');
}
