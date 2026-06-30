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

    // Metruyen
    try {
        const url = 'https://metruyen18.net/truyen/one-piece-series-truyen-ngan/chap-9-uta-bieu-dien-cuoi-ngua';
        const r = await fetch(url);
        const html = await r.text();
        fs.writeFileSync('metruyen_chap.html', html);
        
        const contentM = html.match(/class="read-content"[^>]*>([\s\S]+?)(?:<div class="(?:bsx-item|panel-manga-chapter|chapter-navigation))/);
        const section = contentM ? contentM[1] : html;
        
        const re = /(?:data-src|src)="(https?:\/\/[^"]+\.(?:webp|jpg|jpeg|png)[^"]*)"/g;
        let c = 0;
        let m;
        while((m = re.exec(section)) !== null) c++;
        console.log('Metruyen old regex count:', c);
        
        const re2 = /(?:data-src|src)="(\/\/[^"]+\.(?:webp|jpg|jpeg|png)[^"]*)"/g;
        let c2 = 0;
        while((m = re2.exec(section)) !== null) c2++;
        console.log('Metruyen old regex 2 count:', c2);
        
        const all = section.match(/<img[^>]+>/g);
        console.log('Metruyen any img tags in section:', all ? all.slice(0,3) : 0);
    } catch(e) { console.log('Metruyen err', e) }
}
main();
