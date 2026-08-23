/* ============================================ */
/*        DANMAKU CHAT - CORE ENGINE            */
/* ============================================ */

// ---- Configuration ----
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isOBS = typeof window.obsstudio !== 'undefined';
const ignoreCommands = getURLParam("ignoreCommands", true);

// Read ALL settings from URL params
const CFG = {
    // Layer
    LAYER: getURLParam("layer", "back"),
    // Font
    fontSize: Number(getURLParam("fontSize", 2.5)),
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
    danmakuSpeed: Number(getURLParam("danmakuSpeed", 14)),
    speedRandomness: Number(getURLParam("speedRandomness", 2)),
    danmakuDensity: Number(getURLParam("danmakuDensity", 28)),
    laneGap: Number(getURLParam("laneGap", 40)),
    laneJitter: Number(getURLParam("laneJitter", 10)),
    maxDanmaku: Number(getURLParam("maxDanmaku", 80)),
    // Message Style
    chatBg: getURLParam("chatBg", "none"),
    chatBorder: getURLParam("chatBorder", "none"),
    danmakuOpacity: Number(getURLParam("danmakuOpacity", 1)),
    textShadow: getURLParam("textShadow", "medium"),
    // Badges, Avatars & Platform Logo — all share one size (pixels)
    showBadges: getURLParam("showBadges", true),
    showAvatar: getURLParam("showAvatar", true),
    iconSize: Number(getURLParam("iconSize", 0)),  // 0 = auto-scale with fontSize
    showUsername: getURLParam("showUsername", true),
    showSeparator: getURLParam("showSeparator", true),
    // Platform Badge
    platformBadge: getURLParam("platformBadge", "logo"),
    // Padding
    paddingX: Number(getURLParam("paddingX", 12)),
    paddingY: Number(getURLParam("paddingY", 4)),
    borderRadius: Number(getURLParam("borderRadius", 5)),
    elementGap: Number(getURLParam("elementGap", 5)),
    // Depth & Layers
    frontChance: Number(getURLParam("frontChance", 0.5)),


    depthEffect: getURLParam("depthEffect", true),
    depthMinScale: Number(getURLParam("depthMinScale", 0.2)),
    depthMaxScale: Number(getURLParam("depthMaxScale", 1.5)),
    depthMinOpacity: Number(getURLParam("depthMinOpacity", 0.3)),
    depthMaxOpacity: Number(getURLParam("depthMaxOpacity", 1.0)),
    backLayerBlur: Number(getURLParam("backLayerBlur", 2)),

    frontLayerGlow: getURLParam("frontLayerGlow", true),
    // Event Messages
    eventStyle: getURLParam("eventStyle", "solid"),
    eventOpacity: Number(getURLParam("eventOpacity", 1)),
    eventFontSize: getURLParam("eventFontSize", "much-larger"),
    eventDurationBonus: Number(getURLParam("eventDurationBonus", 2)),
    eventPaddingX: Number(getURLParam("eventPaddingX", 28)),
    eventPaddingY: Number(getURLParam("eventPaddingY", 8)),
    eventLeftPadding: Number(getURLParam("eventLeftPadding", 16)),
    showEventGlow: getURLParam("showEventGlow", true),
    eventPlatformColors: getURLParam("eventPlatformColors", true),
    highlightValueColor: getURLParam("highlightValueColor", "#fbbf24"),
    eventBorderRadius: Number(getURLParam("eventBorderRadius", 8)),
    // Filtering
    ignoreCommands: getURLParam("ignoreCommands", true),
    ignoreChatters: getURLParam("ignoreChatters", "Streamlabs,Streamelements"),
    minMsgLength: Number(getURLParam("minMsgLength", 0)),
    maxMsgLength: Number(getURLParam("maxMsgLength", 0)),
    spamProtection: Number(getURLParam("spamProtection", 0)),
    hideEmotes: getURLParam("hideEmotes", false),
    // Subscriber Images
    subscriberImages: getURLParam("subscriberImages", false),
    subscriberImagesOnlySubs: getURLParam("subscriberImagesOnlySubs", true),
    subscriberImageMaxHeight: Number(getURLParam("subscriberImageMaxHeight", 120)),
};

const ignoreUserList = (CFG.ignoreChatters || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean) || [];

