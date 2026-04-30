/* ============================================ */
/*         YOUTUBE MODULE - DANMAKU CHAT        */
/* ============================================ */

const youtubeModule = true;
const showYoutube = getURLParam("showYoutube", true);
const showYouTubeMessages = getURLParam("showYouTubeMessages", true);
const showYouTubeSuperChats = getURLParam("showYouTubeSuperChats", true);
const showYouTubeSuperStickers = getURLParam("showYouTubeSuperStickers", true);
const showYouTubeSuperStickerGif = getURLParam("showYouTubeSuperStickerGif", true);
const showYouTubeMemberships = getURLParam("showYouTubeMemberships", true);
const showYouTubeGiftMemberships = getURLParam("showYouTubeGiftMemberships", true);
const showYouTubeMembershipsTrain = getURLParam("showYouTubeMembershipsTrain", true);

const youtubeUserColors = new Map();
let youTubeBTTVEmotes = [];

const youtubeMessageHandlers = {
    'YouTube.Message': (response) => {
        youTubeChatMessage(response.data);
    },
    'YouTube.SuperChat': (response) => {
        youTubeSuperChatMessage(response.data);
    },
    'YouTube.SuperSticker': (response) => {
        youTubeSuperStickerMessage(response.data);
    },
    'YouTube.NewSponsor': (response) => {
        youTubeNewSponsorMessage(response.data);
    },
    'YouTube.MemberMileStone': (response) => {
        youTubeNewSponsorMessage(response.data);
    },
    'YouTube.MembershipGift': (response) => {
        youTubeGiftBombMessage(response.data);
    },
    'YouTube.GiftMembershipReceived': (response) => {
        youTubeGiftBombReceivedMessage(response.data);
    },
};

if (showYoutube) {
    registerPlatformHandlersToStreamerBot(youtubeMessageHandlers, '[YouTube]');
}

// ---- Utility Functions ----

function getYouTubeUserColor(username) {
    if (youtubeUserColors.has(username)) {
        return youtubeUserColors.get(username);
    }
    const hue = Math.random() * 360;
    const color = `hsl(${hue}, 80%, 65%)`;
    youtubeUserColors.set(username, color);
    return color;
}

function getYouTubeBadges(data) {
    const { user } = data;
    const badges = [];
    if (user.isVerified) badges.push('<span class="badge verified"><i class="fa-solid fa-check"></i></span>');
    if (user.isSponsor) badges.push('<span class="badge member"><i class="fa-solid fa-star"></i></span>');
    if (user.isModerator) badges.push('<span class="badge mod"><i class="fa-solid fa-wrench"></i></span>');
    if (user.isOwner) badges.push('<span class="badge owner"><i class="fa-solid fa-video"></i></span>');
    return badges.join('');
}

async function getYouTubeEmotes(data, messageText) {
    let message = messageText;
    const channelId = data.broadcast?.channelId;
    if (!channelId) return escapeHTML(message);

    // Load BTTV emotes
    if (youTubeBTTVEmotes.length === 0) {
        try {
            const res = await fetch(`https://api.betterttv.net/3/cached/users/youtube/${channelId}`);
            const emoteData = await res.json();
            youTubeBTTVEmotes = [
                ...(emoteData.sharedEmotes || []),
                ...(emoteData.channelEmotes || [])
            ];
            if (youTubeBTTVEmotes.length === 0) {
                youTubeBTTVEmotes = [{ code: 'fakeemote', id: 'fakeemote' }];
            }
        } catch (err) {
            youTubeBTTVEmotes = [];
        }
    }

    const emoteMap = new Map();
    for (const emote of youTubeBTTVEmotes) {
        emoteMap.set(emote.code, `https://cdn.betterttv.net/emote/${emote.id}/1x`);
    }
    if (data.emotes) {
        for (const emote of data.emotes) {
            if (emote.imageUrl) {
                emoteMap.set(emote.name, emote.imageUrl);
            }
        }
    }

    // Simple token-based replacement
    const parts = [];
    let remaining = message;
    let found = true;
    while (found) {
        found = false;
        for (const [name, url] of emoteMap) {
            const idx = remaining.indexOf(name);
            if (idx !== -1) {
                if (idx > 0) parts.push(escapeHTML(remaining.slice(0, idx)));
                parts.push(`<img src="${url}" alt="${escapeHTML(name)}" class="emote">`);
                remaining = remaining.slice(idx + name.length);
                found = true;
                break;
            }
        }
        if (!found) {
            parts.push(escapeHTML(remaining));
        }
    }
    return parts.join('');
}

async function getYouTubeStickerImage(data) {
    const stack = [data];
    while (stack.length) {
        const current = stack.pop();
        if (current && typeof current === 'object') {
            if (current.imageUrl && typeof current.imageUrl === 'string') return current.imageUrl;
            for (const key in current) {
                if (Object.hasOwn(current, key)) stack.push(current[key]);
            }
        }
    }
    return null;
}

// ---- YouTube Event Functions ----

async function youTubeChatMessage(data) {
    if (showYouTubeMessages === false) return;
    if (ignoreUserList.includes(data.user.name.toLowerCase())) return;
    if (data.message.startsWith('!') && ignoreCommands === true) return;

    const badgeList = getYouTubeBadges(data);
    const messageHtml = await getYouTubeEmotes(data, data.message);
    const color = getYouTubeUserColor(data.user.name);

    createDanmakuChat('youtube', {
        text: data.message,
        messageHtml: DOMPurify.sanitize(messageHtml, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'class'] }),
        username: data.user.name,
        color: color,
        avatar: data.user.profileImageUrl,
        badges: badgeList
    });
}

async function youTubeSuperChatMessage(data) {
    if (showYouTubeSuperChats === false) return;

    const messageHtml = await getYouTubeEmotes(data, data.message);

    createDanmakuEvent('youtube', {
        username: data.user.name,
        color: '#ff0000',
        action: 'super chatted',
        value: data.amount,
        messageHtml: DOMPurify.sanitize(messageHtml, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'class'] })
    });
}

async function youTubeSuperStickerMessage(data) {
    if (showYouTubeSuperStickers === false) return;

    createDanmakuEvent('youtube', {
        username: data.user.name,
        color: '#ff4444',
        action: 'sent a super sticker',
        value: `(${data.amount})`
    });
}

async function youTubeNewSponsorMessage(data) {
    if (showYouTubeMemberships === false) return;

    const months = formatSubMonthDuration(data.months);

    createDanmakuEvent('youtube', {
        username: data.user.name,
        color: '#00b8d4',
        action: 'joined as a member!',
        value: months,
        messageHtml: data.message ? escapeHTML(data.message) : null
    });
}

async function youTubeGiftBombMessage(data) {
    if (showYouTubeMemberships === false || showYouTubeGiftMemberships === false) return;

    const count = data.count > 1 ? 'memberships' : 'membership';

    createDanmakuEvent('youtube', {
        username: data.user.name,
        color: '#00b8d4',
        action: 'gifted',
        value: `${data.count} ${count}`
    });
}

async function youTubeGiftBombReceivedMessage(data) {
    if (showYouTubeMemberships === false || showYouTubeGiftMemberships === false || showYouTubeMembershipsTrain === false) return;

    createDanmakuEvent('youtube', {
        username: data.gifter.name,
        color: '#00b8d4',
        action: 'gifted membership to',
        value: data.user.name
    });
}
