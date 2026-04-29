/* ============================================ */
/*       PATREON MODULE - DANMAKU CHAT         */
/* ============================================ */

const patreonModule = true;
const showPatreon = getURLParam("showPatreon", false);
const showPatreonMemberships = getURLParam("showPatreonMemberships", true);

const patreonHandlers = {
    'Patreon.PledgeCreated': (response) => {
        patreonMemberships(response.data);
    },
};

if (showPatreon) {
    registerPlatformHandlersToStreamerBot(patreonHandlers, '[Patreon]');
}

async function patreonMemberships(data) {
    if (showPatreonMemberships === false) return;

    createDanmakuEvent('patreon', {
        username: data.user?.full_name || data.user_name || 'Anonymous',
        color: '#ff424d',
        action: 'pledged on Patreon!',
        value: data.tier?.title || '',
        messageHtml: data.message ? escapeHTML(data.message) : null
    });
}
