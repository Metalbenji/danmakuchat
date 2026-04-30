/* ============================================ */
/*          TWITCH MODULE - DANMAKU CHAT        */
/* ============================================ */

const twitchModule = true;
const showTwitch = getURLParam("showTwitch", true);
const showTwitchMessages = getURLParam("showTwitchMessages", true);
const showTwitchFollows = getURLParam("showTwitchFollows", true);
const showTwitchBits = getURLParam("showTwitchBits", true);
const showTwitchSubs = getURLParam("showTwitchSubs", true);
const showTwitchGiftedSubs = getURLParam("showTwitchGiftedSubs", true);
const showTwitchMassGiftedSubs = getURLParam("showTwitchMassGiftedSubs", true);
const showTwitchRewardRedemptions = getURLParam("showTwitchRewardRedemptions", true);
const showTwitchRaids = getURLParam("showTwitchRaids", true);
const showTwitchAnnouncements = getURLParam("showTwitchAnnouncements", true);
const showTwitchSharedChat = getURLParam("showTwitchSharedChat", true);

const twitchAvatars = new Map();
const twitchStreamer = {};

// ---- Twitch Event Handlers ----
const twitchMessageHandlers = {
    'Twitch.ChatMessage': (response) => {
        twitchChatMessage(response.data);
    },
    'Twitch.Follow': (response) => {
        twitchFollowMessage(response.data);
    },
    'Twitch.Announcement': (response) => {
        twitchAnnouncementMessage(response.data);
    },
    'Twitch.Cheer': (response) => {
        twitchBitsMessage(response.data);
    },
    'Twitch.RewardRedemption': (response) => {
        twitchRewardRedemption(response.data);
    },
    'Twitch.Sub': (response) => {
        twitchSubMessage(response.data);
    },
    'Twitch.ReSub': (response) => {
        twitchReSubMessage(response.data);
    },
    'Twitch.GiftSub': (response) => {
        twitchGiftMessage(response.data);
    },
    'Twitch.GiftBomb': (response) => {
        twitchGiftBombMessage(response.data);
    },
    'Twitch.Raid': (response) => {
        twitchRaidMessage(response.data);
    },
    'Twitch.ChatMessageDeleted': (response) => {
        // No-op for danmaku (messages float away)
    },
    'Twitch.UserBanned': (response) => {
        // No-op for danmaku
    },
    'Twitch.UserTimedOut': (response) => {
        // No-op for danmaku
    },
    'Twitch.SharedChatMessageDeleted': (response) => {
        // No-op for danmaku
    },
    'Twitch.SharedChatUserBanned': (response) => {
        // No-op for danmaku
    },
    'Twitch.SharedChatUserTimedout': (response) => {
        // No-op for danmaku
    },
};

if (showTwitch) {
    registerPlatformHandlersToStreamerBot(twitchMessageHandlers, '[Twitch]');
}

// ---- Badge/Avatar/Message Helpers ----

async function getTwitchBadges(badges) {
    if (!badges || !Array.isArray(badges)) return '';
    return badges.map(badge => `<img src="${badge.imageUrl}" class="badge">`).join('');
}

async function getTwitchAvatar(login) {
    if (twitchAvatars.has(login)) return twitchAvatars.get(login);

    try {
        const resp = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
            headers: {
                'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
            }
        });
        if (resp.ok) {
            const data = await resp.json();
            const url = data.data?.[0]?.profile_image_url;
            if (url) {
                twitchAvatars.set(login, url);
                return url;
            }
        }
    } catch (e) {
        // Silent fail
    }

    return `https://api.adorable.io/avatars/40/${login}.png`;
}

async function getTwitchMessageFromParts(parts) {
    if (!parts) return '';
    return parts.map(part => {
        if (part.type === 'emote') {
            if (part.source === 'Twemoji') {
                return escapeHTML(part.text);
            }
            return `<img src="${part.imageUrl}" alt="${escapeHTML(part.text)}" title="${escapeHTML(part.text)}" class="emote">`;
        }
        if (part.type === 'cheer') {
            return '';
        }
        return escapeHTML(part.text);
    }).join('');
}

