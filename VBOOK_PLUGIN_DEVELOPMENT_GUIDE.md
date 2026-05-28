# Vbook Plugin Development Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Vbook Plugin Architecture](#vbook-plugin-architecture)
3. [API Reverse Engineering](#api-reverse-engineering)
4. [Pure-JavaScript Cryptography](#pure-javascript-cryptography)
5. [Plugin Script Types](#plugin-script-types)
6. [Tcomic Case Study](#tcomic-case-study)
7. [Rhino Sandbox Limitations](#rhino-sandbox-limitations)
8. [Image URL Handling](#image-url-handling)
9. [Testing & Verification](#testing--verification)
10. [Common Issues & Solutions](#common-issues--solutions)
11. [Best Practices](#best-practices)

---

## Introduction

This guide consolidates comprehensive knowledge and practical experience from developing the Tcomic Vbook plugin. It covers essential techniques for building robust comic/manga plugins including API reverse engineering, pure-JavaScript cryptography implementation, Rhino sandbox workarounds, and best practices for plugin development.

**Key Skills Covered:**
- REST API reverse-engineering via minified JavaScript inspection
- Implementing cryptographic signing without Java/native access
- Managing Vbook plugin architecture and script patterns
- Handling authentication schemes with hourly-windowed timestamps
- Troubleshooting Rhino sandbox limitations
- Optimizing image serving and CDN handling

---

## Vbook Plugin Architecture

### Plugin Structure

A Vbook plugin consists of:
- **plugin.json**: Plugin metadata and registry entry
- **src/config.js**: Shared configuration, API helpers, and crypto utilities
- **src/*.js**: Six core script files (home, genre, detail, search, toc, chap)

### plugin.json Structure

```json
{
  "metadata": {
    "name": "Plugin Name",
    "author": "author_id",
    "version": 1,
    "source": "https://example.com",
    "regexp": "regex_pattern_for_urls",
    "description": "Plugin description",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "comic"
  },
  "script": {
    "home": "home.js",
    "genre": "genre.js",
    "detail": "detail.js",
    "search": "search.js",
    "toc": "toc.js",
    "chap": "chap.js"
  }
}
```

### Configuration Pattern

**config.js** provides:

1. **Site Configuration**
   ```javascript
   var SITE_URL = 'https://example.com';
   var API_URL = 'https://api.example.com';
   var LIMIT = 24;  // Items per page
   ```

2. **Authentication Secrets** (if API signing required)
   ```javascript
   var SECRET1 = 'primary_secret_key';
   var SECRET2 = 'secondary_secret_key';
   var BE = {  // Backend-specific salts per endpoint
     "/api/endpoint": "endpoint_salt_value"
   };
   ```

3. **Shared Utilities**
   - HTTP request builders with headers
   - Response mappers
   - Status/link formatters
   - API client functions

### Response Format

All Vbook scripts must return responses via the Response object:

```javascript
// Success response with data
return Response.success(data);

// Success response with pagination
return Response.success(list, nextPageToken);

// Failure (null data)
return null;
```

---

## API Reverse Engineering

### Strategy: JavaScript Source Inspection

When a website uses JavaScript-based API authentication, the algorithm is often visible in minified frontend bundles.

#### Step 1: Identify API Endpoints

Inspect network traffic or search for patterns:
- Look for `fetch()` or `xhr` calls
- Search for `/api/` patterns in source files
- Check `Content-Type: application/json` requests

#### Step 2: Extract Authentication Logic

1. Find the request signing code in minified JavaScript bundles
2. Look for crypto operations, parameter encoding, or header generation
3. Identify constants (salts, secrets, keys)
4. Trace parameter construction and canonicalization

**Example: Tcomic API Analysis**

The Tcomic plugin sign requests using:
- Hourly-windowed timestamps (milliseconds / 3600000 * 3600000)
- Endpoint-specific salts from a constants map
- Sorted JSON parameter canonicalization
- AES-256-CBC encryption with OpenSSL EVP_BytesToKey derivation

Extracted from inspecting `utils-vendor-a7804ee1.js`:

```javascript
// Signing algorithm structure:
// 1. Get endpoint salt from BE constant map
// 2. Calculate hour window: Math.floor(Date.now() / 3600000) * 3600000
// 3. Build plain: salt + "-" + path + "-" + SECRET1 + "-" + hour + "-" + sortedJSON(params)
// 4. Encrypt via AES-256-CBC (EVP_BytesToKey derivation)
// 5. Base64 encode and send as x-request-id header
```

### Reverse-Engineering Checklist

- [ ] Identify all API endpoints and their parameters
- [ ] Extract all constant values (salts, keys, secrets)
- [ ] Determine request signing algorithm if present
- [ ] Test endpoints with curl/Postman to verify parameters
- [ ] Document response schema for each endpoint
- [ ] Identify pagination mechanisms (limit, offset, page, cursor)
- [ ] Check for rate limiting or time-based constraints

---

## Pure-JavaScript Cryptography

### Problem Context

The Vbook Rhino sandbox does not expose Java crypto packages (`java.security`, `javax.crypto`). This blocks standard JCE implementations.

**Solution:** Implement cryptography in pure JavaScript (no Java access).

### AES-256-CBC + OpenSSL EVP_BytesToKey Implementation

The implementation provides `CryptoJS.AES.encrypt(text, passphrase)` compatible output.

#### Core Functions

**1. UTF-8 to Bytes Conversion**

```javascript
function _utf8ToBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) {
            bytes.push(c);
        } else if (c < 0x800) {
            bytes.push(0xC0 | (c >>> 6), 0x80 | (c & 0x3F));
        } else if (c < 0xD800 || c >= 0xE000) {
            bytes.push(0xE0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3F), 0x80 | (c & 0x3F));
        } else {
            // Handle surrogate pairs (astral planes)
            i++;
            var cp = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
            bytes.push(0xF0 | (cp >>> 18), 0x80 | ((cp >>> 12) & 0x3F),
                       0x80 | ((cp >>> 6) & 0x3F), 0x80 | (cp & 0x3F));
        }
    }
    return bytes;
}
```

**2. Base64 Encoding**

```javascript
var _B64A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function _base64Encode(bytes) {
    var out = "";
    var i = 0;
    var n = bytes.length;
    
    // Encode 3 bytes at a time
    while (i + 3 <= n) {
        var x = (bytes[i] << 16) | (bytes[i+1] << 8) | bytes[i+2];
        out += _B64A.charAt((x >>> 18) & 63) + _B64A.charAt((x >>> 12) & 63)
             + _B64A.charAt((x >>> 6) & 63) + _B64A.charAt(x & 63);
        i += 3;
    }
    
    // Handle remaining bytes with padding
    var rem = n - i;
    if (rem === 1) {
        var x1 = bytes[i] << 16;
        out += _B64A.charAt((x1 >>> 18) & 63) + _B64A.charAt((x1 >>> 12) & 63) + "==";
    } else if (rem === 2) {
        var x2 = (bytes[i] << 16) | (bytes[i+1] << 8);
        out += _B64A.charAt((x2 >>> 18) & 63) + _B64A.charAt((x2 >>> 12) & 63)
             + _B64A.charAt((x2 >>> 6) & 63) + "=";
    }
    return out;
}
```

**3. MD5 Hash Implementation**

Pure JavaScript MD5 (RFC 1321) with:
- 64-round algorithm with S-box and K constants
- Little-endian 32-bit word operations
- Message padding and length encoding

Key functions:
- `_md5(bytes)` - Returns 16-byte hash

**4. AES-256 Encryption**

Implements AES encryption with:
- 256-bit key expansion (14 rounds)
- S-box substitution
- Galois field operations (gmul2)
- CBC mode with PKCS7 padding

Key functions:
- `_aesKeyExpand256(key)` - Expand 32-byte key to round keys
- `_aesEncryptBlock(input, w)` - Encrypt single 16-byte block
- `_aesCbcPkcs7Encrypt(plainBytes, key, iv)` - CBC encryption with padding

**5. EVP_BytesToKey (OpenSSL Key Derivation)**

Derives key+IV from passphrase and salt:

```javascript
function _evpKDF(passBytes, saltBytes, totalBytes) {
    var derived = [];
    var prev = [];
    
    // Iteratively hash: MD5(prev + pass + salt)
    while (derived.length < totalBytes) {
        var input = prev.concat(passBytes).concat(saltBytes);
        prev = _md5(input);
        derived = derived.concat(prev);
    }
    
    return derived.slice(0, totalBytes);
}
```

For AES-256-CBC, derive 48 bytes total:
- Bytes 0-31: Encryption key
- Bytes 32-47: Initialization vector (IV)

**6. Complete Encryption Function**

```javascript
function aesEncryptOpenSSL(plainText, passphrase) {
    // Generate random 8-byte salt
    var salt = _randBytes(8);
    
    // Convert to bytes
    var passBytes = _utf8ToBytes(passphrase);
    
    // Derive key+IV via EVP_BytesToKey
    var derived = _evpKDF(passBytes, salt, 48);
    var key = derived.slice(0, 32);
    var iv = derived.slice(32, 48);
    
    // Encrypt plaintext
    var plainBytes = _utf8ToBytes(plainText);
    var encrypted = _aesCbcPkcs7Encrypt(plainBytes, key, iv);
    
    // Format: "Salted__" + salt + ciphertext, then Base64
    var prefix = _utf8ToBytes("Salted__");
    var full = prefix.concat(salt).concat(encrypted);
    
    return _base64Encode(full);
}
```

### Verification

Test byte-exact compatibility with CryptoJS via Node.js:

```javascript
// Node.js verification (CryptoJS)
const CryptoJS = require('crypto-js');
const result = CryptoJS.AES.encrypt(
    "test message",
    "passphrase"
).toString();

// Result format: "Salted__" + base64(salt + ciphertext)
```

Then verify Vbook implementation produces identical output.

---

## Plugin Script Types

### 1. home.js

**Purpose:** Define homepage categories/sections

**Function Signature:**
```javascript
function execute() {
    // Return array of category objects
    return Response.success(categories);
}
```

**Return Format:**
```javascript
[
    {
        title: "Category Name",      // Display name
        input: "/api/endpoint",       // Passed to gen.js
        script: "gen.js"              // Handler script
    }
]
```

**Tcomic Example:**
```javascript
function execute() {
    return Response.success([
        {title: "Mới Cập Nhật", input: "/api/web/comic/recent-update-comics", script: "gen.js"},
        {title: "Truyện Mới", input: "/api/web/comic/new-comics", script: "gen.js"},
        {title: "Đang Hot", input: "/api/web/comic/trending-comics", script: "gen.js"},
        // ... more categories
    ]);
}
```

### 2. genre.js

**Purpose:** Fetch dynamic genre/category list

**Function Signature:**
```javascript
function execute(url) {
    // Fetch genres/categories from API
    return Response.success(genreList);
}
```

**Return Format:**
```javascript
[
    {
        title: "Genre Name",
        input: "/api/genres/genre-slug",
        script: "gen.js"
    }
]
```

**Pattern:**
1. Extract genre slug/id from URL
2. Call API to fetch full genre list
3. Include fallback static list if API fails
4. Format as navigation items

### 3. gen.js

**Purpose:** Generic pagination handler (reusable for any list API endpoint)

**Function Signature:**
```javascript
function execute(input, page) {
    // input: API endpoint path
    // page: current page (defaults to '1')
    return Response.success(list, nextPage);
}
```

**Pattern:**
1. Make API request with pagination params (page, limit)
2. Map response items to comic cards
3. Return next page token if more items exist
4. Reusable across all list-type endpoints

### 4. detail.js

**Purpose:** Fetch comic detail page (title, author, genres, status, etc.)

**Function Signature:**
```javascript
function execute(url) {
    // Extract comic ID from URL
    return Response.success(detailObject);
}
```

**Return Format:**
```javascript
{
    name: "Comic Title",
    cover: "image_url",
    host: SITE_URL,
    author: "Author Name",
    description: "Comic description",
    detail: "Info formatted as <br>-separated string",
    ongoing: true|false,
    genres: [
        {title: "Genre Name", input: "/api/...", script: "gen.js"}
    ]
}
```

**Key Responsibilities:**
- Parse comic ID from URL
- Fetch full comic metadata
- Format genres as genre filter links
- Compile info fields (author, status, views, followers, chapters)
- Distinguish completed vs ongoing status

### 5. search.js

**Purpose:** Full-text search

**Function Signature:**
```javascript
function execute(key, page) {
    // key: search query
    // page: current page
    return Response.success(results, nextPage);
}
```

**Pattern:**
1. Call `/api/web/comic/search` with query and pagination
2. Map results to comic cards
3. Return next page token for pagination

### 6. toc.js (Table of Contents)

**Purpose:** Fetch chapter list for a comic

**Function Signature:**
```javascript
function execute(url) {
    // Extract comic ID from URL
    return Response.success(chapters);
}
```

**Return Format:**
```javascript
[
    {
        name: "Chapter Name/Number",
        url: "chapter_url_or_api_path",
        host: SITE_URL
    }
]
```

**Key Points:**
- Chapters often need reversal (API returns newest first)
- Include full chapter metadata (chapter ID, number, name)
- URL format: either relative path or full API endpoint

### 7. chap.js

**Purpose:** Fetch chapter images

**Function Signature:**
```javascript
function execute(url) {
    // Extract chapter ID from URL
    return Response.success(imageUrls);
}
```

**Return Format:** Array of image URLs
```javascript
[
    "https://cdn.example.com/image1.jpg",
    "https://cdn.example.com/image2.jpg"
]
```

**Critical Patterns:**
- Remove duplicate image URLs
- Handle protocol-relative URLs (`//cdn...` → `https://cdn...`)
- Return **bare URLs only** (no Referer suffixes or headers)
- Ensure images are deduplicated via object tracking

---

## Tcomic Case Study

### Plugin Overview

**Source:** https://tcomicfanqq.com  
**API Base:** https://api.tcomicfanqq.com  
**Status:** Fully functional (v3)

### Architecture

**Request Signing:**
- Uses AES-256-CBC + EVP_BytesToKey
- Hourly-windowed timestamps
- Endpoint-specific salts
- Sorted JSON parameter canonicalization
- Signature in `x-request-id` header

### Core API Endpoints

```
GET /api/web/comic/info/{id}
GET /api/web/comic/search?q=key&page=1&limit=24
GET /api/web/comic/chapters/{chapId}
GET /api/web/comic/genres
GET /api/web/comic/recent-update-comics
GET /api/web/comic/new-comics
GET /api/web/comic/trending-comics
(+ 20+ other endpoints)
```

### Configuration

```javascript
var SITE_URL = 'https://tcomicfanqq.com';
var API_URL = 'https://api.tcomicfanqq.com';
var SECRET1 = 'iHbS0oIGYjVaLwvjynBpjQFtc5YCCGX6';
var SECRET2 = 'sTUSpQjxBQIW3EdsadsauVEo6ZGmIEp6zxJgJV';

var BE = {
    "/api/web/comic/info": "zQ7hB5vC3kL9pM2n",
    "/api/web/comic/chapters": "tR8cX4vB2nM6pH9q",
    "/api/web/comic/search": "qM5cY9nJ3wS7tE4h",
    // ... 39 total endpoints
};
```

### Request Signing Algorithm

```javascript
function signPath(path, params) {
    // 1. Remove numeric IDs from path (e.g., /info/123 → /info)
    var sigPath = path.replace(/\/\d+(?=\/|$)/g, "");
    
    // 2. Get endpoint-specific salt
    var salt = BE.hasOwnProperty(sigPath) ? BE[sigPath] : "undefined";
    
    // 3. Calculate hour window
    var hourMs = Math.floor(new Date().getTime() / 3600000) * 3600000;
    
    // 4. Build plaintext
    var plain = salt + "-" + sigPath + "-" + SECRET1 + "-" + hourMs 
              + "-" + _sortedJSON(params || {});
    
    // 5. Encrypt and return
    return aesEncryptOpenSSL(plain, SECRET2);
}
```

### Parameter Canonicalization

Sorted JSON format (alphabetically sorted keys):
```javascript
function _sortedJSON(params) {
    var keys = [];
    for (var k in params) {
        if (params.hasOwnProperty(k)) keys.push(k);
    }
    keys.sort();
    
    var parts = [];
    for (var i = 0; i < keys.length; i++) {
        var v = params[keys[i]];
        parts.push(JSON.stringify(keys[i]) + ":" + JSON.stringify(String(v)));
    }
    return "{" + parts.join(",") + "}";
}
```

Example: `{q: "abc", page: 1, limit: 24}` → `{"limit":"24","page":"1","q":"abc"}`

### Comic Card Mapping

```javascript
function mapComicCard(c) {
    var slug = c.slug || "";
    var id = c.id || "";
    if (!slug || !id) return null;
    
    var desc = "";
    if (c.last_chapter && c.last_chapter.name) {
        desc = c.last_chapter.name;  // Latest chapter
    } else if (c.updated_at) {
        desc = c.updated_at;  // Last updated time
    }
    
    return {
        name: c.title || "",
        link: "/truyen-tranh/" + slug + "-" + id,
        description: desc,
        cover: c.thumbnail || "",
        host: SITE_URL
    };
}
```

### Response Patterns

**Comic Info Response:**
```json
{
    "code": 0,
    "data": {
        "id": 12345,
        "title": "Comic Title",
        "slug": "comic-title",
        "description": "Comic description",
        "thumbnail": "https://...",
        "status": "COMPLETED|ONGOING",
        "authors": "Author Name",
        "total_views": 10000,
        "followers": 500,
        "chapters": [
            {"id": 1, "name": "Chapter 1"},
            {"id": 2, "name": "Chapter 2"}
        ],
        "genres": [
            {"name": "Action", "slug_genre": "action"},
            {"name": "Adventure", "slug_genre": "adventure"}
        ],
        "other_names": ["Alt Name 1", "Alt Name 2"]
    }
}
```

**Chapter Images Response:**
```json
{
    "code": 0,
    "data": {
        "images": [
            {"src": "https://cdn.example.com/img1.jpg"},
            {"src": "https://cdn.example.com/img2.jpg"}
        ]
    }
}
```

---

## Rhino Sandbox Limitations

### The Java Crypto Problem

**Issue:** Vbook's Rhino sandbox does not expose Java packages:
```javascript
// ❌ This throws ReferenceError in Vbook Rhino
var cipher = Java.type("javax.crypto.Cipher");
var md = Packages.java.security.MessageDigest;
```

**Symptom:** API calls fail silently, returning `null`, causing "không thể tải nội dung" errors.

### Solutions

#### Solution 1: Pure-JavaScript Implementation ✅ (RECOMMENDED)

Implement cryptography algorithms entirely in JavaScript:
- MD5 hashing (500+ lines)
- AES-256 block cipher (300+ lines)
- OpenSSL EVP_BytesToKey KDF (20 lines)
- Base64 encoding (20 lines)

**Advantages:**
- Works in any environment (Rhino, browser, Node.js)
- Verifiable against standard test vectors
- Maintainable and debuggable

**Disadvantages:**
- Large code footprint (~250+ lines)
- Slightly slower than native crypto
- Requires careful byte handling

#### Solution 2: Fallback to Plaintext ❌ (IF NOT SIGNING)

If the API doesn't require authentication:
```javascript
// No signing needed
function apiGet(path, params) {
    var url = API_URL + path + buildQS(params);
    var s = Http.get(url).headers(REQ_HEADERS()).string();
    return JSON.parse(s);
}
```

### Workarounds & Best Practices

**1. Check for Java Access Gracefully**
```javascript
function hasJavaCrypto() {
    try {
        Java.type("javax.crypto.Cipher");
        return true;
    } catch (e) {
        return false;
    }
}

// Use pure JS if Java unavailable
```

**2. Pre-compute Crypto Tables**
```javascript
// S-box, RCON, K constants should be defined once at load time
// Not recomputed per encryption
```

**3. Optimize Hot Paths**
```javascript
// Avoid repeated object creation in loops
// Cache derived keys if same passphrase used multiple times
```

**4. Test Output Compatibility**
```javascript
// Unit test against known good values:
// - MD5 test vectors from RFC
// - AES test vectors from NIST
// - EVP_BytesToKey against OpenSSL
```

---

## Image URL Handling

### The Referer Issue

**Problem Discovered in v2:** Images were failing to load ("gãy ảnh").

**Initial Hypothesis:** CDN might require `Referer` header.

**Solution Attempted:** Add `|Referer=` suffix to URLs
```javascript
// ❌ This doesn't work (Vbook ImageLoader doesn't parse |Referer=)
url = url + "|Referer=" + SITE_URL;
```

**Root Cause:** Vbook ImageLoader expects bare URLs. The `|Referer=` syntax is not a standard URL format.

### Correct URL Format

**Return bare URLs only:**
```javascript
function execute(url) {
    var p = parseUrl(url);
    var json = apiGet("/api/web/comic/chapters/" + p.chapterId, params);
    
    var images = json.data.images;
    var data = [];
    var seen = {};
    
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var link = img && img.src ? String(img.src).trim() : "";
        
        if (!link) continue;
        
        // Convert protocol-relative to HTTPS
        if (link.indexOf("//") === 0) {
            link = "https:" + link;
        }
        
        // Deduplicate
        if (!seen[link]) {
            seen[link] = true;
            data.push(link);  // ✅ Return bare URL
        }
    }
    
    return Response.success(data);
}
```

### URL Deduplication Pattern

Prevent duplicate images by tracking with object:
```javascript
var seen = {};
for (var i = 0; i < images.length; i++) {
    var link = images[i].src;
    if (!seen[link]) {
        seen[link] = true;
        data.push(link);
    }
}
```

### CDN Considerations

**Common CDN Behaviors:**
- Most CDNs don't validate `Referer` for public content
- Protocol-relative URLs (`//cdn...`) must be converted to `https://`
- S3/Wasabi CDNs typically allow public read without authentication
- Avoid adding custom headers—Vbook ImageLoader won't parse them

**Testing:**
```bash
# Test CDN directly
curl -i "https://cdn.example.com/image.jpg"

# Should return 200 OK without authentication
# Test with and without Referer header (both should work)
curl -H "Referer: https://example.com" "https://cdn.example.com/image.jpg"
```

---

## Testing & Verification

### Unit Testing Approach

#### 1. Crypto Function Testing

Test pure-JS implementations against standard vectors:

```javascript
// Test MD5
function testMD5() {
    var input = _utf8ToBytes("");
    var hash = _md5(input);
    var expected = [0xd4,0x1d,0x8c,0xd9,0x8f,0x00,0xb2,0x04,
                    0xe9,0x80,0x09,0x98,0xec,0xf8,0x42,0x7e];
    // Verify each byte matches
}

// Test AES-256-CBC
function testAES() {
    // Use known good CryptoJS output as reference
    var plaintext = "test message";
    var passphrase = "passphrase";
    var result = aesEncryptOpenSSL(plaintext, passphrase);
    
    // Decrypt with Node.js/CryptoJS to verify
}
```

#### 2. API Endpoint Testing

Test each endpoint with curl to verify:

```bash
# Get auth signature (compute in Node.js or Python)
SIGNATURE=$(node -e "
  const crypto = require('crypto');
  // Compute AES signature
  console.log(signature);
")

# Test endpoint
curl -X GET \
  "https://api.tcomicfanqq.com/api/web/comic/info/12345" \
  -H "x-request-id: $SIGNATURE" \
  -H "User-Agent: Mozilla/5.0..."
```

#### 3. Full Integration Testing

Once plugin is loaded in Vbook:

**Test Cases:**
1. **Home Page Load** - Verify 11 categories appear
2. **Genre Browsing** - Click genre → verify comics load
3. **Comic Detail** - Click comic → check title, author, genres, chapters
4. **Search** - Search for "manga" → verify results
5. **Chapter List** - Verify chapters in correct order
6. **Image Loading** - Open chapter → verify all images load without errors
7. **Pagination** - Verify next page loads more items

### Debugging Checklist

**If content doesn't load:**
- [ ] Check API response status (`json.code === 0`)
- [ ] Verify request signature is being sent
- [ ] Confirm timestamp/salt are correct
- [ ] Test endpoint with curl using same signature
- [ ] Check URL pattern matching in plugin.json
- [ ] Verify comic ID/chapter ID extraction

**If images break:**
- [ ] Verify image URLs are valid (curl test)
- [ ] Check for duplicate URLs
- [ ] Ensure no `|Referer=` suffix is added
- [ ] Confirm `https://` protocol for protocol-relative URLs
- [ ] Test CDN directly (may have rate limiting)

---

## Common Issues & Solutions

### Issue 1: "không thể tải nội dung" (Cannot Load Content)

**Symptom:** Home page loads but category list is empty. Comic detail page shows error.

**Root Cause:** API authentication failing or returning null response.

**Diagnosis:**
```javascript
// Add debugging in config.js apiGet function
var s = Http.get(url).headers(headers).string();
if (!s) {
    // API returned empty response
    // Check: 1) Signature format, 2) Endpoint salt, 3) Timestamp
    return null;
}
```

**Solutions:**
1. Verify signature algorithm matches API expectations
   - Test with curl using manually-computed signature
   - Compare hourly timestamp calculation
   - Check parameter canonicalization order

2. Verify endpoint salts are correct
   - Extract from minified JavaScript again
   - Verify all 39+ endpoints have correct salt values

3. Test authentication step-by-step
   ```bash
   # 1. Test without signature (see if endpoint requires auth)
   curl "https://api.tcomicfanqq.com/api/web/comic/new-comics?limit=24&page=1"
   
   # 2. Compute signature and test
   curl -H "x-request-id: SIGNATURE" "..."
   ```

### Issue 2: "gãy ảnh" (Broken Images)

**Symptom:** Chapter loads but images show as broken/don't render.

**Root Cause:** Incorrect image URL format or CDN issues.

**Diagnosis:**
1. Check URL format in chap.js output
2. Test images directly with curl
3. Verify no invalid suffixes added

**Solutions:**

**Solution A: Remove custom header suffixes** ✅ (CORRECT)
```javascript
// ❌ Wrong:
data.push(link + "|Referer=" + SITE_URL);

// ✅ Correct:
data.push(link);  // Bare URL only
```

**Solution B: Fix protocol-relative URLs**
```javascript
// ❌ Wrong:
data.push("//cdn.example.com/image.jpg");

// ✅ Correct:
if (link.indexOf("//") === 0) {
    link = "https:" + link;
}
data.push(link);
```

**Solution C: Deduplicate images**
```javascript
// ✅ Prevent duplicate URLs
var seen = {};
for (var i = 0; i < images.length; i++) {
    var link = images[i].src;
    if (!seen[link]) {
        seen[link] = true;
        data.push(link);
    }
}
```

### Issue 3: Authentication Time Window Skew

**Symptom:** Some requests succeed, others fail. Success rate improves at top of hour.

**Root Cause:** Using local machine time different from API server time, or timezone issues.

**Solution:**
```javascript
// Current implementation uses device time (correct)
var hourMs = Math.floor(new Date().getTime() / 3600000) * 3600000;

// If server is in different timezone:
// Option 1: Request server time via unauth endpoint
// Option 2: Add small tolerance (try current hour + previous hour)
```

### Issue 4: Comic ID Extraction Fails

**Symptom:** Comic detail page returns error. URLs don't match pattern.

**Diagnosis:**
```javascript
// Test extraction regex
var url = "https://tcomicfanqq.com/truyen-tranh/manga-name-12345/";
var m = url.match(/\/truyen-tranh\/[a-z0-9-]+-(\d+)(?:\/|$)/);
console.log(m ? m[1] : "NO MATCH");  // Should print: 12345
```

**Solutions:**
1. Verify URL pattern in plugin.json matches real site URLs
2. Update extraction regex if URL format changes
3. Add fallback extraction methods if primary fails

---

## Best Practices

### 1. Configuration Management

**Pattern:**
```javascript
// Use CONFIG_URL if provided, fall back to defaults
try {
    if (CONFIG_URL) {
        SITE_URL = CONFIG_URL;
        var m = String(CONFIG_URL).match(/^https?:\/\/([^\/]+)/);
        if (m) {
            API_URL = 'https://api.' + m[1].replace(/^www\./, '');
        }
    }
} catch (e) {}

var LIMIT = 24;  // Default items per page
```

**Benefits:**
- Plugin works with domain mirrors/proxies
- Graceful fallback if CONFIG_URL unavailable
- Single place to update site URLs

### 2. Error Handling & Fallbacks

```javascript
// Pattern 1: API call fallbacks
var genres = [];
try {
    var response = apiGet("/api/web/categories", {});
    if (response && response.code === 0) {
        genres = response.data;
    }
} catch (e) {}

// Fall back to static list if API fails
if (!genres || genres.length === 0) {
    genres = STATIC_FALLBACK_GENRES;
}
```

```javascript
// Pattern 2: Response validation
if (!json || json.code !== 0 || !json.data) {
    return null;  // Early return on invalid response
}
```

### 3. Data Mapping Reusability

```javascript
// Single source of truth for comic card format
function mapComicCard(c) {
    if (!c || !c.slug || !c.id) return null;
    
    var desc = "";
    if (c.last_chapter && c.last_chapter.name) {
        desc = c.last_chapter.name;
    } else if (c.updated_at) {
        desc = c.updated_at;
    }
    
    return {
        name: c.title || "",
        link: comicLink(c.slug, c.id),
        description: desc,
        cover: c.thumbnail || "",
        host: SITE_URL
    };
}

// Reuse in home.js, search.js, gen.js, etc.
var list = [];
for (var i = 0; i < arr.length; i++) {
    var card = mapComicCard(arr[i]);
    if (card) list.push(card);
}
```

### 4. URL Extraction Patterns

**Comic ID from URL:**
```javascript
function extractComicId(url) {
    var m = String(url).match(/\/truyen-tranh\/[a-z0-9-]+-(\d+)(?:\/|$)/);
    return m ? m[1] : null;
}
```

**Chapter ID from URL:**
```javascript
function parseUrl(url) {
    var s = String(url);
    var mChap = s.match(/\/chapters\/(\d+)/);
    var mComic = s.match(/comicId=(\d+)/);
    if (!mChap) return null;
    return {
        chapterId: mChap[1],
        comicId: mComic ? mComic[1] : ""
    };
}
```

**Key Points:**
- Handle both trailing slash and no-slash cases
- Extract numeric IDs as strings (cast to int if needed)
- Return null on parse failure (not undefined)

### 5. Request Header Standards

```javascript
function REQ_HEADERS() {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi-VN,vi;q=0.9",
        "Referer": SITE_URL + "/",
        "Origin": SITE_URL
    };
}
```

**Why these headers?**
- `User-Agent`: Identify as browser (many APIs block bots)
- `Accept`: Declare expected response format
- `Accept-Language`: Regional preference
- `Referer`: Required by many APIs for validation
- `Origin`: CORS/security validation

### 6. Pagination Handling

**Pattern:**
```javascript
// Generic pagination for any endpoint
function execute(input, page) {
    if (!page) page = '1';
    
    var json = apiGet(input, {
        q: searchKey,
        page: page,
        limit: LIMIT
    });
    
    if (!json) return null;
    
    var arr = json.comics || json.data || [];
    var list = [];
    for (var i = 0; i < arr.length; i++) {
        var card = mapComicCard(arr[i]);
        if (card) list.push(card);
    }
    
    // Return next page token if results hit limit
    var next = (list.length >= LIMIT) 
        ? (parseInt(page) + 1).toString() 
        : "";
    
    return Response.success(list, next);
}
```

**Key Points:**
- Assume page 1 if not provided
- Use flexible array key detection (`json.comics || json.data`)
- Only return next page token if results are at limit
- Increment page number for next page

### 7. Status Text Localization

```javascript
function statusText(s) {
    s = (s || "").toString().toUpperCase();
    
    if (s === "COMPLETED" || s === "DONE" || s === "COMPLETE") {
        return {text: "Đã hoàn thành", ongoing: false};
    }
    
    return {text: "Đang tiến hành", ongoing: true};
}
```

**Usage:**
```javascript
var st = statusText(d.status);
// Returns: {text: "Vietnamese status", ongoing: boolean}
```

### 8. Debug Logging Pattern

```javascript
// Add optional debug mode
var DEBUG = false;  // Set to true for debugging

function apiGet(path, params) {
    var sig = signPath(path, params || {});
    var headers = REQ_HEADERS();
    if (sig) headers["x-request-id"] = sig;
    
    var url = API_URL + path + buildQS(params);
    
    if (DEBUG) {
        console.log("API Request: " + url);
        console.log("Signature: " + sig);
    }
    
    try {
        var s = Http.get(url).headers(headers).string();
        if (!s) return null;
        return JSON.parse(s);
    } catch (e) {
        if (DEBUG) console.log("API Error: " + e.message);
        return null;
    }
}
```

---

## Summary & Checklist

### Plugin Development Checklist

- [ ] Analyze target website's API via minified JavaScript inspection
- [ ] Extract all constants (secrets, salts, endpoints)
- [ ] Reverse-engineer authentication algorithm
- [ ] Implement pure-JavaScript crypto if needed (no Java access)
- [ ] Create plugin.json with correct metadata and script mappings
- [ ] Implement config.js with API helpers and crypto functions
- [ ] Implement home.js with category list
- [ ] Implement genre.js (if dynamic genres supported)
- [ ] Implement gen.js as reusable pagination handler
- [ ] Implement detail.js with comic metadata parsing
- [ ] Implement search.js with full-text search
- [ ] Implement toc.js with chapter list extraction
- [ ] Implement chap.js with image URL deduplication
- [ ] Create plugin icon (66KB max recommended)
- [ ] Unit test crypto functions against standard vectors
- [ ] Integration test all 7 endpoints in Vbook
- [ ] Test pagination across all list endpoints
- [ ] Verify image loading (bare URLs, deduplication)
- [ ] Push to GitHub with clear commit messages
- [ ] Update plugin.json version and test with Vbook

### Key Principles

1. **Graceful Degradation** - Provide fallbacks when APIs unavailable
2. **Pure JavaScript** - Don't rely on Java/native access
3. **URL Handling** - Extract IDs carefully, validate patterns
4. **Error Resilience** - Return null on any error (not exceptions)
5. **Data Reusability** - Single mapping function for comic cards
6. **Configuration Flexibility** - Support CONFIG_URL proxies
7. **Standard Headers** - Include proper User-Agent, Referer, etc.
8. **Image Simplicity** - Bare URLs only, no custom suffixes
9. **Testing Rigor** - Verify against known test vectors
10. **Clear Commits** - Document API discoveries in messages

---

## Additional Resources

### Testing Tools

- **curl** - Test API endpoints and headers
- **Node.js + CryptoJS** - Verify JavaScript crypto implementations
- **Postman** - Interactive API exploration
- **Browser DevTools** - Inspect network requests and minified code

### References

- RFC 1321 - MD5 Message-Digest Algorithm
- FIPS 197 - Advanced Encryption Standard (AES)
- RFC 2898 - PKCS #5 (relevant to EVP_BytesToKey)
- OpenSSL EVP documentation

### Common API Patterns

Most REST APIs follow these patterns:
- Pagination: page/limit or offset/count
- Sorting: sort, order, or orderBy params
- Filtering: category, genre, status, rating
- Search: q or query parameter
- Authentication: Bearer token, API key, or custom signing

---

## Contact & Version

**Created:** 2025-05-28  
**Tcomic Plugin Version:** 3  
**Plugin Repository:** https://github.com/trungkhanhduong93/trum-vbook/tree/main/tcomic

**Author Notes:**

This guide consolidates lessons from building the Tcomic plugin, including:
- Three iterations to resolve authentication and image loading issues
- Pure-JavaScript crypto implementation from scratch
- Careful API reverse-engineering via minified JavaScript analysis
- Workarounds for Rhino sandbox limitations

The techniques documented here are reusable across any Vbook plugin that requires API authentication, especially those with JavaScript-based signing schemes.

For questions or improvements, refer to the commit history and plugin repository.

---

**End of Guide**
