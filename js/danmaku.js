/* ============================================ */
/*        DANMAKU CHAT - CORE ENGINE            */
/* ============================================ */

// ---- Configuration ----
const isOBS = typeof window.obsstudio !== 'undefined';

// Read ALL settings from URL params
const CFG = {
    // Layer
    LAYER: getURLParam("layer", "middle"),
    // Font
    fontSize: Number(getURLParam("fontSize", 1)),
    chatFontFamily: getURLParam("chatFontFamily", "DM Sans"),
    fontWeight: getURLParam("fontWeight", "normal"),
    // Background
    bgColor: getURLParam("bgColor", "#000000"),
    bgOpacity: Number(getURLParam("bgOpacity", 0)),
    // Timestamps
    showTimestamps: getURLParam("showTimestamps", false),
    use24h: getURLParam("use24h", false),
    // Direction
    direction: getURLParam("direction", "left"),
    // Speed & Density
    danmakuSpeed: Number(getURLParam("danmakuSpeed", 8)),
    speedRandomness: Number(getURLParam("speedRandomness", 2)),
    danmakuDensity: Number(getURLParam("danmakuDensity", 28)),
    maxDanmaku: Number(getURLParam("maxDanmaku", 80)),
    // Message Style
    chatBg: getURLParam("chatBg", "none"),
    chatBorder: getURLParam("chatBorder", "none"),
    danmakuOpacity: Number(getURLParam("danmakuOpacity", 1)),
    textShadow: getURLParam("textShadow", "medium"),
    // Badges & Avatars
    showBadges: getURLParam("showBadges", true),
    showAvatar: getURLParam("showAvatar", true),
    avatarSize: Number(getURLParam("avatarSize", 20)),
    showUsername: getURLParam("showUsername", true),
    showSeparator: getURLParam("showSeparator", true),
    // Platform Badge
    platformBadge: getURLParam("platformBadge", "logo"),
    badgeSize: Number(getURLParam("badgeSize", 1.1)),
    // Padding
    paddingX: Number(getURLParam("paddingX", 12)),
    paddingY: Number(getURLParam("paddingY", 4)),
    borderRadius: Number(getURLParam("borderRadius", 5)),
    elementGap: Number(getURLParam("elementGap", 5)),
    // Depth & Layers
    frontChance: Number(getURLParam("frontChance", 0.05)),
    backChance: Number(getURLParam("backChance", 0.4)),
    depthEffect: getURLParam("depthEffect", false),
    depthMinScale: Number(getURLParam("depthMinScale", 0.45)),
    depthMaxScale: Number(getURLParam("depthMaxScale", 1.3)),
    depthMinOpacity: Number(getURLParam("depthMinOpacity", 0.3)),
    depthMaxOpacity: Number(getURLParam("depthMaxOpacity", 1.0)),
    backLayerBlur: Number(getURLParam("backLayerBlur", 1.5)),
    backLayerOpacity: Number(getURLParam("backLayerOpacity", 0.7)),
    frontLayerGlow: getURLParam("frontLayerGlow", true),
    // Event Messages
    eventStyle: getURLParam("eventStyle", "solid"),
    eventOpacity: Number(getURLParam("eventOpacity", 1)),
    eventFontSize: getURLParam("eventFontSize", "larger"),
    eventDurationBonus: Number(getURLParam("eventDurationBonus", 2)),
    eventPaddingX: Number(getURLParam("eventPaddingX", 28)),
    eventPaddingY: Number(getURLParam("eventPaddingY", 8)),
    eventLeftPadding: Number(getURLParam("eventLeftPadding", 16)),
    showEventGlow: getURLParam("showEventGlow", true),
    eventPlatformColors: getURLParam("eventPlatformColors", true),
    highlightValueColor: getURLParam("highlightValueColor", "#fbbf24"),
    // Filtering
    ignoreCommands: getURLParam("ignoreCommands", true),
    ignoreChatters: getURLParam("ignoreChatters", "Streamlabs,Streamelements"),
    minMsgLength: Number(getURLParam("minMsgLength", 0)),
    maxMsgLength: Number(getURLParam("maxMsgLength", 0)),
    spamProtection: Number(getURLParam("spamProtection", 0)),
    hideEmotes: getURLParam("hideEmotes", false),
};

