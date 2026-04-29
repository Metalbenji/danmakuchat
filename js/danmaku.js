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

    el.innerHTML = DOMPurify.sanitize(html, {
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

    el.innerHTML = DOMPurify.sanitize(html, {
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

    el.style.top = `${lane * danmakuDensity}px`;
    el.style.right = `-${el.offsetWidth + 20}px`;
    el.style.animationDuration = `${duration}s`;

    danmakuLayer.appendChild(el);

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