// ---- Apply CSS Custom Properties ----
const root = document.documentElement.style;
root.setProperty('--dm-font-size', (16 * CFG.fontSize) + 'px');
root.setProperty('--dm-event-font-size', getEventFontSize());
root.setProperty('--dm-font-family', CFG.chatFontFamily + ', sans-serif');
root.setProperty('--dm-font-weight', CFG.fontWeight);
root.setProperty('--dm-opacity', CFG.danmakuOpacity);
root.setProperty('--dm-gap', CFG.elementGap + 'px');
root.setProperty('--dm-padding-x', CFG.paddingX + 'px');
root.setProperty('--dm-padding-y', CFG.paddingY + 'px');
root.setProperty('--dm-radius', CFG.borderRadius + 'px');
var effectiveIconSize = CFG.iconSize > 0 ? CFG.iconSize : Math.round(20 * CFG.fontSize);
root.setProperty('--dm-icon-size', effectiveIconSize + 'px');
root.setProperty('--dm-highlight-color', CFG.highlightValueColor);
root.setProperty('--dm-event-pad-x', CFG.eventPaddingX + 'px');
root.setProperty('--dm-event-pad-y', CFG.eventPaddingY + 'px');
root.setProperty('--dm-embed-image-max-h', CFG.subscriberImageMaxHeight + 'px');

// ---- Layer Setup ----
const danmakuLayer = document.getElementById('danmaku-layer');
danmakuLayer.classList.add('layer-' + CFG.LAYER);



