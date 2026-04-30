/* ============================================ */
/*        DANMAKU CHAT - CORE ENGINE            */
/* ============================================ */

// ---- Configuration ----
const isOBS = typeof window.obsstudio !== 'undefined';

const LAYER = getURLParam("layer", "middle"); // front, middle, back
const showPlatform = getURLParam("showPlatform", true);
const showBadges = getURLParam("showBadges", true);
const showAvatar = getURLParam("showAvatar", true);
const chatFontSize = getURLParam("chatFontSize", "normal"); // small, normal, large, xlarge
const chatFontFamily = getURLParam("chatFontFamily", "DM Sans");
const danmakuSpeed = getURLParam("danmakuSpeed", 8); // seconds to cross screen
const danmakuDensity = getURLParam("danmakuDensity", 28); // lane height in px
const danmakuOpacity = getURLParam("danmakuOpacity", 1);
const backLayerBlur = getURLParam("backLayerBlur", 1.5);
const backLayerOpacity = getURLParam("backLayerOpacity", 0.7);
const maxDanmaku = getURLParam("maxDanmaku", 80);
const ignoreCommands = getURLParam("ignoreCommands", true);
const ignoreChatters = getURLParam("ignoreChatters", "Streamlabs,Streamelements");
const ignoreUserList = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

// Chance-based layer routing (only used on middle layer to know if a message belongs here or back)
const frontChance = getURLParam("frontChance", 0.02); // 2% chance normal msgs appear on front
const backChance = getURLParam("backChance", 0.3); // 30% chance normal msgs go to back layer

// ---- Layer Setup ----
const danmakuLayer = document.getElementById('danmaku-layer');
danmakuLayer.classList.add(`layer-${LAYER}`);

if (LAYER === 'back') {
    danmakuLayer.style.filter = `blur(${backLayerBlur}px)`;
    danmakuLayer.style.opacity = backLayerOpacity;
}

// Font settings
document.body.style.fontFamily = chatFontFamily;
document.body.classList.add(`font-scale-${chatFontSize}`);

// ---- Lane Management ----
let currentLane = 0;
const lanes = new Map(); // laneIndex -> { element, endTime }

function getAvailableLane(duration) {
    const containerHeight = window.innerHeight;
    const totalLanes = Math.floor(containerHeight / danmakuDensity);
    const now = Date.now();

    // Try the next lane
    for (let attempts = 0; attempts < totalLanes; attempts++) {
        const lane = currentLane % totalLanes;
        currentLane++;

        const laneData = lanes.get(lane);
        if (!laneData || laneData.endTime <= now) {
            lanes.set(lane, { endTime: now + (duration * 0.3) * 1000 }); // Reserve lane for 30% of animation
            return lane;
        }
    }

    // All lanes busy, find the one that frees up soonest
    let soonestLane = 0;
    let soonestEnd = Infinity;
    for (const [lane, data] of lanes.entries()) {
        if (data.endTime < soonestEnd) {
            soonestEnd = data.endTime;
            soonestLane = lane;
        }
    }
    currentLane = (soonestLane + 1) % totalLanes;
    lanes.set(soonestLane, { endTime: now + (duration * 0.3) * 1000 });
    return soonestLane;
}

// ---- Layer Routing ----
function shouldShowMessage(type) {
    // Events always go to front layer
    if (type === 'event') {
        return LAYER === 'front';
    }

    // Chat messages are distributed across layers
    if (LAYER === 'front') {
        return Math.random() < frontChance;
    }
    if (LAYER === 'back') {
        return Math.random() < backChance;
    }
    // Middle layer gets the rest
    return Math.random() >= frontChance;
}

// ---- Danmaku Creation ----

