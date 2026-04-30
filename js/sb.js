/* ============================================ */
/*      STREAMER.BOT CONNECTION & UTILS         */
/* ============================================ */

const streamerBotServerAddress = getURLParam("streamerBotServerAddress", "127.0.0.1");
const streamerBotServerPort = getURLParam("streamerBotServerPort", "8080");

function getURLParam(param, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);

    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === null) return defaultValue;

    return value;
}

let streamerBotClientActive = null;
let streamerBotClient = null;

function streamerBotConnect() {
    if (typeof StreamerbotClient === 'undefined') {
        console.warn('[DanmakuChat] Streamer.bot client library not loaded');
        return null;
    }

    if (streamerBotClientActive) {
        try {
            streamerBotClientActive.disconnect?.();
            streamerBotClientActive = null;
        } catch (err) {
            console.error('[DanmakuChat] Error closing previous client:', err);
        }
    }

    try {
        streamerBotClientActive = new StreamerbotClient({
            host: streamerBotServerAddress,
            port: streamerBotServerPort,
            onConnect: () => {
                console.log('[DanmakuChat] Connected to Streamer.bot');
            },
            onDisconnect: () => {
                console.log('[DanmakuChat] Disconnected from Streamer.bot');
            }
        });

        return streamerBotClientActive;
    } catch (err) {
        console.warn('[DanmakuChat] Failed to create Streamer.bot client:', err);
        return null;
    }
}

try {
    streamerBotClient = streamerBotConnect();
} catch (err) {
    console.warn('[DanmakuChat] Streamer.bot init failed:', err);
    streamerBotClient = null;
}

async function getStreamerInfo() {
    if (!streamerBotClient) return null;
    try {
        return await streamerBotClient.getBroadcaster();
    } catch (err) {
        console.warn('[DanmakuChat] getStreamerInfo failed:', err);
        return null;
    }
}

function registerPlatformHandlersToStreamerBot(handlers, logPrefix = '') {
    if (!streamerBotClient) return;
    try {
        for (const [event, handler] of Object.entries(handlers)) {
            streamerBotClient.on(event, (...args) => {
                if (logPrefix) {
                    console.debug(`${logPrefix} ${event}`, args[0]);
                }
                handler(...args);
            });
        }
    } catch (err) {
        console.warn('[DanmakuChat] Failed to register platform handlers:', err);
    }
}