// Apply layer-specific blur (distance effect)
if (CFG.LAYER === 'back') {
    danmakuLayer.style.filter = 'blur(' + CFG.backLayerBlur + 'px)';
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
// Each lane tracks the physics of the message currently occupying it
// (start time, width, scroll duration) so we can predict whether a new
// message would catch up to it mid-screen and overlap. This replaces the
// old "lane free after 30% of duration" rule which caused messages to
// bunch into evenly-spaced trains on a handful of lines.
var lanes = new Map(); // laneIndex -> { startTime, width, duration }

function _occupantSpeed(occ, containerWidth) {
    // Pixels per millisecond travelled along the scroll axis.
    // A message covers (containerWidth + own width) over its duration.
    return (containerWidth + occ.width) / (occ.duration * 1000);
}

function _laneWouldCollide(occ, candidate, containerWidth) {
    var margin = CFG.laneGap;
    var vOcc = _occupantSpeed(occ, containerWidth);
    var vNew = (containerWidth + candidate.width) / (candidate.duration * 1000);

    // Gap between the occupant's trailing (right) edge and the candidate's
    // leading (left) edge at the moment the candidate enters the screen:
    // the occupant has travelled elapsed*vOcc px, its right edge sits that
    // far past the right border minus its own width.
    var gapAtEntry = (candidate.startTime - occ.startTime) * vOcc - occ.width;
    if (gapAtEntry < margin) return true;

    // If the new message is slower or equal speed, the gap only grows.
    if (vNew <= vOcc) return false;

    // New message is faster: worst case is just before the occupant exits.
    var occExit = occ.startTime + occ.duration * 1000;
    var gapAtExit = gapAtEntry - (occExit - candidate.startTime) * (vNew - vOcc);
    return gapAtExit < margin;
}

function getAvailableLane(duration, elWidth, elHeight) {
    var containerHeight = window.innerHeight;
    var containerWidth = _containerW;
    // Safe lane height: density minus element height, so the bottom of the
    // message never extends past the viewport. Fall back to density if
    // elHeight isn't provided yet.
    var safeStep = (elHeight && elHeight > 0)
        ? Math.max(CFG.danmakuDensity, elHeight + 2)
        : CFG.danmakuDensity;
    var totalLanes = Math.max(1, Math.floor((containerHeight - (elHeight || 0)) / safeStep));
    if (totalLanes < 1) totalLanes = 1;
    var now = Date.now();
    var candidate = { startTime: now, width: elWidth || 0, duration: duration };

    // Shuffle start position so messages don't always go top→bottom
    var startOffset = Math.floor(Math.random() * totalLanes);

    // First pass: any lane where the new message provably can't catch up
    // to (or enter on top of) the current occupant?
    for (var attempts = 0; attempts < totalLanes; attempts++) {
        var lane = (startOffset + attempts) % totalLanes;
        var occ = lanes.get(lane);
        if (!occ || !_laneWouldCollide(occ, candidate, containerWidth)) {
            lanes.set(lane, candidate);
            return { index: lane, step: safeStep };
        }
    }

    // All lanes busy. Returning null tells the caller to hold the message
    // in a queue and retry shortly — far better than stacking it on top of
    // an existing message (the old behaviour that caused visible bunching).
    return null;
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
    var seed = username + '|' + text;
    var r = _hashStr(seed);
    if (r < CFG.frontChance) return 'front';
    return 'back';
}

function shouldShowMessage(type, data, forceFront) {
    // Force to front layer (used for subscriber image messages)
    if (forceFront) {
        return CFG.LAYER === 'front';
    }
    if (type === 'event') {
        // Events always route to front
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
    var size = effectiveIconSize;
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
    if (style === 'logo') {
        return '<span class="danmaku-platform"><img src="' + imgSrc + '" alt="' + platform + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;flex-shrink:0;"></span>';
    }
    if (style === 'pill') {
        return '<span class="danmaku-platform" style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;flex-shrink:0;"><span style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';display:block;"></span></span>';
    }
    if (style === 'name') {
        var name = platform.charAt(0).toUpperCase() + platform.slice(1);
        return '<span class="danmaku-platform" style="display:inline-flex;align-items:center;flex-shrink:0;background:' + color + ';border-radius:4px;padding:2px 6px;font-size:' + Math.round(size * 0.55) + 'px;font-weight:600;color:#fff;">' + name + '</span>';
    }
    if (style === 'hider') {
        var colorName = colorNames[platform] || (color + ' platform');
        return '<span class="danmaku-platform" style="display:inline-flex;align-items:center;flex-shrink:0;background:' + color + ';border-radius:4px;padding:2px 6px;font-size:' + Math.round(size * 0.55) + 'px;font-weight:600;color:#fff;">' + colorName + '</span>';
    }
    return '';
}

// ---- Danmaku Creation ----

// ---- Subscriber Image Embedding ----
// Regex to detect image URLs in chat messages.
// Matches: direct image extensions (.jpg, .jpeg, .png, .gif, .webp, .gifv)
// and known image hosts (imgur, i.imgur, cdn.discordapp, pbs.twimg, media.tenor, etc.)
var _imageExtRe = /\.(jpe?g|png|gif|webp|gifv|bmp|svg)(\?[^\s]*)?$/i;
var _imageHostRe = /\b(https?:\/\/(i\.)?imgur\.com\/[a-zA-Z0-9]+|https?:\/\/cdn\.discordapp\.com\/attachments\/\S+|https?:\/\/pbs\.twimg\.com\/media\/\S+|https?:\/\/media\.tenor\.com\/\S+|https?:\/\/c\.tenor\.com\/\S+|https?:\/\/i\.redd\.it\/\S+)/i;

function detectImageUrls(text) {
    var urls = [];
    // Split text into tokens and check each URL-like token
    var tokens = text.match(/(https?:\/\/\S+)/g);
    if (!tokens) return urls;
    for (var i = 0; i < tokens.length; i++) {
        var url = tokens[i].trim();
        // Strip trailing punctuation that isn't part of the URL
        url = url.replace(/[,;:!?)\]}>]+$/, '');
        if (_imageExtRe.test(url) || _imageHostRe.test(url)) {
            // Convert gifv to gif for embeddable display
            if (url.endsWith('.gifv')) url = url.slice(0, -1);
            urls.push(url);
        }
    }
    return urls;
}

function buildEmbedImageHtml(text) {
    var urls = detectImageUrls(text);
    if (urls.length === 0) return null;

    // Build the message: text with image URLs replaced by inline <img> tags
    var html = escapeHTML(text);
    var maxH = CFG.subscriberImageMaxHeight || 60;

    for (var i = 0; i < urls.length; i++) {
        var escapedUrl = escapeHTML(urls[i]);
        var escapedUrlEscaped = escapedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re = new RegExp(escapedUrlEscaped, 'g');
        var imgTag = '<img class="danmaku-embed-image" src="' + escapedUrl + '" alt="[image]" style="max-height:' + maxH + 'px;height:auto;width:auto;vertical-align:middle;border-radius:6px;object-fit:contain;display:inline-block;margin:0 4px;">';
        html = html.replace(re, imgTag);
    }

    return html;
}