const ignoreUserList = (CFG.ignoreChatters || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean) || [];

// ---- Apply CSS Custom Properties ----
const root = document.documentElement.style;
root.setProperty('--dm-font-size', (16 * CFG.fontSize) + 'px');
root.setProperty('--dm-event-font-size', getEventFontSize());
root.setProperty('--dm-font-family', CFG.chatFontFamily + ', sans-serif');
root.setProperty('--dm-font-weight', CFG.fontWeight);
// Only set opacity when not default — opacity:1 even at full creates a compositing layer that dims text
if (CFG.danmakuOpacity < 1) {
    root.setProperty('--dm-opacity', CFG.danmakuOpacity);
}
root.setProperty('--dm-gap', CFG.elementGap + 'px');
root.setProperty('--dm-padding-x', CFG.paddingX + 'px');
root.setProperty('--dm-padding-y', CFG.paddingY + 'px');
root.setProperty('--dm-radius', CFG.borderRadius + 'px');
root.setProperty('--dm-avatar-size', CFG.avatarSize + 'px');
root.setProperty('--dm-badge-scale', CFG.badgeSize);
root.setProperty('--dm-highlight-color', CFG.highlightValueColor);
root.setProperty('--dm-event-opacity', CFG.eventOpacity);
root.setProperty('--dm-event-pad-x', CFG.eventPaddingX + 'px');
root.setProperty('--dm-event-pad-y', CFG.eventPaddingY + 'px');

// ---- Layer Setup ----
const danmakuLayer = document.getElementById('danmaku-layer');
danmakuLayer.classList.add('layer-' + CFG.LAYER);



if (CFG.LAYER === 'back') {
    danmakuLayer.style.filter = 'blur(' + CFG.backLayerBlur + 'px)';
    danmakuLayer.style.opacity = CFG.backLayerOpacity;
}

// ---- Apply body-level styles ----
document.body.style.fontFamily = CFG.chatFontFamily + ', sans-serif';
document.body.style.fontWeight = CFG.fontWeight;

// Direction class
if (CFG.direction === 'right') {
    document.body.classList.add('direction-right');
    danmakuLayer.classList.add('direction-right');
}

// Chat background style
danmakuLayer.setAttribute('data-chat-bg', CFG.chatBg);
danmakuLayer.setAttribute('data-chat-border', CFG.chatBorder);
danmakuLayer.setAttribute('data-text-shadow', CFG.textShadow);

// Event style
danmakuLayer.setAttribute('data-event-style', CFG.eventStyle);
if (CFG.showEventGlow) {
    danmakuLayer.classList.add('event-glow');
} else {
    danmakuLayer.classList.remove('event-glow');
}

// Background color/opacity (for preview mode)
if (CFG.bgOpacity > 0) {
    document.body.style.background = CFG.bgColor;
    document.body.style.opacity = 1; // Keep body fully visible
    danmakuLayer.style.opacity = Math.max(danmakuLayer.style.opacity || 1, CFG.bgOpacity > 0 ? 1 : 1);
}

// ---- Helper: Get event font size ----
function getEventFontSize() {
    var base = 18 * CFG.fontSize;
    switch (CFG.eventFontSize) {
        case 'same': return (16 * CFG.fontSize) + 'px';
        case 'slightly-larger': return base + 'px';
        case 'larger': return (base * 1.15) + 'px';
        case 'much-larger': return (base * 1.35) + 'px';
        default: return base + 'px';
    }
}

// ---- Spam Protection ----
var spamTracker = new Map(); // username -> lastMessageTime

function checkSpamProtection(username) {
    if (!CFG.spamProtection || CFG.spamProtection <= 0) return false;
    var now = Date.now();
    var lastTime = spamTracker.get(username.toLowerCase());
    if (lastTime && (now - lastTime) < CFG.spamProtection) return true;
    spamTracker.set(username.toLowerCase(), now);
    return false;
}

// ---- Lane Management ----
var currentLane = 0;
var lanes = new Map(); // laneIndex -> { element, endTime }

