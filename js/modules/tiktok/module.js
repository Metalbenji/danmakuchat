/* ============================================ */
/*         TIKTOK MODULE - DANMAKU CHAT         */
/* ============================================ */

const tiktokModule = true;
const showTiktok = getURLParam("showTiktok", true);
const showTikTokMessages = getURLParam("showTikTokMessages", true);
const showTikTokJoins = getURLParam("showTikTokJoins", false);
const showTikTokFollows = getURLParam("showTikTokFollows", true);
const showTikTokLikes = getURLParam("showTikTokLikes", false);
const showTikTokShares = getURLParam("showTikTokShares", false);
const showTikTokGifts = getURLParam("showTikTokGifts", true);
const showSmallTikTokGifts = getURLParam("showSmallTikTokGifts", false);
const showTikTokSubs = getURLParam("showTikTokSubs", true);

// TikTok uses TikFinity WebSocket (not just Streamer.bot)
if (showTiktok) {
    setupTikTokTikFinity();
}

function setupTikTokTikFinity() {
    const tikfinityWebSocketURL = 'ws://localhost:21213/';
    const reconnectDelay = 10000;
    let retryCount = 0;
    const maxTries = 20;

    function connect() {
        const ws = new WebSocket(tikfinityWebSocketURL);

        ws.onopen = () => {
            console.debug('[TikFinity] Connected');
            retryCount = 0;
        };

        ws.onmessage = (response) => {
            try {
                const data = JSON.parse(response.data);
                const tiktokData = data.data;

                switch (data.event) {
                    case 'chat': tiktokChatMessage(tiktokData); break;
                    case 'follow': tiktokFollowMessage(tiktokData); break;
                    case 'gift': tiktokGiftMessage(tiktokData); break;
                    case 'subscribe': tiktokSubMessage(tiktokData); break;
                    case 'member': tiktokJoinMessage(tiktokData); break;
                    case 'share': tiktokShareMessage(tiktokData); break;
                    case 'like': tiktokLikesMessage(tiktokData); break;
                }
            } catch (e) {
                // Parse error
            }
        };

        ws.onclose = () => {
            retryCount++;
            if (retryCount < maxTries) {
                setTimeout(connect, reconnectDelay);
            }
        };

        ws.onerror = () => {
            if (ws.readyState !== WebSocket.CLOSED) ws.close();
        };

        return ws;
    }

    connect();
}

// ---- TikTok Event Functions ----

async function tiktokChatMessage(data) {
    if (!data?.comment) data.comment = ' ';
    if (showTikTokMessages === false) return;
    if (data.uniqueId && ignoreUserList.includes(data.uniqueId.toLowerCase())) return;
    if (data.comment.startsWith('!') && ignoreCommands === true) return;

    createDanmakuChat('tiktok', {
        text: data.comment,
        username: data.nickname || data.uniqueId || 'Unknown',
        color: `hsl(${Math.random() * 360}, 80%, 65%)`,
        avatar: data.profilePictureUrl || null
    });
}

async function tiktokFollowMessage(data) {
    if (showTikTokFollows === false) return;

    createDanmakuEvent('tiktok', {
        username: data.nickname || data.uniqueId || 'Unknown',
        color: '#ff0050',
        action: 'just followed!'
    });
}

async function tiktokGiftMessage(data) {
    if (showTikTokGifts === false) return;
    if (showSmallTikTokGifts === false && data.giftType === 1) return;
    if (!data.repeatEnd) return; // Only show completed gifts

    createDanmakuEvent('tiktok', {
        username: data.nickname || data.uniqueId || 'Unknown',
        color: '#ff0050',
        action: 'sent',
        value: `${data.repeatCount}x ${data.giftName}`
    });
}

async function tiktokSubMessage(data) {
    if (showTikTokSubs === false) return;

    createDanmakuEvent('tiktok', {
        username: data.nickname || data.uniqueId || 'Unknown',
        color: '#ff0050',
        action: 'subscribed!'
    });
}

async function tiktokJoinMessage(data) {
    if (showTikTokJoins === false) return;

    createDanmakuEvent('tiktok', {
        username: data.nickname || data.uniqueId || 'Unknown',
        color: '#ff0050',
        action: 'joined the stream'
    });
}

async function tiktokShareMessage(data) {
    if (showTikTokShares === false) return;

    createDanmakuEvent('tiktok', {
        username: data.nickname || data.uniqueId || 'Unknown',
        color: '#ff0050',
        action: 'shared the stream'
    });
}

async function tiktokLikesMessage(data) {
    if (showTikTokLikes === false) return;

    createDanmakuEvent('tiktok', {
        username: data.nickname || data.uniqueId || 'Unknown',
        color: '#ff0050',
        action: 'liked',
        value: `${data.totalLikes} times`
    });
}