// ---- Danmaku Creation ----

function createDanmakuChat(platform, data) {
    // Detect subscriber images before layer routing to force front layer
    var forceFront = false;
    if (CFG.subscriberImages) {
        var textRaw = data.text || data.message || '';
        var canEmbed = !CFG.subscriberImagesOnlySubs || data.isSubscriber;
        if (canEmbed && detectImageUrls(textRaw).length > 0) {
            forceFront = true;
        }
    }

    if (!shouldShowMessage('chat', data, forceFront)) return;

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

    // Avatar — URL or auto-generated placeholder
    if (CFG.showAvatar) {
        var avatarUrl = data.avatar || generateAvatarUrl(username, data.color);
        if (avatarUrl) {
            html += '<img class="danmaku-avatar" src="' + avatarUrl + '" alt="" style="width:' + effectiveIconSize + 'px;height:' + effectiveIconSize + 'px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.3);flex-shrink:0;">';
        }
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

    // Message — check for subscriber image embedding
    var msgContent = data.messageHtml || (CFG.hideEmotes ? cleanStringOfHTMLButEmotes(text) : escapeHTML(text));
    if (CFG.hideEmotes && !data.messageHtml) {
        msgContent = cleanStringOfHTMLButEmotes(text).then ? escapeHTML(text) : cleanStringOfHTMLButEmotes(text);
    }

    // Subscriber image embedding: detect image URLs and render inline (front layer only)
    if (CFG.subscriberImages && CFG.LAYER === 'front') {
        var canEmbed = !CFG.subscriberImagesOnlySubs || data.isSubscriber;
        if (canEmbed) {
            var imageUrls = detectImageUrls(text);
            if (imageUrls.length > 0) {
                var embedHtml = buildEmbedImageHtml(text);
                if (embedHtml) {
                    // If the platform already provided messageHtml (with emotes),
                    // we still want to embed images. Replace image URLs in the
                    // existing HTML or use the embed version.
                    msgContent = embedHtml;
                }
            }
        }
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

    // Force-set platform logo size directly on DOM — bypasses any CSS/cache issue
    var logoImg = el.querySelector('.danmaku-platform img');
    if (logoImg) {
        logoImg.style.setProperty('width', effectiveIconSize + 'px', 'important');
        logoImg.style.setProperty('height', effectiveIconSize + 'px', 'important');
        logoImg.style.setProperty('object-fit', 'contain', 'important');
        logoImg.style.setProperty('flex-shrink', '0', 'important');
    }

    // Fallback: if real avatar URL fails, swap to generated placeholder
    var fallbackAvatar = generateAvatarUrl(username, data.color);
    var avatarEl = el.querySelector('.danmaku-avatar');
    if (avatarEl && avatarEl.src.indexOf('data:') !== 0) {
        avatarEl.onerror = function() { this.src = fallbackAvatar; };
    }

    // Fallback: hide embed images that fail to load (show text placeholder)
    var embedImgs = el.querySelectorAll('.danmaku-embed-image');
    embedImgs.forEach(function(img) {
        img.onerror = function() {
            this.style.display = 'none';
        };
    });

    spawnDanmaku(el, false);
}

function createDanmakuEvent(platform, data) {
    if (!shouldShowMessage('event')) return;

    var el = document.createElement('div');
    var cls = 'danmaku-item event ' + platform;
    cls += ' event-style-' + CFG.eventStyle;
    el.className = cls;

    // Apply event background via inline style so the alpha comes from
    // the eventOpacity setting — the Event Opacity slider directly
    // controls how see-through the background is.
    var a = CFG.eventOpacity;
    if (CFG.eventStyle === 'solid') {
        el.style.background = 'linear-gradient(135deg, rgba(128,0,255,' + a + '), rgba(255,0,128,' + a + '))';
    } else if (CFG.eventStyle === 'glass') {
        el.style.background = 'rgba(255,255,255,' + (a * 0.15) + ')';
    } else if (CFG.eventStyle === 'bordered') {
        el.style.background = 'transparent';
    } else if (CFG.eventStyle === 'minimal') {
        el.style.background = 'transparent';
    }

    if (!CFG.eventPlatformColors) {
        el.classList.add('event-no-platform-color');
    }

    // Apply event border radius
    el.style.borderRadius = CFG.eventBorderRadius + 'px';

    var html = '';

    // Platform badge
    html += buildPlatformBadge(platform);

    // Badges
    if (CFG.showBadges && data.badges) {
        html += '<span class="danmaku-badges">' + data.badges + '</span>';
    }

    // Avatar — URL or auto-generated placeholder
    if (CFG.showAvatar) {
        var evtAvatarUrl = data.avatar || generateAvatarUrl(data.username || '', data.color);
        if (evtAvatarUrl) {
            html += '<img class="danmaku-avatar" src="' + evtAvatarUrl + '" alt="" style="width:' + effectiveIconSize + 'px;height:' + effectiveIconSize + 'px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.3);flex-shrink:0;">';
        }
    }

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

    // Force-set platform logo size directly on DOM — bypasses any CSS/cache issue
    var logoImg = el.querySelector('.danmaku-platform img');
    if (logoImg) {
        logoImg.style.setProperty('width', effectiveIconSize + 'px', 'important');
        logoImg.style.setProperty('height', effectiveIconSize + 'px', 'important');
        logoImg.style.setProperty('object-fit', 'contain', 'important');
        logoImg.style.setProperty('flex-shrink', '0', 'important');
    }

    // Fallback: if real avatar URL fails, swap to generated placeholder
    var evtFallbackAvatar = generateAvatarUrl(data.username || '', data.color);
    var evtAvatarEl = el.querySelector('.danmaku-avatar');
    if (evtAvatarEl && evtAvatarEl.src.indexOf('data:') !== 0) {
        evtAvatarEl.onerror = function() { this.src = evtFallbackAvatar; };
    }

    spawnDanmaku(el, true);
}

// Messages waiting for a lane to free up (FIFO, so chat order is kept).
// Capped: if the queue itself overflows during a sustained flood, the
// oldest waiting messages are dropped rather than dumped on screen at once.
var MAX_PENDING_DANMAKU = 30;
var _pendingDanmaku = []; // [{ el, duration, isEvent }]
var _drainScheduled = false;

function spawnDanmaku(el, isEvent) {
    scheduleCull();

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

    // Layer speed multiplier: front is fastest, back is slowest (parallax depth)
    // Front = 0.7x (faster), Middle = 1.0x (normal), Back = 1.4x (slower)
    var layerSpeedMult = 1.0;
    if (CFG.LAYER === 'front') layerSpeedMult = 0.7;
    else if (CFG.LAYER === 'back') layerSpeedMult = 1.4;
    baseDuration = baseDuration * layerSpeedMult;
    baseDuration = Math.max(2, baseDuration);

    // Depth effect: random zoom/opacity for chat messages on back layer
    // Only applies when depthEffect is enabled AND using multiple layers.
    // Uses CSS custom property --dm-depth-scale so it composites with the
    // @keyframes translate3d() instead of clashing with it.
    // Opacity is multiplied with the user's opacity setting so the slider
    // still has an effect when depth is active.
    if (CFG.depthEffect && !isEvent && CFG.LAYER === 'back') {
        var depthScale = CFG.depthMinScale + Math.random() * (CFG.depthMaxScale - CFG.depthMinScale);
        var depthOpacity = CFG.depthMinOpacity + Math.random() * (CFG.depthMaxOpacity - CFG.depthMinOpacity);
        el.style.setProperty('--dm-depth-scale', depthScale.toFixed(3));
        el.style.setProperty('--dm-opacity', (CFG.danmakuOpacity * depthOpacity).toFixed(3));
    }

    // Append hidden so offsetWidth/offsetHeight are measurable, then try to
    // launch immediately. If every lane is occupied the element stays hidden
    // in the pending queue until a lane frees up.
    el.style.visibility = 'hidden';
    el.dataset.dmWaiting = '1';
    danmakuLayer.appendChild(el);

    _pendingDanmaku.push({ el: el, duration: baseDuration, isEvent: !!isEvent });
    _drainPending();
}

function _drainPending() {
    if (_pendingDanmaku.length === 0) return;

    // Launch as many queued messages as lanes safely allow (in order).
    while (_pendingDanmaku.length > 0) {
        var item = _pendingDanmaku[0];
        // Element may have been removed by culling/trimming while waiting.
        if (!item.el.parentNode) {
            _pendingDanmaku.shift();
            continue;
        }
        var elWidth = item.el.offsetWidth;
        var elHeight = item.el.offsetHeight;
        var laneInfo = getAvailableLane(item.duration, elWidth, elHeight);
        if (!laneInfo) break; // no safe lane right now — retry later

        _pendingDanmaku.shift();
        delete item.el.dataset.dmWaiting;
        _launchDanmaku(item.el, item.duration, item.isEvent, laneInfo, elWidth, elHeight);
    }

    // Trim waiting + on-screen excess to prevent memory leaks. Prefer
    // dropping the oldest WAITING messages (never shown yet).
    while (danmakuLayer.children.length > CFG.maxDanmaku) {
        var victim = null;
        for (var ci = 0; ci < danmakuLayer.children.length; ci++) {
            var child = danmakuLayer.children[ci];
            if (child.dataset && child.dataset.dmWaiting) { victim = child; break; }
        }
        if (!victim) {
            // Nothing waiting — drop the oldest animated element instead.
            victim = danmakuLayer.firstChild;
        }
        if (!victim) break;
        for (var pi = 0; pi < _pendingDanmaku.length; pi++) {
            if (_pendingDanmaku[pi].el === victim) { _pendingDanmaku.splice(pi, 1); break; }
        }
        victim.remove();
    }
    // Hard cap the wait queue during sustained floods.
    while (_pendingDanmaku.length > MAX_PENDING_DANMAKU) {
        var dropped = _pendingDanmaku.shift();
        if (dropped.el.parentNode) dropped.el.remove();
    }

    // Still have waiters? Poll again shortly (lanes free up continuously).
    if (_pendingDanmaku.length > 0 && !_drainScheduled) {
        _drainScheduled = true;
        setTimeout(function() {
            _drainScheduled = false;
            _drainPending();
        }, 250);
    }
}

function _launchDanmaku(el, baseDuration, isEvent, laneInfo, elWidth, elHeight) {
    var containerWidth = _containerW;
    var containerHeight = _containerH;

    // Vertical jitter: nudge the message randomly inside its lane band so
    // reused lanes don't form perfectly rigid conveyor-belt lines. Clamped
    // to half the slack in the band so neighbouring lanes never overlap.
    var maxTop = Math.max(0, containerHeight - elHeight);
    var bandSlack = Math.max(0, laneInfo.step - elHeight);
    var jMax = Math.max(0, Math.min(CFG.laneJitter, bandSlack / 2));
    var jitter = jMax > 0 ? (Math.random() * 2 - 1) * jMax : 0;
    var laneTop = Math.min(Math.max(0, laneInfo.index * laneInfo.step + jitter), maxTop);

    // Position element at the starting edge
    el.style.top = laneTop + 'px';

    // Use native CSS @keyframes animation (GPU-composited, buttery smooth)
    var isRight = CFG.direction === 'right';
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
        el.style.willChange = 'auto';
        el.remove();
    });
    // Safety net: if animationend doesn't fire (OBS edge case), remove after duration + 2s
    setTimeout(function() {
        if (el.parentNode) {
            el.style.willChange = 'auto';
            el.remove();
        }
    }, (baseDuration + 2) * 1000);
}

