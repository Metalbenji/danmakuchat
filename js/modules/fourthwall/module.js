/* ============================================ */
/*       FOURTHWALL MODULE - DANMAKU CHAT       */
/* ============================================ */

const fourthwallModule = true;
const showFourthwall = getURLParam("showFourthwall", false);
const showFourthwallDonations = getURLParam("showFourthwallDonations", true);
const showFourthwallSubscriptions = getURLParam("showFourthwallSubscriptions", true);
const showFourthwallOrders = getURLParam("showFourthwallOrders", true);
const showFourthwallGiftPurchase = getURLParam("showFourthwallGiftPurchase", true);
const showFourthwallGiftDraw = getURLParam("showFourthwallGiftDraw", true);

const fourthwallMessageHandlers = {
    'Fourthwall.Donation': (response) => {
        fourthwallDonationMessage(response.data);
    },
    'Fourthwall.SubscriptionPurchased': (response) => {
        fourthwallSubMessage(response.data);
    },
    'Fourthwall.OrderPlaced': (response) => {
        fourthwallOrderMessage(response.data);
    },
    'Fourthwall.GiftPurchase': (response) => {
        fourthwallGiftMessage(response.data);
    },
    'Fourthwall.GiftDrawStarted': (response) => {
        fourthwallGiftDrawStartMessage(response.data);
    },
};

if (showFourthwall) {
    registerPlatformHandlersToStreamerBot(fourthwallMessageHandlers, '[Fourthwall]');
}

async function fourthwallDonationMessage(data) {
    if (showFourthwallDonations === false) return;

    createDanmakuEvent('fourthwall', {
        username: data.customer?.name || 'Anonymous',
        color: '#ffc400',
        action: 'donated',
        value: formatCurrency(data.amount, data.currency),
        messageHtml: data.message ? escapeHTML(data.message) : null
    });
}

async function fourthwallSubMessage(data) {
    if (showFourthwallSubscriptions === false) return;

    createDanmakuEvent('fourthwall', {
        username: data.customer?.name || 'Anonymous',
        color: '#ffc400',
        action: 'subscribed on Fourthwall!',
        value: data.product_name || data.plan_name || ''
    });
}

async function fourthwallOrderMessage(data) {
    if (showFourthwallOrders === false) return;

    createDanmakuEvent('fourthwall', {
        username: data.customer?.name || 'Anonymous',
        color: '#ffc400',
        action: 'ordered from Fourthwall',
        value: data.items?.[0]?.product_name || ''
    });
}

async function fourthwallGiftMessage(data) {
    if (showFourthwallGiftPurchase === false) return;

    createDanmakuEvent('fourthwall', {
        username: data.customer?.name || 'Anonymous',
        color: '#ffc400',
        action: 'purchased a gift on Fourthwall',
        value: data.product_name || ''
    });
}

async function fourthwallGiftDrawStartMessage(data) {
    if (showFourthwallGiftDraw === false) return;

    createDanmakuEvent('fourthwall', {
        username: data.customer?.name || 'Anonymous',
        color: '#ffc400',
        action: 'started a gift draw!',
        value: data.product_name || ''
    });
}