function getAvailableLane(duration) {
    var containerHeight = window.innerHeight;
    var totalLanes = Math.floor(containerHeight / CFG.danmakuDensity);
    if (totalLanes < 1) totalLanes = 1;
    var now = Date.now();

    // Shuffle start position so messages don't always go top→bottom
    var startOffset = Math.floor(Math.random() * totalLanes);

    // Try lanes in randomised order
    for (var attempts = 0; attempts < totalLanes; attempts++) {
        var lane = (startOffset + attempts) % totalLanes;

        var laneData = lanes.get(lane);
        if (!laneData || laneData.endTime <= now) {
            lanes.set(lane, { endTime: now + (duration * 0.3) * 1000 });
            return lane;
        }
    }

    // All lanes busy, find the one that frees up soonest
    var soonestLane = 0;
    var soonestEnd = Infinity;
    for (var entry of lanes.entries()) {
        if (entry[1].endTime < soonestEnd) {
            soonestEnd = entry[1].endTime;
            soonestLane = entry[0];
        }
    }
    lanes.set(soonestLane, { endTime: now + (duration * 0.3) * 1000 });
    return soonestLane;
}

// ---- Layer Routing ----
// Deterministic hash so all OBS sources agree which layer each message goes to.
// Without this, each source independently randomises and the same message
// appears on every layer (or gets split inconsistently).

function _hashStr(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return (hash >>> 0) / 4294967296; // normalise to 0–1
}

function _getAssignedLayer(username, text) {
    var seed = username + '|' + text + '|' + Date.now();
    var r = _hashStr(seed);
    if (r < CFG.frontChance) return 'front';
    if (r < CFG.frontChance + CFG.backChance) return 'back';
    return 'middle';
}

function shouldShowMessage(type, data) {
    // Events only show on front layer
    if (type === 'event') {
        return CFG.LAYER === 'front';
    }
    // Chat: deterministically route to a layer
    var username = (data && (data.username || data.user || '')) || '';
    var text = (data && (data.text || data.message || '')) || '';
    return _getAssignedLayer(username, text) === CFG.LAYER;
}

// ---- Platform badge HTML ----
function buildPlatformBadge(platform) {
    var style = CFG.platformBadge;
    if (style === 'off') return '';
    var imgSrc = 'js/modules/' + platform + '/images/logo-' + platform + '.svg';
    var scale = CFG.badgeSize;
    var colors = {
        twitch: '#9146ff', youtube: '#ff0000', kick: '#53fc18', tiktok: '#ff0050',
        streamelements: '#62c54e', streamlabs: '#32a0da', patreon: '#ff424d',
        kofi: '#49c2d1', tipeeestream: '#ff6b35', fourthwall: '#ffc400'
    };
    var colorNames = {
        twitch: 'purple platform', youtube: 'red platform', kick: 'green platform',
        tiktok: 'pink platform', streamelements: 'green platform', streamlabs: 'blue platform',
        patreon: 'red platform', kofi: 'teal platform', tipeeestream: 'orange platform',
        fourthwall: 'yellow platform'
    };
    var color = colors[platform] || '#888';
    var logoSize = Math.round(18 * scale);
    if (style === 'logo') {
        return '<span class="danmaku-platform"><img src="' + imgSrc + '" alt="' + platform + '" style="width:' + logoSize + 'px;height:' + logoSize + 'px;"></span>';
    }
    if (style === 'pill') {
        // Colored dot, same size as logo
        return '<span class="danmaku-platform" style="display:inline-flex;align-items:center;justify-content:center;width:' + logoSize + 'px;height:' + logoSize + 'px;flex-shrink:0;"><span style="width:' + logoSize + 'px;height:' + logoSize + 'px;border-radius:50%;background:' + color + ';display:block;"></span></span>';
    }
    if (style === 'name') {
        // Platform name with colored background pill
        var name = platform.charAt(0).toUpperCase() + platform.slice(1);
        return '<span class="danmaku-platform" style="display:inline-flex;align-items:center;flex-shrink:0;background:' + color + ';border-radius:4px;padding:2px 6px;font-size:' + Math.round(10 * scale) + 'px;font-weight:600;color:#fff;">' + name + '</span>';
    }
    if (style === 'hider') {
        // Color name instead of platform name (e.g. "purple platform")
        var colorName = colorNames[platform] || (color + ' platform');
        return '<span class="danmaku-platform" style="display:inline-flex;align-items:center;flex-shrink:0;background:' + color + ';border-radius:4px;padding:2px 6px;font-size:' + Math.round(10 * scale) + 'px;font-weight:600;color:#fff;">' + colorName + '</span>';
    }
    return '';
}

