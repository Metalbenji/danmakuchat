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

function streamerBotConnect() {
    if (streamerBotClientActive) {
        try {
            streamerBotClientActive.disconnect?.();
            streamerBotClientActive = null;
        } catch (err) {
            console.error("[DanmakuChat] Error closing previous client:", err);
        }
    }

    streamerBotClientActive = new StreamerbotClient({
        host: streamerBotServerAddress,
        port: streamerBotServerPort,
        onConnect: () => {
            console.log("[DanmakuChat] Connected to Streamer.bot");
        },
        onDisconnect: () => {
            console.log("[DanmakuChat] Disconnected from Streamer.bot");
        }
    });

    return streamerBotClientActive;
}

const streamerBotClient = streamerBotConnect();

async function getStreamerInfo() {
    const request = await streamerBotClient.getBroadcaster();
    return request;
}

function registerPlatformHandlersToStreamerBot(handlers, logPrefix = '') {
    if (!streamerBotClient) return;
    for (const [event, handler] of Object.entries(handlers)) {
        streamerBotClient.on(event, (...args) => {
            if (logPrefix) {
                console.debug(`${logPrefix} ${event}`, args[0]);
            }
            handler(...args);
        });
    }
}