// Cached container dimensions — updated on resize, avoids reading innerWidth
// on every spawn which can force layout if anything changed.
var _containerW = window.innerWidth;
var _containerH = window.innerHeight;
window.addEventListener('resize', function() {
    lanes.clear();
    _containerW = window.innerWidth;
    _containerH = window.innerHeight;
    _drainPending(); // lanes were just cleared — retry queued messages now
});

// Debounce cull so multiple rapid spawns don't force layout repeatedly.
var _cullScheduled = false;
function scheduleCull() {
    if (_cullScheduled) return;
    _cullScheduled = true;
    requestAnimationFrame(function() {
        _cullScheduled = false;
        cullOldDanmaku();
    });
}

function cullOldDanmaku() {
    var items = danmakuLayer.children;
    if (items.length < CFG.maxDanmaku) return;
    var toRemove = items.length - CFG.maxDanmaku + 10;
    var removed = 0;
    var cw = _containerW;
    // Walk backwards so live NodeList stays valid after remove().
    // Use computed left position + offsetWidth to avoid getBoundingClientRect
    // which forces a full synchronous layout/reflow — the #1 perf killer.
    for (var i = items.length - 1; i >= 0 && removed < toRemove; i--) {
        var item = items[i];
        // Never cull messages waiting in the launch queue — they haven't
        // been shown yet (no animation assigned on purpose).
        if (item.dataset && item.dataset.dmWaiting) continue;
        // Check if animation has finished or element is off-screen.
        // Elements that finished animating have animation === '' or 'none'.
        var anim = getComputedStyle(item).animation;
        if (!anim || anim === 'none') {
            item.remove();
            removed++;
            continue;
        }
        // Fallback: check left position (cheap read, no layout forced)
        var left = item.offsetLeft;
        var w = item.offsetWidth;
        if (left + w < -50 || left > cw + 50) {
            item.remove();
            removed++;
        }
    }
}

