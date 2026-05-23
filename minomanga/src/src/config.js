var BASE_URL = 'https://minotruyenv7.xyz';
var API = 'https://api.cloudkk-v1.xyz/api';
var TYPE = 'manga';
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
var FULL_URL = BASE_URL + "/" + TYPE;
