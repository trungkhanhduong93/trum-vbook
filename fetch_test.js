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

async function testMetruyen() {
    try {
        const t2 = fs.readFileSync('metruyen_manga.html', 'utf-8');
        const re = /href="((?:https?:)?\/\/metruyen18\.net\/truyen\/[^"]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)</g;
        let m = re.exec(t2);
        if (!m) {
            console.log('Metruyen: No chapter link found using toc.js regex');
            
            // Try fallback
            const fallback = t2.match(/href="([^"]+)"/g).slice(0, 50);
            // console.log("Some hrefs:", fallback);
            return;
        }
        
        let chapUrl = m[1];
        if (chapUrl.startsWith('//')) chapUrl = 'https:' + chapUrl;
        console.log('Metruyen Chapter:', chapUrl);
        
        const r3 = await fetch(chapUrl);
        const t3 = await r3.text();
        
        const contentM = t3.match(/class="read-content"[^>]*>([\s\S]+?)(?:<div class="(?:bsx-item|panel-manga-chapter|chapter-navigation))/);
        const section = contentM ? contentM[1] : t3;
        
        const imgs = section.match(/(?:data-src|src)="(https?:\/\/[^"]+\.(?:webp|jpg|jpeg|png)[^"]*)"/g);
        console.log('Metruyen images regex match:', imgs ? imgs.length : 0);
        
        if (!imgs) {
            const anyImgs = section.match(/<img[^>]+(?:src|data-src)="([^"]+)"/g);
            console.log('Metruyen any imgs in section:', anyImgs ? anyImgs.slice(0,5) : 0);
            
            // Look for any image at all in the whole HTML
            const allImgs = t3.match(/<img[^>]+(?:src|data-src)="([^"]+)"/g);
            console.log('Metruyen all imgs:', allImgs ? allImgs.slice(0,5) : 0);
        } else {
             let ok = 0;
             for (const mg of imgs) {
                 const link = mg.match(/="(.*)"/)[1];
                 if (link.indexOf("/dcn/") !== -1 && link.indexOf("/images/covers/") === -1) {
                     ok++;
                 }
             }
             console.log('Metruyen valid chapter images:', ok);
             if (ok === 0) {
                 console.log('Metruyen all matched imgs:', imgs.slice(0, 5));
             }
        }
    } catch (e) {
        console.error('Metruyen error:', e);
    }
}

testTruyenVi().then(testMetruyen);
