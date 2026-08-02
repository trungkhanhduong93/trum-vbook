const https = require('https');
const fs = require('fs');

async function testTruyenVi() {
    try {
        const t2 = fs.readFileSync('truyenvi_manga.html', 'utf-8');
        const re = /<a title="([^"]+)" href="(\/truyen\/[a-z0-9-]+\/[a-z0-9.-]+\/)">/g;
        let m = re.exec(t2);
        if (!m) {
            console.log('TruyenVI: No chapter link found using toc.js regex');
            return;
        }
        
        const chapUrl = 'https://www.truyenvi.com' + m[2];
        console.log('TruyenVI Chapter:', chapUrl);
        
        const r3 = await fetch(chapUrl, {
            headers: { "Cookie": "age_valid=true" }
        });
        const t3 = await r3.text();
        
        const imgs = t3.match(/src="(https?:\/\/s[0-9]+\.truyenvi\.com\/Library\/[^"]+\/w__[^"]+_page[0-9]+\.[a-z]+)"/g);
        console.log('TruyenVI images regex match:', imgs ? imgs.length : 0);
        if (!imgs) {
            const anyImgs = t3.match(/<img[^>]+src="([^"]+)"/g);
            console.log('TruyenVI any imgs:', anyImgs ? anyImgs.slice(0,5) : 0);
        }
        
    } catch (e) {
        console.error('TruyenVI error:', e);
    }
}

testTruyenVi();