// ---- Danmaku Creation ----

function createDanmakuChat(platform, data) {
    if (!shouldShowMessage('chat', data)) return;

    // Filtering
    if (CFG.ignoreCommands && data.text && data.text.startsWith('!')) return;
    var username = data.username || data.user || '';
    if (username && ignoreUserList.includes(username.toLowerCase())) return;
    if (checkSpamProtection(username)) return;
    var text = data.text || data.message || '';
    if (CFG.minMsgLength > 0 && text.length < CFG.minMsgLength) return;
    if (CFG.maxMsgLength > 0 && text.length > CFG.maxMsgLength) return;

    var el = document.createElement('div');
    var cls = 'danmaku-item chat ' + platform;
    if (CFG.chatBg !== 'dark') cls += ' bg-' + CFG.chatBg;
    if (CFG.chatBorder !== 'subtle') cls += ' border-' + CFG.chatBorder;
    el.className = cls;

    var html = '';

    // Platform badge
    html += buildPlatformBadge(platform);

    // Badges
    if (CFG.showBadges && data.badges) {
        html += '<span class="danmaku-badges">' + data.badges + '</span>';
    }

    // Avatar
    if (CFG.showAvatar && data.avatar) {
        html += '<img class="danmaku-avatar" src="' + data.avatar + '" alt="">';
    }

    // Username
    if (CFG.showUsername) {
        var userColor = data.color || '#fff';
        html += '<span class="danmaku-username" style="color:' + userColor + '">' + escapeHTML(username) + '</span>';
    }

    // Separator
    if (CFG.showSeparator && CFG.showUsername) {
        html += '<span class="danmaku-separator">:</span>';
    }

    // Message
    var msgContent = data.messageHtml || (CFG.hideEmotes ? cleanStringOfHTMLButEmotes(text) : escapeHTML(text));
    if (CFG.hideEmotes && !data.messageHtml) {
        msgContent = cleanStringOfHTMLButEmotes(text).then ? escapeHTML(text) : cleanStringOfHTMLButEmotes(text);
    }
    html += '<span class="danmaku-message">' + msgContent + '</span>';

    // Timestamp
    if (CFG.showTimestamps) {
        var now = new Date();
        var timeStr = CFG.use24h
            ? now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
            : (now.getHours() % 12 || 12) + ':' + now.getMinutes().toString().padStart(2, '0') + (now.getHours() >= 12 ? ' PM' : ' AM');
        html += '<span class="danmaku-timestamp">' + timeStr + '</span>';
    }

    el.innerHTML = safeSanitize(html, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt', 'title', 'class', 'style']
    });

    spawnDanmaku(el, false);
}

function createDanmakuEvent(platform, data) {
    if (!shouldShowMessage('event')) return;

    var el = document.createElement('div');
    var cls = 'danmaku-item event ' + platform;
    cls += ' event-style-' + CFG.eventStyle;
    el.className = cls;

    if (!CFG.eventPlatformColors) {
        el.classList.add('event-no-platform-color');
    }

    var html = '';

    // Platform badge
    html += buildPlatformBadge(platform);

    // Username
    var userColor = data.color || '#fff';
    html += '<span class="danmaku-username" style="color:' + userColor + '">' + escapeHTML(data.username || '') + '</span>';

    // Action
    if (data.action) {
        html += '<span class="danmaku-action"> ' + escapeHTML(data.action) + ' </span>';
    }

    // Value (use highlight color)
    if (data.value) {
        html += '<span class="danmaku-value">' + escapeHTML(data.value) + '</span>';
    }

    // Message
    if (data.messageHtml) {
        html += '<span class="danmaku-message">' + data.messageHtml + '</span>';
    } else if (data.message) {
        html += '<span class="danmaku-message">' + escapeHTML(data.message) + '</span>';
    }

    el.innerHTML = safeSanitize(html, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt', 'title', 'class', 'style']
    });

    spawnDanmaku(el, true);
}

