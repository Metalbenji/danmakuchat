/* ============================================ */
/*      STREAMLABS MODULE - DANMAKU CHAT       */
/* ============================================ */

const streamlabsModule = true;
const showStreamlabs = getURLParam("showStreamlabs", false);
const showStreamlabsDonations = getURLParam("showStreamlabsDonations", true);

const streamlabsHandlers = {
    'Streamlabs.Donation': (response) => {
        streamLabsEventMessage(response.data);
    },
};

if (showStreamlabs) {
    registerPlatformHandlersToStreamerBot(streamlabsHandlers, '[Streamlabs]');
}

async function streamLabsEventMessage(data) {
    if (showStreamlabsDonations === false) return;

    createDanmakuEvent('streamlabs', {
        username: data.name || 'Anonymous',
        color: '#32a0da',
        action: 'donated',
        value: formatCurrency(data.amount, data.currency),
        messageHtml: escapeHTML(data.message || '')
    });
}
