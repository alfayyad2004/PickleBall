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
    fee_structure: 'customer_pay',
    method: 'credit_card',
    return_url: 'https://pickleball-central.netlify.app/payment_success.html'
};

// ... (md5 function remains same - implied context) ...

// Export for use in module
window.startWiPayRedirect = (amount, customOrderID) => {
    // Sandbox Credentials applied.
    const url = createWiPayLink(amount, customOrderID);
    console.log("Redirecting to:", url);
    window.location.href = url;
};

// ... (MD5 function omitted for brevity, assumed unchanged) ...

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

    // Construct Query Params
    const params = new URLSearchParams({
        'account_number': WIPAY_CONFIG.account_number,
        'currency': WIPAY_CONFIG.currency,
        'environment': WIPAY_CONFIG.environment,
        'country_code': WIPAY_CONFIG.country_code,
        'fee_structure': WIPAY_CONFIG.fee_structure,
        'method': WIPAY_CONFIG.method,
        'order_id': order_id,
        'origin': 'Pickleball Central',
        'response_url': WIPAY_CONFIG.return_url,
        'total': total.toFixed(2), // Ensure 2 decimal places
        'hash': hash
    });

    return `${baseUrl}?${params.toString()}`;
}

// Export for use in module

