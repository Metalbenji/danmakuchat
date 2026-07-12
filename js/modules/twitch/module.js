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
const ignoreCommands = getURLParam("ignoreCommands", true);
const twitchAvatars = new Map();
const twitchStreamer = {};

// ---- Streamer.bot user info extraction ----
// Streamer.bot uses different structures per event type.
// ChatMessage nests user info under data.message
// Other events use data.user (nested object) or flat fields like data.user_name
// Streamer.bot includes profileImageUrl in the user data — no separate API call needed.
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
            profileImageUrl: data.message.profileImageUrl || data.message.profile_image_url || '',
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
            profileImageUrl: data.user.profileImageUrl || data.user.profile_image_url || '',
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
            profileImageUrl: data.profileImageUrl || data.profile_image_url || data.user_profileImageUrl || '',
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
    var sz = (typeof effectiveIconSize !== 'undefined') ? effectiveIconSize : 20;
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
        return '<img src="' + src + '" class="badge" alt="" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain;flex-shrink:0;" onerror="this.style.display=\'none\'">';
    }).join('');
}

async function getTwitchAvatar(login, color, profileImageUrl) {
    if (!login) return '';
    // Check cache first
    if (twitchAvatars.has(login)) return twitchAvatars.get(login);

    // Prefer Streamer.bot's provided profileImageUrl (from event data).
    if (profileImageUrl && profileImageUrl.indexOf('http') === 0) {
        twitchAvatars.set(login, profileImageUrl);
        return profileImageUrl;
    }

    // Streamer.bot doesn't always include avatar URLs.
    // Fetch from decapi.me which returns the actual Twitch CDN URL as text.
    // Has CORS headers (Access-Control-Allow-Origin: *) so works from file://.
    try {
        var resp = await fetch('https://decapi.me/twitch/avatar/' + encodeURIComponent(login));
        if (resp.ok) {
            var avatarUrl = (await resp.text()).trim();
            if (avatarUrl && avatarUrl.indexOf('http') === 0) {
                twitchAvatars.set(login, avatarUrl);
                return avatarUrl;
            }
        }
    } catch(err) {
        // Fetch failed (offline, etc.) — fall through to placeholder
    }

    // Final fallback: generated SVG placeholder
    var fallback = generateAvatarUrl(login, color);
    twitchAvatars.set(login, fallback);
    return fallback;
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

// ---- Helper: enrich event data with avatar + badges ----
async function _enrichEvent(data, user) {
    var login = user ? user.login : '';
    var avatar = await getTwitchAvatar(login, user ? user.color : '', user ? user.profileImageUrl : '');
    var badges = user ? await getTwitchBadges(user.badges) : '';
    return { avatar: avatar, badges: badges };
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
        var avatarImage = await getTwitchAvatar(userLogin, user.color, user.profileImageUrl);
        var badgeList = await getTwitchBadges(user.badges);
        var messageFromParts = await getTwitchMessageFromParts(data.parts);

        // Check subscriber status from badges (subscriber or founder badge)
        var isSubscriber = false;
        if (user.badges && Array.isArray(user.badges)) {
            isSubscriber = user.badges.some(function(b) {
                var sid = b.set_id || b.id || '';
                return sid === 'subscriber' || sid === 'founder';
            });
        }

        createDanmakuChat('twitch', {
            text: text,
            messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] }),
            username: user.displayName || userLogin,
            color: user.color,
            avatar: avatarImage,
            badges: badgeList,
            isSubscriber: isSubscriber
        });
    } catch(err) {
        console.error('[Twitch] twitchChatMessage error:', err);
    }
}

async function twitchFollowMessage(data) {
    if (showTwitchFollows === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var userColor = user ? user.color : '#ff6b6b';
    var extra = await _enrichEvent(data, user);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: userColor,
        action: 'just followed!',
        avatar: extra.avatar,
        badges: extra.badges
    });
}

async function twitchAnnouncementMessage(data) {
    if (showTwitchAnnouncements === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var userColor = user ? user.color : '#fff';
    var extra = await _enrichEvent(data, user);
    var messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: userColor,
        action: 'announced:',
        avatar: extra.avatar,
        badges: extra.badges,
        messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchBitsMessage(data) {
    if (showTwitchBits === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var bits = data.bits || 0;
    var bitWord = bits > 1 ? 'bits' : 'bit';
    var extra = await _enrichEvent(data, user);
    var messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#00e5ff',
        action: 'cheered',
        value: bits + ' ' + bitWord,
        avatar: extra.avatar,
        badges: extra.badges,
        messageHtml: safeSanitize(messageFromParts, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'title', 'class'] })
    });
}

async function twitchRewardRedemption(data) {
    if (showTwitchRewardRedemptions === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || '');
    var extra = await _enrichEvent(data, user);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'redeemed',
        value: data.reward ? data.reward.title : '',
        avatar: extra.avatar,
        badges: extra.badges,
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
    var extra = await _enrichEvent(data, user);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'subscribed!',
        value: monthsStr + ' (' + tierStr + ')',
        avatar: extra.avatar,
        badges: extra.badges
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
    var extra = await _enrichEvent(data, user);
    var messageFromParts = await getTwitchMessageFromParts(data.parts);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'resubscribed!',
        value: monthsStr + ' (' + tierStr + ')',
        avatar: extra.avatar,
        badges: extra.badges,
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
    var extra = await _enrichEvent(data, user);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'gifted a ' + monthsStr + ' sub to',
        value: recipientName,
        avatar: extra.avatar,
        badges: extra.badges
    });
}

async function twitchGiftBombMessage(data) {
    if (showTwitchSubs === false || showTwitchMassGiftedSubs === false) return;

    var user = _twitchUser(data);
    var displayName = user ? (user.displayName || user.name) : (data.user_name || 'Unknown');
    var total = data.total || 1;
    var subWord = total > 1 ? 'subs' : 'sub';
    var extra = await _enrichEvent(data, user);

    createDanmakuEvent('twitch', {
        username: displayName,
        color: '#9147ff',
        action: 'is gifting',
        value: total + ' ' + subWord + '!',
        avatar: extra.avatar,
        badges: extra.badges
    });
}

async function twitchRaidMessage(data) {
    if (showTwitchRaids === false) return;

    var viewers = data.viewers || 1;
    var viewerWord = viewers > 1 ? 'viewers' : 'viewer';
    var user = _twitchUser(data);
    var raider = user ? (user.displayName || user.name) : (data.from_broadcaster_user_name || 'Unknown');
    var extra = await _enrichEvent(data, user);

    createDanmakuEvent('twitch', {
        username: raider,
        color: '#ff6b35',
        action: 'raided with',
        value: viewers + ' ' + viewerWord,
        avatar: extra.avatar,
        badges: extra.badges
    });
}
