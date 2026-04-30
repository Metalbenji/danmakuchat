/* ============================================ */
/*       TIPEEESTREAM MODULE - DANMAKU CHAT     */
/* ============================================ */

const tipeeestreamModule = true;
const showTipeee = getURLParam("showTipeee", true);
const showTipeeeDonations = getURLParam("showTipeeeDonations", true);

const tipeeeHandlers = {
    'TipeeeStream.Donation': (response) => {
        tipeeeStreamDonation(response.data);
    },
};

if (showTipeee) {
    registerPlatformHandlersToStreamerBot(tipeeeHandlers, '[Tipeeestream]');
}

async function tipeeeStreamDonation(data) {
    if (showTipeeeDonations === false) return;

    createDanmakuEvent('tipeeestream', {
        username: data.user?.name || data.username || 'Anonymous',
        color: '#ff6b35',
        action: 'donated',
        value: formatCurrency(data.amount, data.currency),
        messageHtml: data.message ? escapeHTML(data.message) : null
    });
}
