let BASE_URL = 'https://minotruyenv7.xyz';
let API = 'https://api.cloudkk-v1.xyz/api';
let TYPE = 'hentai';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
try {
    if (CONFIG_TYPE) {
        TYPE = CONFIG_TYPE;
    }
} catch (error) {
}
let FULL_URL = BASE_URL + "/" + TYPE;