// ---- Twitch Event Functions ----

async function twitchChatMessage(data) {
    if (showTwitchMessages === false) return;
    if (ignoreUserList.includes(data.user.login)) return;
    if (data.text.startsWith('!') && ignoreCommands === true) return;

    const [avatarImage, badgeList] = await Promise.all([
        getTwitchAvatar(data.user.login),
        getTwitchBadges(data.user.badges)
    ]);

    const messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuChat('twitch', {
        text: data.text,
        messageHtml: DOMPurify.sanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] }),
        username: data.user.name,
        color: data.user.color,
        avatar: avatarImage,
        badges: badgeList
    });
}

async function twitchFollowMessage(data) {
    if (showTwitchFollows === false) return;

    createDanmakuEvent('twitch', {
        username: data.user_name,
        color: '#ff6b6b',
        action: 'just followed!'
    });
}

async function twitchAnnouncementMessage(data) {
    if (showTwitchAnnouncements === false) return;

    const [badgeList] = await Promise.all([
        getTwitchBadges(data.user.badges)
    ]);

    const messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: data.user.name,
        color: data.user.color,
        action: 'announced:',
        badges: badgeList,
        messageHtml: DOMPurify.sanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchBitsMessage(data) {
    if (showTwitchBits === false) return;

    const bits = data.bits > 1 ? 'bits' : 'bit';
    const messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: data.user.name,
        color: '#00e5ff',
        action: 'cheered',
        value: `${data.bits} ${bits}`,
        messageHtml: DOMPurify.sanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchRewardRedemption(data) {
    if (showTwitchRewardRedemptions === false) return;

    createDanmakuEvent('twitch', {
        username: data.user_name,
        color: '#9147ff',
        action: 'redeemed',
        value: data.reward.title,
        messageHtml: escapeHTML(data.user_input || '')
    });
}

async function twitchSubMessage(data) {
    if (showTwitchSubs === false) return;

    const months = formatSubMonthDuration(data.duration_months);
    const tier = data.is_prime ? 'Prime' : 'Tier ' + Math.floor(data.sub_tier / 1000);

    createDanmakuEvent('twitch', {
        username: data.user.name,
        color: '#9147ff',
        action: 'subscribed!',
        value: `${months} (${tier})`
    });
}

async function twitchReSubMessage(data) {
    if (showTwitchSubs === false) return;

    const months = formatSubMonthDuration(data.cumulativeMonths);
    const tier = data.isPrime ? 'Prime' : 'Tier ' + Math.floor(data.subTier / 1000);
    const messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: data.user.name,
        color: '#9147ff',
        action: 'resubscribed!',
        value: `${months} (${tier})`,
        messageHtml: DOMPurify.sanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchGiftMessage(data) {
    if (showTwitchSubs === false || showTwitchGiftedSubs === false) return;
    if (data.fromCommunitySubGift && showTwitchGiftedSubs === false) return;

    const months = formatSubMonthDuration(data.durationMonths);
    createDanmakuEvent('twitch', {
        username: data.user.name,
        color: '#9147ff',
        action: `gifted a ${months} sub to`,
        value: data.recipient.name
    });
}

async function twitchGiftBombMessage(data) {
    if (showTwitchSubs === false || showTwitchMassGiftedSubs === false) return;

    const subs = data.total > 1 ? 'subs' : 'sub';
    createDanmakuEvent('twitch', {
        username: data.user.name,
        color: '#9147ff',
        action: 'is gifting',
        value: `${data.total} ${subs}!`
    });
}

async function twitchRaidMessage(data) {
    if (showTwitchRaids === false) return;

    const viewers = data.viewers > 1 ? 'viewers' : 'viewer';
    createDanmakuEvent('twitch', {
        username: data.from_broadcaster_user_name,
        color: '#ff6b35',
        action: 'raided with',
        value: `${data.viewers} ${viewers}`
    });
}