function spawnDanmaku(el, isEvent) {
    cullOldDanmaku();

    // Calculate duration with randomness
    var baseDuration = CFG.danmakuSpeed;
    if (CFG.speedRandomness > 0) {
        var randomExtra = (Math.random() - 0.5) * 2 * CFG.speedRandomness;
        baseDuration = Math.max(2, baseDuration + randomExtra);
    }
    // Events get extra duration
    if (isEvent && CFG.eventDurationBonus > 0) {
        baseDuration += CFG.eventDurationBonus;
    }

    var lane = getAvailableLane(baseDuration);
    var isRight = CFG.direction === 'right';

    // Depth effect: random zoom/opacity for chat messages on middle layer
    // Only applies when depthEffect is enabled AND using multiple layers
    if (CFG.depthEffect && !isEvent && CFG.LAYER === 'middle') {
        var depthScale = 0.85 + Math.random() * 0.3; // 0.85–1.15 (subtle range)
        var depthOpacity = 0.7 + Math.random() * 0.3;  // 0.7–1.0
        el.style.transform = 'scale(' + depthScale.toFixed(3) + ')';
        el.style.opacity = depthOpacity.toFixed(3);
    }

    // Append to DOM first so offsetWidth is accurate
    el.style.visibility = 'hidden';
    danmakuLayer.appendChild(el);

    var elWidth = el.offsetWidth;
    var containerWidth = window.innerWidth;

    // Position element at the starting edge
    el.style.top = (lane * CFG.danmakuDensity) + 'px';

    // Use native CSS @keyframes animation (GPU-composited, buttery smooth)
    if (isRight) {
        // Left to Right: start off-screen left
        el.style.left = -(elWidth + 20) + 'px';
        el.style.animation = 'danmaku-scroll-right ' + baseDuration.toFixed(2) + 's linear forwards';
    } else {
        // Right to Left (default): start at right edge
        el.style.left = containerWidth + 'px';
        el.style.animation = 'danmaku-scroll ' + baseDuration.toFixed(2) + 's linear forwards';
    }

    el.style.visibility = '';

    // Clean up element when animation finishes
    el.addEventListener('animationend', function() {
        el.remove();
    });
    // Safety net: if animationend doesn't fire (OBS edge case), remove after duration + 2s
    setTimeout(function() {
        if (el.parentNode) el.remove();
    }, (baseDuration + 2) * 1000);
}

function cullOldDanmaku() {
    var items = danmakuLayer.querySelectorAll('.danmaku-item');
    if (items.length < CFG.maxDanmaku) return;
    var containerRect = danmakuLayer.getBoundingClientRect();
    var toRemove = items.length - CFG.maxDanmaku + 10;
    var removed = 0;
    for (var i = 0; i < items.length && removed < toRemove; i++) {
        var rect = items[i].getBoundingClientRect();
        // Only cull if fully off-screen (with 50px buffer)
        if (rect.right < containerRect.left - 50 || rect.left > containerRect.right + 50) {
            items[i].remove();
            removed++;
        }
    }
}

// ---- Utilities ----
var _escapeDiv = document.createElement('div');
function escapeHTML(str) {
    if (!str) return '';
    _escapeDiv.textContent = str;
    return _escapeDiv.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) {
        var n = (num / 1000000).toFixed(1);
        if (n.endsWith('.0')) n = n.slice(0, -2);
        return n + 'M';
    }
    if (num >= 1000) {
        var n2 = (num / 1000).toFixed(1);
        if (n2.endsWith('.0')) n2 = n2.slice(0, -2);
        return n2 + 'K';
    }
    return num.toString();
}

function formatCurrency(amount, currencyCode) {
    if (!currencyCode) currencyCode = 'USD';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatSubMonthDuration(months) {
    return months + ' ' + (months === 1 ? 'month' : 'months');
}

function createRandomString(length) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var result = "";
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function cleanStringOfHTMLButEmotes(string) {
    var container = document.createElement('div');
    container.innerHTML = string;
    var emotes = container.querySelectorAll('img.emote[alt]');
    emotes.forEach(function(img) {
        var textNode = document.createTextNode(img.getAttribute('alt'));
        img.replaceWith(textNode);
    });
    return container.textContent || "";
}

// ---- Window resize handler ----
window.addEventListener('resize', function() {
    lanes.clear();
});

// ---- Preview Mode ----
var isPreview = getURLParam("preview", false);
if (isPreview) document.body.classList.add('preview-mode');

// ---- DOMPurify fallback ----
function safeSanitize(html, options) {
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
        return DOMPurify.sanitize(html, options);
    }
    return html;
}

