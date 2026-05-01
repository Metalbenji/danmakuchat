/* ============================================ */
/*          TWITCH MODULE - DANMAKU CHAT        */
/* ============================================ */
/*  Streamer.bot event data field mapping:       */
/*  ChatMessage:  data.message.username,          */
/*                data.message.displayName,       */
/*                data.message.color,             */
/*                data.message.badges,            */
/*                data.text, data.parts            */
/*  Follow/etc:  data.user_name (flat),           */
/*                data.user.name (nested)         */
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

// ---- Streamer.bot user info extraction ----
// Streamer.bot uses different structures per event type.
// ChatMessage nests user info under data.message
// Other events use data.user (nested object) or flat fields like data.user_name
function _twitchUser(data) {
    // ChatMessage: data.message.username, data.message.displayName, etc.
    if (data.message && data.message.username) {
        return {
            login:      data.message.username,
            displayName:data.message.displayName || data.message.username,
            name:       data.message.displayName || data.message.username,
            color:      data.message.color,
            badges:     data.message.badges,
            id:         data.message.userId || data.message.userID,
        };
    }
    // Other events: data.user (nested object)
    if (data.user) {
        return {
            login:      data.user.login || data.user.username || data.user.name || '',
            displayName:data.user.displayName || data.user.name || '',
            name:       data.user.name || data.user.displayName || '',
            color:      data.user.color,
            badges:     data.user.badges,
            id:         data.user.id || data.user.userId,
        };
    }
    // Flat fields (Follow, Raid, RewardRedemption, etc.)
    if (data.user_name || data.username) {
        return {
            login:      data.user_login || data.username || data.user_name || '',
            displayName:data.display_name || data.user_name || data.username || '',
            name:       data.user_name || data.display_name || data.username || '',
            color:      data.color,
            badges:     data.badges,
            id:         data.user_id,
        };
    }
    return null;
}

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
    return badges.map(function(badge) {
        // Prefer Streamer.bot's provided imageUrl (most reliable)
        var src = badge.imageUrl || '';
        // Fallback to Twitch badge CDN if we have a set_id
        if (!src && badge.set_id) {
            src = 'https://badges.twitch.tv/v1/badges/' + badge.set_id + '/1';
        }
        if (!src && badge.id) {
            src = 'https://badges.twitch.tv/v1/badges/' + badge.id + '/' + (badge.version || 1);
        }
        if (!src) return '';
        return '<img src="' + src + '" class="badge" alt="" onerror="this.style.display=\'none\'">';
    }).join('');
}

async function getTwitchAvatar(login, color) {
    if (!login) return '';
    // Try Twitch API first (works when served over http, not file://)
    if (twitchAvatars.has(login)) return twitchAvatars.get(login);

    try {
        var resp = await fetch('https://api.twitch.tv/helix/users?login=' + encodeURIComponent(login), {
            headers: {
                'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
            }
        });
        if (resp.ok) {
            var result = await resp.json();
            var url = result.data && result.data[0] && result.data[0].profile_image_url;
            if (url) {
                twitchAvatars.set(login, url);
                return url;
            }
        }
    } catch (e) {
        // fetch fails from file:// — generate inline avatar
    }

    // Generate a CSS avatar circle with the user's initial (always works, no network)
    var initial = login.charAt(0).toUpperCase();
    var bgColor = color || '#6441a5'; // Twitch purple default
    var avatarHtml = '<span class="danmaku-avatar-inline" style="background:' + bgColor +
        ';color:#fff;font-weight:700;font-size:' + Math.max(10, 14) + 'px;display:flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">' +
        escapeHTML(initial) + '</span>';
    twitchAvatars.set(login, avatarHtml);
    return avatarHtml;
}

async function getTwitchMessageFromParts(parts) {
    if (!parts || !Array.isArray(parts)) return '';
    return parts.map(function(part) {
        if (part.type === 'emote') {
            if (part.source === 'Twemoji') {
                return escapeHTML(part.text);
            }
            return '<img src="' + part.imageUrl + '" alt="' + escapeHTML(part.text) + '" title="' + escapeHTML(part.text) + '" class="emote">';
        }
        if (part.type === 'cheer') {
            return '';
        }
        if (typeof part.text === 'string') {
            return escapeHTML(part.text);
        }
        return '';
    }).join('');
}

