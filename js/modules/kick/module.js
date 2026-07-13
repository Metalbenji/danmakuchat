/* ============================================ */
/*          KICK MODULE - DANMAKU CHAT          */
/* ============================================ */

const kickModule = true;
const showKick = getURLParam("showKick", true);
const showKickMessages = getURLParam("showKickMessages", true);
const showKickFollows = getURLParam("showKickFollows", true);
const showKickSubs = getURLParam("showKickSubs", true);
const showKickGiftedSubs = getURLParam("showKickGiftedSubs", true);
const showKickMassGiftedSubs = getURLParam("showKickMassGiftedSubs", true);
const showKickGiftedSubsUserTrain = getURLParam("showKickGiftedSubsUserTrain", true);
const showKickRewardRedemptions = getURLParam("showKickRewardRedemptions", true);
const showKickRaids = getURLParam("showKickRaids", true);
const showKickGifts = getURLParam("showKickGifts", true);

const kickAvatars = new Map();
const MAX_KICK_AVATARS = 500;
let kickSubBadges = [];
let kick7TVEmojis = new Map();
const kickWebSocketURL = getURLParam("kickWebSocketURL", 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false');

// Kick messages come via direct WebSocket (not just Streamer.bot)
const kickMessageHandlers = {
    'Kick.Follow': (response) => {
        kickFollowMessage(response.data);
    },
};

if (showKick) {
    registerPlatformHandlersToStreamerBot(kickMessageHandlers, '[Kick]');

    // Setup direct Kick WebSocket for chat messages
    setupKickWebSocket();
}

async function setupKickWebSocket() {
    try {
        // Skip HTTP fetch from file:// — CORS blocks it anyway.
        // Kick chat still works via Streamer.bot WebSocket events.
        if (window.location.protocol === 'file:') {
            console.log('[Kick] Skipping direct WebSocket (file:// mode, using Streamer.bot events)');
            return;
        }

        const streamerInfo = await getStreamerInfo();
        const chatroom = streamerInfo?.platforms?.kick?.chatroom;
        if (!chatroom) {
            console.warn('[Kick] No chatroom found from Streamer.bot');
            return;
        }

        let ws;
        let retries = 0;
        const maxRetries = 5;

        function connect() {
            ws = new WebSocket(kickWebSocketURL);

            ws.onopen = () => {
                console.log('[Kick] WebSocket connected');
                ws.send(JSON.stringify({
                    event: 'pusher:subscribe',
                    data: { channel: `chatroom.${chatroom}` }
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    const data = msg.data ? JSON.parse(msg.data) : {};

                    if (msg.event === 'App\\Events\\ChatMessageEvent') {
                        kickChatMessage(data);
                    }
                    if (msg.event === 'App\\Events\\GiftedSubscriptionsEvent') {
                        kickGiftSubMessage(data);
                    }
                    if (msg.event === 'App\\Events\\SubscriptionEvent') {
                        kickSubMessage(data);
                    }
                    if (msg.event === 'App\\Events\\MassGiftedSubscriptionsEvent') {
                        kickMassGiftSubMessage(data);
                    }
                    if (msg.event === 'App\\Events\\PinnedMessageCreatedEvent') {
                        // Handle pinned messages if needed
                    }
                } catch (e) {
                    // Parse error, ignore
                }
            };

            ws.onclose = () => {
                retries++;
                if (retries < maxRetries) {
                    setTimeout(connect, 3000 * retries);
                }
            };

            ws.onerror = () => {
                ws.close();
            };
        }

        connect();
    } catch (e) {
        console.warn('[Kick] Could not setup WebSocket:', e);
    }
}

async function getKickAvatar(username) {
    if (kickAvatars.has(username)) return kickAvatars.get(username);
    // Generate a deterministic SVG avatar (gradient + silhouette).
    // No dependency on third-party services.
    const url = generateAvatarUrl(username, '');
    if (kickAvatars.size >= MAX_KICK_AVATARS) { const k = kickAvatars.keys().next().value; kickAvatars.delete(k); }
    kickAvatars.set(username, url);
    return url;
}

async function getKickBadges(badges) {
    if (!badges || !Array.isArray(badges)) return '';
    const badgesArray = [];

    // Pre-load subscriber badge data if needed
    if (badges.some(b => b.type === 'subscriber') && kickSubBadges.length === 0) {
        await loadKickSubBadges();
    }

    badges.forEach(badge => {
        if (badge.type === 'subscriber') {
            const targetMonths = badge.count;
            const eligible = kickSubBadges
                .filter(b => b.months <= targetMonths)
                .sort((a, b) => b.months - a.months);
            badgesArray.push(`<img src="${eligible[0]?.badge_image?.src || 'js/modules/kick/images/badge-subscriber.svg'}" class="badge">`);
        } else {
            badgesArray.push(`<img src="js/modules/kick/images/badge-${badge.type}.svg" class="badge">`);
        }
    });

    return badgesArray.join(' ');
}

async function loadKickSubBadges() {
    try {
        const corsProxy = getURLParam('corsProxy', '');
        const badgesUrl = corsProxy ? corsProxy + 'https://kick.com/badges' : 'https://kick.com/badges';
        const resp = await fetch(badgesUrl);
        const data = await resp.json();
        kickSubBadges = data.badge_tiers?.subscriber || [];
    } catch (e) {
        kickSubBadges = [];
    }
}

async function getKickEmotes(data, messageText) {
    let message = escapeHTML(messageText);
    if (!data.content_parts) return message;

    for (const part of data.content_parts) {
        if (part.type === 'emote') {
            message = message.replace(escapeHTML(part.text), `<img src="${part.src}" alt="${escapeHTML(part.text)}" class="emote">`);
        }
    }
    return message;
}

// ---- Kick Event Functions ----

async function kickChatMessage(data) {
    if (showKickMessages === false) return;
    if (ignoreUserList.includes(data.sender?.username?.toLowerCase())) return;
    if (data.content && data.content.startsWith('!') && ignoreCommands === true) return;

    const [avatarImage, badgeList] = await Promise.all([
        getKickAvatar(data.sender?.username),
        getKickBadges(data.sender?.identity?.badges)
    ]);

    const messageHtml = await getKickEmotes(data, data.content || '');

    // Check subscriber status from badges
    const kickBadges = data.sender?.identity?.badges || [];
    const isSubscriber = kickBadges.some(function(b) { return b.type === 'subscriber'; });

    createDanmakuChat('kick', {
        text: data.content,
        messageHtml: DOMPurify.sanitize(messageHtml, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'class'] }),
        username: data.sender?.username || 'Unknown',
        color: data.sender?.identity?.color || '#fff',
        avatar: avatarImage,
        badges: badgeList,
        isSubscriber: isSubscriber
    });
}

async function kickFollowMessage(data) {
    if (showKickFollows === false) return;

    createDanmakuEvent('kick', {
        username: data.user_name,
        color: '#4ecdc4',
        action: 'just followed!'
    });
}

async function kickSubMessage(data) {
    if (showKickSubs === false) return;

    createDanmakuEvent('kick', {
        username: data.user_name,
        color: '#4ecdc4',
        action: 'subscribed!'
    });
}

async function kickGiftSubMessage(data) {
    if (showKickSubs === false || showKickGiftedSubs === false) return;

    createDanmakuEvent('kick', {
        username: data.user_name,
        color: '#4ecdc4',
        action: 'gifted a sub to',
        value: data.recipient_name
    });
}

async function kickMassGiftSubMessage(data) {
    if (showKickSubs === false || showKickMassGiftedSubs === false) return;

    const subs = data.total > 1 ? 'subs' : 'sub';
    createDanmakuEvent('kick', {
        username: data.user_name,
        color: '#4ecdc4',
        action: 'is gifting',
        value: `${data.total} ${subs}!`
    });
}
