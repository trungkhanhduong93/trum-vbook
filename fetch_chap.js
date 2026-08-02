const https = require('https');
const fs = require('fs');

async function main() {
    // TruyenVI
    try {
        const url = 'https://www.truyenvi.com/truyen/toi-duoc-giao-nhiem-vu-dit-het-gai-chung-cu/toi-duoc-giao-nhiem-vu-dit-het-gai-chung-cu-10/';
        const r = await fetch(url, { headers: { "Cookie": "age_valid=true" } });
        const html = await r.text();
        fs.writeFileSync('truyenvi_chap.html', html);
        
        let m;
        // Old regex
        const re = /src="(https?:\/\/s[0-9]+\.truyenvi\.com\/Library\/[^"]+\/w__[^"]+_page[0-9]+\.[a-z]+)"/g;
        let c = 0;
        while((m = re.exec(html)) !== null) c++;
        console.log('TruyenVI old regex count:', c);
        
        // New try: any truyenvi image link
        const anyImgs = html.match(/src="([^"]*truyenvi\.com[^"]*)"/g);
        console.log('TruyenVI any truyenvi imgs:', anyImgs ? anyImgs.slice(0,3) : 0);
        
        // New try: any image link
        const allImgs = html.match(/src="([^"]*)"/g);
        // let's filter out common things
        const filtered = allImgs ? allImgs.filter(s => s.indexOf('.jpg') > 0 || s.indexOf('.webp') > 0).slice(0, 3) : [];
        console.log('TruyenVI all image src ending in jpg/webp:', filtered);
    } catch(e) { console.log('Truyenvi err', e) }
}
main();