// ---- Twitch Event Functions ----

async function twitchChatMessage(data) {
    if (showTwitchMessages === false) return;
    if (!data) return;

    var user = _twitchUser(data);
    if (!user) return;

    var userLogin = user.login || '';
    if (ignoreUserList.includes(userLogin.toLowerCase())) return;

    var text = data.text || '';
    if (text.startsWith('!') && ignoreCommands === true) return;

    try {
        var avatarImage = await getTwitchAvatar(userLogin, user.color);
        var badgeList = await getTwitchBadges(user.badges);
        var messageFromParts = await getTwitchMessageFromParts(data.parts);

        createDanmakuChat('twitch', {
            text: text,
            messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] }),
            username: user.displayName || userLogin,
            color: user.color,
            avatar: avatarImage,
            badges: badgeList
        });
    } catch(err) {
        console.error('[Twitch] twitchChatMessage error:', err);
    }
}

async function twitchFollowMessage(data) {
    if (showTwitchFollows === false) return;

    createDanmakuEvent('twitch', {
        username: data.user_name || data.username || '',
        color: '#ff6b6b',
        action: 'just followed!'
    });
}

async function twitchAnnouncementMessage(data) {
    if (showTwitchAnnouncements === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var userColor = user ? user.color : '#fff';
    var badgeList = user ? await getTwitchBadges(user.badges) : '';
    var messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: userColor,
        action: 'announced:',
        badges: badgeList,
        messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchBitsMessage(data) {
    if (showTwitchBits === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var bits = data.bits || 0;
    var bitWord = bits > 1 ? 'bits' : 'bit';
    var messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#00e5ff',
        action: 'cheered',
        value: bits + ' ' + bitWord,
        messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchRewardRedemption(data) {
    if (showTwitchRewardRedemptions === false) return;

    createDanmakuEvent('twitch', {
        username: data.user_name || data.username || '',
        color: '#9147ff',
        action: 'redeemed',
        value: data.reward ? data.reward.title : '',
        messageHtml: escapeHTML(data.user_input || '')
    });
}

async function twitchSubMessage(data) {
    if (showTwitchSubs === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var months = data.duration_months || data.cumulativeMonths || 1;
    var isPrime = data.is_prime || data.isPrime || false;
    var tier = data.sub_tier || data.subTier || 1000;
    var monthsStr = formatSubMonthDuration(months);
    var tierStr = isPrime ? 'Prime' : 'Tier ' + Math.floor(tier / 1000);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'subscribed!',
        value: monthsStr + ' (' + tierStr + ')'
    });
}

async function twitchReSubMessage(data) {
    if (showTwitchSubs === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var months = data.cumulativeMonths || data.duration_months || 1;
    var isPrime = data.isPrime || data.is_prime || false;
    var tier = data.subTier || data.sub_tier || 1000;
    var monthsStr = formatSubMonthDuration(months);
    var tierStr = isPrime ? 'Prime' : 'Tier ' + Math.floor(tier / 1000);
    var messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'resubscribed!',
        value: monthsStr + ' (' + tierStr + ')',
        messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchGiftMessage(data) {
    if (showTwitchSubs === false || showTwitchGiftedSubs === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var months = data.durationMonths || data.duration_months || 1;
    var recipientName = data.recipient ? (data.recipient.displayName || data.recipient.name || data.recipient.username) : 'someone';
    var monthsStr = formatSubMonthDuration(months);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'gifted a ' + monthsStr + ' sub to',
        value: recipientName
    });
}

async function twitchGiftBombMessage(data) {
    if (showTwitchSubs === false || showTwitchMassGiftedSubs === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var total = data.total || 1;
    var subWord = total > 1 ? 'subs' : 'sub';

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'is gifting',
        value: total + ' ' + subWord + '!'
    });
}

async function twitchRaidMessage(data) {
    if (showTwitchRaids === false) return;

    var viewers = data.viewers || 1;
    var viewerWord = viewers > 1 ? 'viewers' : 'viewer';
    var raider = data.from_broadcaster_user_name || data.user_name || 'Unknown';

    createDanmakuEvent('twitch', {
        username: raider,
        color: '#ff6b35',
        action: 'raided with',
        value: viewers + ' ' + viewerWord
    });
}
