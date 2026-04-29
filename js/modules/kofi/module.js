/* ============================================ */
/*         KOFI MODULE - DANMAKU CHAT           */
/* ============================================ */

const kofiModule = true;
const showKofi = getURLParam("showKofi", false);
const showKofiSubscriptions = getURLParam("showKofiSubscriptions", true);
const showKofiDonations = getURLParam("showKofiDonations", true);
const showKofiOrders = getURLParam("showKofiOrders", true);

const kofiMessageHandlers = {
    'Kofi.Donation': (response) => {
        kofiDonationMessage(response.data);
    },
    'Kofi.Subscription': (response) => {
        kofiSubMessage(response.data);
    },
    'Kofi.Resubscription': (response) => {
        kofiReSubMessage(response.data);
    },
    'Kofi.ShopOrder': (response) => {
        kofiOrderMessage(response.data);
    },
};

if (showKofi) {
    registerPlatformHandlersToStreamerBot(kofiMessageHandlers, '[Ko-Fi]');
}

async function kofiDonationMessage(data) {
    if (showKofiDonations === false) return;

    createDanmakuEvent('kofi', {
        username: data.from_name || 'Anonymous',
        color: '#49c2d1',
        action: 'supported on Ko-fi!',
        value: formatCurrency(data.amount, data.currency),
        messageHtml: data.message ? escapeHTML(data.message) : null
    });
}

async function kofiSubMessage(data) {
    if (showKofiSubscriptions === false) return;

    createDanmakuEvent('kofi', {
        username: data.from_name || 'Anonymous',
        color: '#49c2d1',
        action: 'subscribed on Ko-fi!',
        value: data.tier_name || ''
    });
}

async function kofiReSubMessage(data) {
    if (showKofiSubscriptions === false) return;

    createDanmakuEvent('kofi', {
        username: data.from_name || 'Anonymous',
        color: '#49c2d1',
        action: 'resubscribed on Ko-fi!',
        value: data.tier_name || ''
    });
}

async function kofiOrderMessage(data) {
    if (showKofiOrders === false) return;

    createDanmakuEvent('kofi', {
        username: data.from_name || 'Anonymous',
        color: '#49c2d1',
        action: 'ordered from Ko-fi shop',
        value: data.items?.[0]?.name || data.order_id || ''
    });
}