// ---- Avatar Generation ----
// Generates a deterministic SVG data-URI avatar (gradient + silhouette).
// No network needed — works from file:// and OBS Browser Source.
function generateAvatarUrl(username, color, size) {
    if (!username) return '';
    var sz = size || effectiveIconSize || 40;

    // Deterministic hash → unique gradient per user
    var hash = 0;
    for (var i = 0; i < username.length; i++) {
        hash = ((hash << 5) - hash + username.charCodeAt(i)) | 0;
    }
    var hue1 = Math.abs(hash) % 360;
    var hue2 = (hue1 + 45) % 360;

    // Use provided color if available, otherwise use hash-derived gradient
    var fill;
    if (color && color.indexOf('#') === 0) {
        fill = color;
    } else {
        fill = 'url(#ag)';
    }

    // Person silhouette path (generic user icon)
    var headR = sz * 0.18;
    var headCy = sz * 0.33;
    var bodyTop = sz * 0.55;
    var bodyW = sz * 0.6;

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '">'
        + '<defs><linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">'
        + '<stop offset="0%" stop-color="hsl(' + hue1 + ',65%,45%)"/>'
        + '<stop offset="100%" stop-color="hsl(' + hue2 + ',65%,35%)"/>'
        + '</linearGradient></defs>'
        + '<circle cx="' + (sz/2) + '" cy="' + (sz/2) + '" r="' + (sz/2) + '" fill="' + fill + '"/>'
        + '<circle cx="' + (sz/2) + '" cy="' + headCy + '" r="' + headR + '" fill="rgba(255,255,255,0.85)"/>'
        + '<ellipse cx="' + (sz/2) + '" cy="' + (sz * 0.92) + '" rx="' + bodyW + '" ry="' + (sz * 0.35) + '" fill="rgba(255,255,255,0.85)"/>'
        + '</svg>';

    return 'data:image/svg+xml,' + encodeURIComponent(svg);
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

// ---- Window resize handler ---- (handled above with dimension caching)

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

    // Subscriber image demo messages (only used when subscriberImages is enabled)
    var demoImageChats = [
        { platform: 'twitch', username: 'SubWithImage', color: '#ff9800', text: 'Check this out! https://placehold.co/200x100/9146ff/white?text=Subscribe', isSubscriber: true },
        { platform: 'twitch', username: 'ImgurFan', color: '#e91e63', text: 'OMG look https://placehold.co/150x150/ff6b6b/white?text=LOL', isSubscriber: true },
        { platform: 'kick', username: 'KickSubImage', color: '#53fc18', text: 'https://placehold.co/180x80/53fc18/black?text=KICK+SUB', isSubscriber: true },
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
                var chat;
                // Occasionally send image demo messages (when feature is enabled)
                if (CFG.subscriberImages && Math.random() < 0.15) {
                    chat = demoImageChats[Math.floor(Math.random() * demoImageChats.length)];
                } else {
                    chat = demoChats[Math.floor(Math.random() * demoChats.length)];
                }
                createDanmakuChat(chat.platform, { text: chat.text, username: chat.username, color: chat.color, isSubscriber: chat.isSubscriber });
            }
        } catch (err) {
            console.warn('[DanmakuChat] Demo error:', err);
        }
    }

    setTimeout(sendBuiltinDemo, 500);
    setInterval(sendBuiltinDemo, 1500 + Math.random() * 1500);
}