function createDanmakuChat(platform, data) {
    if (!shouldShowMessage('chat')) return;

    if (ignoreCommands && data.text && data.text.startsWith('!')) return;
    if (data.user && ignoreUserList.includes(data.user.toLowerCase())) return;

    const el = document.createElement('div');
    el.className = `danmaku-item chat ${platform}`;

    let html = '';

    // Platform icon
    if (showPlatform) {
        html += `<span class="danmaku-platform"><img src="js/modules/${platform}/images/logo-${platform}.svg" alt="${platform}"></span>`;
    }

    // Badges
    if (showBadges && data.badges) {
        html += `<span class="danmaku-badges">${data.badges}</span>`;
    }

    // Avatar
    if (showAvatar && data.avatar) {
        html += `<img class="danmaku-avatar" src="${data.avatar}" alt="">`;
    }

    // Username with glow
    const userColor = data.color || '#fff';
    html += `<span class="danmaku-username" style="color: ${userColor}">${escapeHTML(data.username)}</span>`;
    html += `<span class="danmaku-separator">:</span>`;

    // Message
    html += `<span class="danmaku-message">${data.messageHtml || escapeHTML(data.text || '')}</span>`;

    el.innerHTML = safeSanitize(html, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt', 'title', 'class']
    });

    spawnDanmaku(el);
}

function createDanmakuEvent(platform, data) {
    if (!shouldShowMessage('event')) return;

    const el = document.createElement('div');
    el.className = `danmaku-item event ${platform}`;

    let html = '';

    // Platform icon
    if (showPlatform) {
        html += `<span class="danmaku-platform"><img src="js/modules/${platform}/images/logo-${platform}.svg" alt="${platform}"></span>`;
    }

    // Username
    const userColor = data.color || '#fff';
    html += `<span class="danmaku-username" style="color: ${userColor}">${escapeHTML(data.username)}</span>`;

    // Action
    if (data.action) {
        html += `<span class="danmaku-action"> ${data.action} </span>`;
    }

    // Value
    if (data.value) {
        html += `<span class="danmaku-value">${data.value}</span>`;
    }

    // Message
    if (data.messageHtml) {
        html += `<span class="danmaku-message">${data.messageHtml}</span>`;
    }

    el.innerHTML = safeSanitize(html, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt', 'title', 'class']
    });

    spawnDanmaku(el);
}

function spawnDanmaku(el) {
    // Remove old items if we exceed max
    cullOldDanmaku();

    const duration = danmakuSpeed; // seconds
    const lane = getAvailableLane(duration);

    // Append to DOM first so offsetWidth is accurate
    el.style.visibility = 'hidden';
    danmakuLayer.appendChild(el);

    el.style.top = `${lane * danmakuDensity}px`;
    el.style.right = `-${el.offsetWidth + 20}px`;
    el.style.animationDuration = `${duration}s`;
    el.style.visibility = '';

    // Remove after animation completes
    el.addEventListener('animationend', () => {
        el.remove();
    });
}

function cullOldDanmaku() {
    const items = danmakuLayer.querySelectorAll('.danmaku-item');
    if (items.length >= maxDanmaku) {
        const toRemove = items.length - maxDanmaku + 10;
        for (let i = 0; i < toRemove; i++) {
            items[i]?.remove();
        }
    }
}

// ---- Utilities ----
const _escapeDiv = document.createElement('div');
function escapeHTML(str) {
    if (!str) return '';
    _escapeDiv.textContent = str;
    return _escapeDiv.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) {
        let n = (num / 1000000).toFixed(1);
        if (n.endsWith('.0')) n = n.slice(0, -2);
        return n + 'M';
    }
    if (num >= 1000) {
        let n = (num / 1000).toFixed(1);
        if (n.endsWith('.0')) n = n.slice(0, -2);
        return n + 'K';
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
    return `${months} ${months === 1 ? 'month' : 'months'}`;
}

function createRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function cleanStringOfHTMLButEmotes(string) {
    const container = document.createElement('div');
    container.innerHTML = string;
    const emotes = container.querySelectorAll('img.emote[alt]');
    emotes.forEach(img => {
        const textNode = document.createTextNode(img.getAttribute('alt'));
        img.replaceWith(textNode);
    });
    return container.textContent || "";
}

// ---- Window resize handler ----
window.addEventListener('resize', () => {
    lanes.clear();
});

// ---- Preview Mode ----
const isPreview = getURLParam("preview", false);
if (isPreview) document.body.classList.add('preview-mode');

// ---- DOMPurify fallback ----
function safeSanitize(html, options) {
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
        return DOMPurify.sanitize(html, options);
    }
    return html;
}

// ---- Demo Mode (postMessage listener) ----
const isDemo = getURLParam("demo", false);
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

    // Start demo after a short delay
    setTimeout(sendBuiltinDemo, 500);
    setInterval(sendBuiltinDemo, 1500 + Math.random() * 1500);
}
