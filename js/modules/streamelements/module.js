/* ============================================ */
/*     STREAMELEMENTS MODULE - DANMAKU CHAT     */
/* ============================================ */

const streamelementsModule = true;
const showStreamelements = getURLParam("showStreamelements", false);
const showStreamElementsTips = getURLParam("showStreamElementsTips", true);

const streamElementsHandlers = {
    'StreamElements.Tip': (response) => {
        streamElementsEventMessage(response.data);
    },
};

if (showStreamelements) {
    registerPlatformHandlersToStreamerBot(streamElementsHandlers, '[Streamelements]');
}

async function streamElementsEventMessage(data) {
    if (showStreamElementsTips === false) return;

    createDanmakuEvent('streamelements', {
        username: data.name || 'Anonymous',
        color: '#62c54e',
        action: 'donated',
        value: formatCurrency(data.amount, data.currency),
        messageHtml: escapeHTML(data.message || '')
    });
}
