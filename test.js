const fs = require('fs');
const html = fs.readFileSync('truyenvi_chap.html', 'utf8');
const re = /src="(https?:\/\/s[0-9]+\.truyenvi\.com\/Library\/[^"]+_page[0-9]+\.(?:jpg|png|webp|jpeg))"/g;
let m, c=0;
while((m=re.exec(html))!==null){
    c++;
    if(c<=3) console.log(m[1]);
}
console.log('Count:', c);