// ---- Demo Mode (postMessage listener) ----
var isDemo = getURLParam("demo", false);
window.addEventListener("message", function(e) {
    if (!e.data || !e.data.__danmakuDemo) return;
    var msg = e.data;
    if (msg.msgType === "chat") {
        createDanmakuChat(msg.platform, msg.data);
    } else if (msg.msgType === "event") {
        createDanmakuEvent(msg.platform, msg.data);
    }
});

// Built-in demo messages if ?demo=true is in the URL
// Skip when in preview iframe — settings.js drives the demo via postMessage
if (isDemo) {
    var demoChats = [
        { platform: 'twitch', username: 'NightOwl42', color: '#ff6b6b', text: 'This stream is amazing!' },
        { platform: 'twitch', username: 'PixelWizard', color: '#9147ff', text: 'LETS GOOO!' },
        { platform: 'twitch', username: 'StreamQueen', color: '#00bcd4', text: 'First time here, love the vibes' },
        { platform: 'twitch', username: 'xX_Gamer_Xx', color: '#4caf50', text: 'PogChamp PogChamp' },
        { platform: 'twitch', username: 'CosmicDust', color: '#e91e63', text: 'How long have you been streaming?' },
        { platform: 'youtube', username: 'GamerPro99', color: '#ff0000', text: 'Awesome content as always!' },
        { platform: 'youtube', username: 'TechSavvy', color: '#f44336', text: 'Can you do a tutorial on this?' },
        { platform: 'youtube', username: 'MusicLover', color: '#e91e63', text: 'This background music is perfect' },
        { platform: 'kick', username: 'KickFan2024', color: '#53fc18', text: 'Kick streaming is the future!' },
        { platform: 'kick', username: 'GreenMachine', color: '#8bc34a', text: 'Love the energy on this stream' },
        { platform: 'tiktok', username: 'TikTokStar', color: '#ff0050', text: 'Going viral for this!' },
        { platform: 'tiktok', username: 'DanceKing', color: '#ff4081', text: 'Send this to everyone lol' },
        { platform: 'twitch', username: 'ModeratorBot', color: '#ffd700', text: 'Be nice in chat everyone!' },
        { platform: 'twitch', username: 'SubHero', color: '#ff9800', text: 'Just subscribed! Keep it up!' },
        { platform: 'youtube', username: 'LongTimeFan', color: '#795548', text: 'Been watching for 3 years, never disappointed' },
    ];

    var demoEvents = [
        { platform: 'twitch', username: 'NewViewer123', color: '#4fc3f7', action: 'followed' },
        { platform: 'twitch', username: 'GenerousDonor', color: '#ce93d8', action: 'subscribed for 6 months' },
        { platform: 'twitch', username: 'GiftKing', color: '#ffb74d', action: 'gifted 10 subs!' },
        { platform: 'youtube', username: 'SuperFan', color: '#f44336', action: 'Super Chatted $5.00' },
        { platform: 'youtube', username: 'MemberMax', color: '#e91e63', action: 'became a member!' },
        { platform: 'kick', username: 'KickRaider', color: '#53fc18', action: 'raided with 250 viewers!' },
        { platform: 'twitch', username: 'CheerLeader', color: '#00e676', action: 'cheered 1000 bits!' },
        { platform: 'twitch', username: 'MassGiftBot', color: '#ffd740', action: 'gifted 50 subs!' },
    ];

    function sendBuiltinDemo() {
        try {
            if (Math.random() < 0.2) {
                var evt = demoEvents[Math.floor(Math.random() * demoEvents.length)];
                createDanmakuEvent(evt.platform, { username: evt.username, color: evt.color, action: evt.action });
            } else {
                var chat = demoChats[Math.floor(Math.random() * demoChats.length)];
                createDanmakuChat(chat.platform, { text: chat.text, username: chat.username, color: chat.color });
            }
        } catch (err) {
            console.warn('[DanmakuChat] Demo error:', err);
        }
    }

    setTimeout(sendBuiltinDemo, 500);
    setInterval(sendBuiltinDemo, 1500 + Math.random() * 1500);
}
