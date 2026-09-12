/**
 * Cloudflare Worker / Edge Function: CuuTruyen DRM v4 Image Descrambler
 * 
 * Nhận request:
 *   GET /?url=<scrambled_image_url>&drm=<drm_data>&w=<width>&h=<height>
 * 
 * Tải ảnh từ storage-bravo.cuutruyen.net, giải mã DRM v4, hoán vị dải ngang và
 * trả về ảnh JPEG hoàn chỉnh kèm Cache-Control lâu dài trên CDN Cloudflare.
 */

import { Buffer } from 'node:buffer';
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
import jpeg from 'jpeg-js';

const DRM_KEY = '3141592653589793';

function decodeDrm(drmBase64) {
  if (!drmBase64) return null;
  const clean = drmBase64.replace(/[\r\n\s]/g, '');
  // Base64 decode
  const rawStr = atob(clean);
  let layout = '';
  for (let i = 0; i < rawStr.length; i++) {
    const b = rawStr.charCodeAt(i);
    const k = DRM_KEY.charCodeAt(i % DRM_KEY.length);
    layout += String.fromCharCode(b ^ k);
  }
  if (!layout.startsWith('#v4|')) return null;
  return layout;
}

export default {
  async fetch(request, env, ctx) {
    const reqUrl = new URL(request.url);
    const targetUrl = reqUrl.searchParams.get('url');
    const drmData = reqUrl.searchParams.get('drm');

    if (!targetUrl) {
      return new Response('Missing "url" parameter', { status: 400 });
    }

    // Kiểm tra cache của Cloudflare CDN
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Nếu không có DRM data -> fetch và trả về thẳng
    if (!drmData) {
      const resp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://www.cuutruyen.net/'
        }
      });
      return resp;
    }

    const layout = decodeDrm(drmData);
    if (!layout) {
      return new Response('Invalid DRM data format', { status: 400 });
    }

    // Tải ảnh gốc từ CDN
    const imgResp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.cuutruyen.net/'
      }
    });

    if (!imgResp.ok) {
      return new Response(`Failed to fetch source image: ${imgResp.status}`, { status: 502 });
    }

    const imgBuffer = await imgResp.arrayBuffer();

    try {
      // Decode JPEG
      const decoded = jpeg.decode(new Uint8Array(imgBuffer), { useTArray: true });
      const w = decoded.width;
      const h = decoded.height;
      const rowSize = w * 4;
      const srcBuffer = decoded.data;
      const dstBuffer = new Uint8Array(w * h * 4);

      // Descramble
      let sy = 0;
      const segments = layout.split('|').slice(1);
      for (const seg of segments) {
        const parts = seg.split('-');
        if (parts.length !== 2) continue;
        const dy = parseInt(parts[0], 10);
        const partH = parseInt(parts[1], 10);
        if (isNaN(dy) || isNaN(partH) || partH <= 0) continue;

        const srcStart = sy * rowSize;
        const dstStart = dy * rowSize;
        const copyLen = partH * rowSize;

        if (srcStart + copyLen <= srcBuffer.length && dstStart + copyLen <= dstBuffer.length) {
          dstBuffer.set(srcBuffer.subarray(srcStart, srcStart + copyLen), dstStart);
        }
        sy += partH;
      }

      // Encode lại thành JPEG chất lượng 85
      const encoded = jpeg.encode({ data: dstBuffer, width: w, height: h }, 85);

      const response = new Response(encoded.data, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': String(encoded.data.length),
          'Cache-Control': 'public, max-age=2592000, immutable',
          'Access-Control-Allow-Origin': '*'
        }
      });

      // Lưu cache Edge
      if (ctx && ctx.waitUntil) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
      return response;

    } catch (err) {
      return new Response('Error processing image: ' + (err.message || err), { status: 500 });
    }
  }
};
