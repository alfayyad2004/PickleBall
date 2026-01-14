/**
 * WiPay Integration Helper
 * Handles link generation and redirect for the Sandbox environment.
 */

// Configuration - REPLACE THESE WITH REAL KEYS
const WIPAY_CONFIG = {
    account_number: '1234567890',
    api_key: '123',
    environment: 'sandbox',
    currency: 'TTD',
    country_code: 'TT',
    fee_structure: 'customer_pay', // Standard sandbox default
    method: 'credit_card',
    return_url: 'https://pickleball-central.netlify.app/payment_success.html' // Will be overridden dynamically
};

/**
 * 1. Simple MD5 implementation for client-side hashing (Prototype only)
 * For production, this should be done on a secure server/edge function.
 */
function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function addUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }

    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }

    function wordToHex(lValue) {
        var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
    }

    var x = convertToWordArray(string);
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        d = GG(d, a, b, c, x[k + 1], S21, 0xF61E2562);
        c = GG(c, d, a, b, x[k + 6], S22, 0xC040B340);
        b = GG(b, c, d, a, x[k + 11], S23, 0x265E5A51);
        a = GG(a, b, c, d, x[k + 0], S21, 0xE9B6C7AA);
        d = GG(d, a, b, c, x[k + 5], S22, 0xD62F105D);
        c = GG(c, d, a, b, x[k + 10], S23, 0x2441453);
        b = GG(b, c, d, a, x[k + 15], S23, 0xD8A1E681);
        a = GG(a, b, c, d, x[k + 4], S21, 0xE7D3FBC8);
        d = GG(d, a, b, c, x[k + 9], S22, 0x21E1CDE6);
        c = GG(c, d, a, b, x[k + 14], S23, 0xC33707D6);
        b = GG(b, c, d, a, x[k + 3], S23, 0xF4D50D87);
        a = GG(a, b, c, d, x[k + 8], S21, 0x455A14ED);
        d = GG(d, a, b, c, x[k + 13], S22, 0xA9E3E905);
        c = GG(c, d, a, b, x[k + 2], S23, 0xFCEFA3F8);
        b = GG(b, c, d, a, x[k + 7], S23, 0x676F02D9);
        d = HH(d, a, b, c, x[k + 5], S31, 0xFFFA3942);
        c = HH(c, d, a, b, x[k + 8], S32, 0x8771F681);
        b = HH(b, c, d, a, x[k + 11], S33, 0x6D9D6122);
        a = HH(a, b, c, d, x[k + 14], S31, 0xFDE5380C);
        d = HH(d, a, b, c, x[k + 1], S31, 0xA4BEEA44);
        c = HH(c, d, a, b, x[k + 4], S32, 0x4BDECFA9);
        b = HH(b, c, d, a, x[k + 7], S33, 0xF6BB4B60);
        a = HH(a, b, c, d, x[k + 10], S31, 0xBEBFBC70);
        d = HH(d, a, b, c, x[k + 13], S31, 0x289B7EC6);
        c = HH(c, d, a, b, x[k + 0], S32, 0xEAA127FA);
        b = HH(b, c, d, a, x[k + 3], S33, 0xD4EF3085);
        a = HH(a, b, c, d, x[k + 6], S31, 0x4881D05);
        d = HH(d, a, b, c, x[k + 9], S31, 0xD9D4D039);
        c = HH(c, d, a, b, x[k + 12], S32, 0xE6DB99E5);
        b = HH(b, c, d, a, x[k + 15], S33, 0x1FA27CF8);
        a = HH(a, b, c, d, x[k + 2], S31, 0xC4AC5665);
        d = II(d, a, b, c, x[k + 0], S41, 0xF4292244);
        c = II(c, d, a, b, x[k + 7], S42, 0x432AFF97);
        b = II(b, c, d, a, x[k + 14], S43, 0xAB9423A7);
        a = II(a, b, c, d, x[k + 5], S41, 0xFC93A039);
        d = II(d, a, b, c, x[k + 12], S42, 0x655B59C3);
        c = II(c, d, a, b, x[k + 3], S43, 0x8F0CCC92);
        b = II(b, c, d, a, x[k + 10], S43, 0xFFEFF47D);
        a = II(a, b, c, d, x[k + 1], S41, 0x85845DD1);
        d = II(d, a, b, c, x[k + 8], S42, 0x6FA87E4F);
        c = II(c, d, a, b, x[k + 15], S43, 0xFE2CE6E0);
        b = II(b, c, d, a, x[k + 6], S43, 0xA3014314);
        a = II(a, b, c, d, x[k + 13], S41, 0x4E0811A1);
        d = II(d, a, b, c, x[k + 4], S42, 0xF7537E82);
        c = II(c, d, a, b, x[k + 11], S43, 0xBD3AF235);
        b = II(b, c, d, a, x[k + 2], S43, 0x2AD7D2BB);
        a = II(a, b, c, d, x[k + 9], S41, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }

    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

    return temp.toLowerCase();
}

/**
 * Generates the redirect URL for WiPay
 * @param {number} total The amount to charge (e.g., 300.00)
 * @param {string} customOrderID (Optional) The Order ID to use
 */
function createWiPayLink(total, customOrderID) {
    // Use custom ID if provided, otherwise random
    const order_id = customOrderID ? customOrderID : ('ORD-' + Math.floor(Math.random() * 1000000));

    // Hash Calculation
    // WiPay Sandbox Hash = MD5(order_id + total + api_key)
    const hash_string = order_id + total.toFixed(2) + WIPAY_CONFIG.api_key;
    const hash = md5(hash_string);

    const baseUrl = "https://tt.wipayfinancial.com/plugins/payments/request";

    // Dynamic Return URL for Localhost vs Production
    // This allows it to work on 127.0.0.1 or pickleball-central.netlify.app without code changes.
    const dynamicReturnUrl = window.location.origin + '/payment_success.html';

    // Construct Query Params
    const params = new URLSearchParams({
        'account_number': WIPAY_CONFIG.account_number,
        'currency': WIPAY_CONFIG.currency,
        'environment': WIPAY_CONFIG.environment,
        'country_code': WIPAY_CONFIG.country_code,
        'fee_structure': WIPAY_CONFIG.fee_structure,
        'method': WIPAY_CONFIG.method,
        'order_id': order_id,
        'origin': 'Pickleball_Central',
        'response_url': dynamicReturnUrl, // Use dynamic URL
        'total': total.toFixed(2), // Ensure 2 decimal places
        'hash': hash
    });

    return `${baseUrl}?${params.toString()}`;
}

// Export for use in module
window.startWiPayRedirect = (amount, customOrderID) => {
    // Sandbox Credentials applied.
    const url = createWiPayLink(amount, customOrderID);
    console.log("Redirecting to:", url);
    window.location.href = url;
};
