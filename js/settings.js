/* ============================================ */
/*        DANMAKU CHAT - SETTINGS LOGIC          */
/*     Live Preview, Demo Mode, URL Builder      */
/* ============================================ */

(function () {
    'use strict';

    // ─── Section Toggle ───────────────────────────
    window.toggleSection = function (header) {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
    };

    // ─── Scroll to Section ────────────────────────
    window.scrollToSection = function (id) {
        const panelBody = document.querySelector('.panel-body');
        const section = document.getElementById(id);
        if (!panelBody || !section) return;

        // Ensure section is not collapsed
        const collapsedState = section.classList.contains('collapsed');
        if (collapsedState) {
            const header = section.querySelector('.section-header');
            if (header) toggleSection(header);
        }

        // Smooth scroll within the panel body
        const offset = section.offsetTop - panelBody.offsetTop - 8;
        panelBody.scrollTo({ top: offset, behavior: 'smooth' });
    };

    // ─── Mobile Panel Toggle ──────────────────────
    window.toggleMobilePanel = function () {
        const panel = document.getElementById('settings-panel');
        if (panel) panel.classList.toggle('open');
    };

    // ─── Platform Toggle Show/Hide ────────────────
    document.querySelectorAll('input[data-toggle]').forEach(function (input) {
        const targetId = input.getAttribute('data-toggle');
        const target = document.getElementById(targetId);
        if (target) {
            const updateVisibility = function () {
                target.style.display = input.checked ? 'block' : 'none';
            };
            input.addEventListener('change', updateVisibility);
            updateVisibility();
        }
    });

    // ─── Range Value Display Updates ──────────────
    document.querySelectorAll('input[type="range"]').forEach(function (range) {
        const valueEl = range.parentElement.querySelector('.range-value');
        if (!valueEl) return;

        const updateValue = function () {
            var val = range.value;
            var name = range.name;

            // Percentage fields
            if (name === 'frontChance' || name === 'backChance') {
                valueEl.textContent = Math.round(parseFloat(val) * 100) + '%';
                return;
            }

            // Fields with unit suffixes
            var suffixMap = {
                'danmakuSpeed': 's',
                'speedRandomness': 's',
                'danmakuDensity': 'px',
                'avatarSize': 'px',
                'paddingX': 'px',
                'paddingY': 'px',
                'borderRadius': 'px',
                'elementGap': 'px',
                'backLayerBlur': 'px',
                'eventPaddingX': 'px',
                'eventPaddingY': 'px',
                'eventLeftPadding': 'px',
                'badgeSize': 'x'
            };
            if (suffixMap[name]) {
                valueEl.textContent = val + suffixMap[name];
                return;
            }

            // Duration bonus
            if (name === 'eventDurationBonus') {
                valueEl.textContent = '+' + val + 's';
                return;
            }

            // Plain number
            valueEl.textContent = val;
        };

        range.addEventListener('input', updateValue);
        updateValue();
    });

    // ─── Color Input Hex Display ──────────────────
    document.querySelectorAll('.color-swatch input[type="color"]').forEach(function (input) {
        const hexEl = input.closest('.color-input-row').querySelector('.color-hex');
        if (!hexEl) return;

        const updateHex = function () {
            hexEl.textContent = input.value;
        };

        input.addEventListener('input', updateHex);
        updateHex();
    });

    // ─── Generate Overlay URL ─────────────────────
    function generateURL(layer) {
        var form = document.getElementById('settings-form');
        var params = new URLSearchParams();

        // Collect all form values
        var elements = form.querySelectorAll('input, select');
        elements.forEach(function (el) {
            var name = el.name;
            if (!name || name === 'layer') return;

            if (el.type === 'checkbox') {
                params.set(name, el.checked ? 'true' : 'false');
            } else if (el.type === 'range' || el.type === 'number' || el.type === 'text' || el.tagName === 'SELECT') {
                var val = el.value;
                if (val !== '' && val !== undefined) {
                    params.set(name, val);
                }
            }
        });

        // Override layer
        params.set('layer', layer);
        // Enable demo and preview mode
        params.set('demo', 'true');
        params.set('preview', 'true');

        var basePath = window.location.pathname.replace('settings.html', 'overlay.html');
        return basePath + '?' + params.toString();
    }

    // ─── Update Layer URL Displays ────────────────
    function updateLayerURLs() {
        ['front', 'middle', 'back'].forEach(function (layer) {
            var urlEl = document.getElementById('url-' + layer);
            if (urlEl) {
                urlEl.textContent = generateURL(layer);
            }
        });
    }

    // ─── Copy URL on Click ────────────────────────
    document.querySelectorAll('.url-box code').forEach(function (code) {
        code.addEventListener('click', async function () {
            try {
                await navigator.clipboard.writeText(code.textContent);
                code.classList.add('copied');
                setTimeout(function () {
                    code.classList.remove('copied');
                }, 600);
            } catch (e) {
                // Fallback: select text
                var range = document.createRange();
                range.selectNodeContents(code);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    });

    // ─── Load Settings from URL Params ────────────
    function loadSettingsFromURL() {
        var params = new URLSearchParams(window.location.search);
        var form = document.getElementById('settings-form');

        params.forEach(function (value, key) {
            if (key === 'demo' || key === 'preview' || key === 'layer') return;

            var input = form.querySelector('[name="' + key + '"]');
            if (!input) return;

            if (input.type === 'checkbox') {
                input.checked = (value === 'true');
            } else if (input.type === 'range' || input.type === 'number') {
                input.value = value;
                input.dispatchEvent(new Event('input'));
            } else if (input.type === 'color') {
                input.value = value;
                input.dispatchEvent(new Event('input'));
            } else if (input.tagName === 'SELECT') {
                // Set value if option exists
                var option = input.querySelector('option[value="' + value + '"]');
                if (option) {
                    input.value = value;
                }
            } else {
                input.value = value;
            }
        });

        // Also restore the layer select if provided
        var layerParam = params.get('layer');
        if (layerParam) {
            var layerSelect = form.querySelector('[name="layer"]');
            if (layerSelect) {
                var layerOption = layerSelect.querySelector('option[value="' + layerParam + '"]');
                if (layerOption) {
                    layerSelect.value = layerParam;
                }
            }
        }
    }

    // ─── Update Preview ───────────────────────────
    var lastPreviewSrc = '';

    function updatePreview() {
        var form = document.getElementById('settings-form');
        var layerSelect = form.querySelector('[name="layer"]');
        var layer = layerSelect ? layerSelect.value : 'middle';
        var newSrc = generateURL(layer);

        if (newSrc === lastPreviewSrc) return;
        lastPreviewSrc = newSrc;

        var iframe = document.getElementById('preview-frame');
        if (iframe) {
            iframe.src = newSrc;
        }
    }

    // ─── Debounced Preview ────────────────────────
    var debounceTimer = null;

    function debouncedPreview() {
        updateLayerURLs();
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updatePreview, 300);
    }

    // ─── Wire ALL Form Inputs to Debounced Preview ─
    (function wireFormListeners() {
        var form = document.getElementById('settings-form');
        if (!form) return;

        form.addEventListener('change', function () {
            debouncedPreview();
        });

        form.addEventListener('input', function () {
            debouncedPreview();
        });
    })();

    // ─── Streamer.bot Connection Status ───────────
    (function initConnectionStatus() {
        var dot = document.getElementById('sb-status-dot');
        var text = document.getElementById('sb-status-text');
        if (!dot || !text) return;

        function checkConnection() {
            var form = document.getElementById('settings-form');
            var addrInput = form.querySelector('[name="streamerBotServerAddress"]');
            var portInput = form.querySelector('[name="streamerBotServerPort"]');
            if (!addrInput || !portInput) return;

            var addr = addrInput.value || '127.0.0.1';
            var port = portInput.value || '8080';
            var url = 'http://' + addr + ':' + port + '/GetConnection';

            fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(3000) })
                .then(function () {
                    dot.className = 'connection-dot connected';
                    text.textContent = 'Connected';
                })
                .catch(function () {
                    dot.className = 'connection-dot disconnected';
                    text.textContent = 'Not connected';
                });
        }

        checkConnection();
        setInterval(checkConnection, 15000);

        // Re-check when address/port changes
        var form = document.getElementById('settings-form');
        var addrInput = form.querySelector('[name="streamerBotServerAddress"]');
        var portInput = form.querySelector('[name="streamerBotServerPort"]');
        if (addrInput) addrInput.addEventListener('change', checkConnection);
        if (portInput) portInput.addEventListener('change', checkConnection);
    })();

    // ═══════════════════════════════════════════════
    //               DEMO MODE
    // ═══════════════════════════════════════════════

    // Demo message pools
    var demoChatMessages = [
        { platform: 'twitch', username: 'NightOwl42', color: '#ff6b6b', text: 'This stream is amazing!' },
        { platform: 'twitch', username: 'PixelWizard', color: '#9147ff', text: 'Let\'s gooo!' },
        { platform: 'twitch', username: 'StreamQueen', color: '#00bcd4', text: 'First time here, love the vibes' },
        { platform: 'twitch', username: 'xX_Gamer_Xx', color: '#4caf50', text: 'PogChamp PogChamp' },
        { platform: 'twitch', username: 'CoffeeAndCode', color: '#ff9800', text: 'How long have you been streaming?' },
        { platform: 'twitch', username: 'MidnightRider', color: '#e91e63', text: 'That play was insane!' },
        { platform: 'twitch', username: 'ChillVibesOnly', color: '#8bc34a', text: 'just lurking and enjoying the stream' },
        { platform: 'twitch', username: 'TurboSnail', color: '#03a9f4', text: 'can you play some music?' },
        { platform: 'twitch', username: 'RNGesusBless', color: '#ffc107', text: 'LETS GOOO' },
        { platform: 'twitch', username: 'SilentViewer', color: '#cddc39', text: 'lol' },
        { platform: 'youtube', username: 'GamingPro2024', color: '#ff0000', text: 'Great content as always!' },
        { platform: 'youtube', username: 'TechEnthusiast', color: '#2196f3', text: 'What settings are you using?' },
        { platform: 'youtube', username: 'MusicLover', color: '#e91e63', text: 'The background music is perfect' },
        { platform: 'youtube', username: 'CasualWatcher', color: '#4caf50', text: 'Subscribed!' },
        { platform: 'youtube', username: 'NightOwlGaming', color: '#ff9800', text: 'Who else is watching at 3am?' },
        { platform: 'youtube', username: 'PixelArtist', color: '#9c27b0', text: 'That artwork is incredible, keep it up!' },
        { platform: 'youtube', username: 'JustPassingBy', color: '#00bcd4', text: 'hello from Brazil!' },
        { platform: 'youtube', username: 'SuperFan99', color: '#f44336', text: 'Been here since day one' },
        { platform: 'kick', username: 'GreenMachine', color: '#4ecdc4', text: 'Kick is the future!' },
        { platform: 'kick', username: 'CoolStreamer', color: '#53fc18', text: 'Love this community' },
        { platform: 'kick', username: 'ChillDude', color: '#4ecdc4', text: 'hey everyone' },
        { platform: 'kick', username: 'VIPMember', color: '#88c999', text: 'just subbed, this is awesome content' },
        { platform: 'kick', username: 'ChatLord', color: '#4ecdc4', text: 'spam time W W W W W W' },
        { platform: 'kick', username: 'NewHere', color: '#98d9b0', text: 'first stream on kick,推荐 this平台' },
        { platform: 'tiktok', username: 'FYP Legend', color: '#ff0050', text: 'saw this on my fyp!' },
        { platform: 'tiktok', username: 'vibe.check', color: '#25f4ee', text: 'no cap this is fire' },
        { platform: 'tiktok', username: 'clout chaser', color: '#ff0050', text: 'follow me back plz' },
        { platform: 'tiktok', username: 'lol king', color: '#fe2c55', text: '💀💀💀' },
        { platform: 'tiktok', username: 'random user', color: '#25f4ee', text: 'POV: you found the best live' },
        { platform: 'tiktok', username: 'shadow lurker', color: '#ff0050', text: 'im just watching quietly' },
    ];

    var demoEventMessages = [
        { platform: 'twitch', type: 'follow', username: 'NewFollower123', color: '#ff6b6b', action: 'just followed!' },
        { platform: 'twitch', type: 'follow', username: 'StreamWatcher99', color: '#e91e63', action: 'just followed!' },
        { platform: 'twitch', type: 'sub', username: 'LoyalSubscriber', color: '#9147ff', action: 'subscribed!', value: '6 months (Tier 1)' },
        { platform: 'twitch', type: 'sub', username: 'PrimeGifter', color: '#9147ff', action: 'subscribed!', value: 'Prime' },
        { platform: 'twitch', type: 'gift', username: 'GenerousDonor', color: '#9147ff', action: 'gifted a 1 month sub to', value: 'LuckyViewer' },
        { platform: 'twitch', type: 'giftbomb', username: 'SubBomb2000', color: '#9147ff', action: 'is gifting', value: '50 subs!' },
        { platform: 'twitch', type: 'bits', username: 'CheerMaster', color: '#00e5ff', action: 'cheered', value: '1000 bits', message: 'Keep up the great content!' },
        { platform: 'twitch', type: 'bits', username: 'BitDropper', color: '#00e5ff', action: 'cheered', value: '100 bits' },
        { platform: 'twitch', type: 'raid', username: 'RaidBoss', color: '#ff6b35', action: 'raided with', value: '250 viewers' },
        { platform: 'twitch', type: 'reward', username: 'PointsKing', color: '#9147ff', action: 'redeemed', value: 'Highlight My Message', message: 'THIS IS THE BEST STREAM EVER' },
        { platform: 'youtube', type: 'follow', username: 'NewSubscriber', color: '#ff0000', action: 'just followed!' },
        { platform: 'youtube', type: 'superchat', username: 'BigSpender', color: '#ff0000', action: 'super chatted', value: '$50.00', message: 'Love your content! Keep going!' },
        { platform: 'youtube', type: 'superchat', username: 'GenerousFan', color: '#ff4444', action: 'super chatted', value: '$5.00' },
        { platform: 'youtube', type: 'member', username: 'ChannelMember', color: '#00b8d4', action: 'joined as a member!', value: '12 months' },
        { platform: 'youtube', type: 'giftbomb', username: 'GiftLeader', color: '#00b8d4', action: 'gifted', value: '10 memberships' },
        { platform: 'kick', type: 'follow', username: 'KickFollower', color: '#4ecdc4', action: 'just followed!' },
        { platform: 'kick', type: 'sub', username: 'KickSub', color: '#4ecdc4', action: 'subscribed!' },
        { platform: 'kick', type: 'gift', username: 'KickGifter', color: '#4ecdc4', action: 'gifted a sub to', value: 'KickNewbie' },
        { platform: 'kick', type: 'giftbomb', username: 'KickBomb', color: '#4ecdc4', action: 'is gifting', value: '20 subs!' },
        { platform: 'tiktok', type: 'follow', username: 'TikTokFan', color: '#ff0050', action: 'just followed!' },
        { platform: 'tiktok', type: 'gift', username: 'GiftSender', color: '#ff0050', action: 'sent', value: '5x Rose' },
        { platform: 'tiktok', type: 'gift', username: 'WhaleAlert', color: '#ff0050', action: 'sent', value: '1x Lion' },
        { platform: 'tiktok', type: 'sub', username: 'TikTokSub', color: '#ff0050', action: 'subscribed!' },
    ];

    // Inject demo message handler into iframe
    var demoHandlerInjected = false;

    function injectDemoHandler(iframe) {
        if (demoHandlerInjected) return;
        try {
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc) return;

            var script = doc.createElement('script');
            script.textContent = [
                'window.addEventListener("message", function(e) {',
                '  if (!e.data || !e.data.__danmakuDemo) return;',
                '  var msg = e.data;',
                '  if (msg.msgType === "chat") {',
                '    if (typeof createDanmakuChat === "function") {',
                '      createDanmakuChat(msg.platform, msg.data);',
                '    }',
                '  } else if (msg.msgType === "event") {',
                '    if (typeof createDanmakuEvent === "function") {',
                '      createDanmakuEvent(msg.platform, msg.data);',
                '    }',
                '  }',
                '});'
            ].join('\n');

            doc.head.appendChild(script);
            demoHandlerInjected = true;
            return true;
        } catch (ex) {
            // Cross-origin or not ready yet
            return false;
        }
    }

    // ─── Start Demo ───────────────────────────────
    var demoInterval = null;
    var demoActive = false;

    window.startDemo = function () {
        var iframe = document.getElementById('preview-frame');
        if (!iframe) return;

        // Wait for iframe to be ready, then inject handler and start sending
        var attempts = 0;
        var maxAttempts = 30;

        function tryInit() {
            attempts++;
            if (!iframe.contentWindow) {
                if (attempts < maxAttempts) {
                    setTimeout(tryInit, 300);
                }
                return;
            }

            var injected = injectDemoHandler(iframe);
            if (!injected) {
                if (attempts < maxAttempts) {
                    setTimeout(tryInit, 300);
                }
                return;
            }

            // Successfully injected, start demo messages
            if (demoActive) return; // Already running
            demoActive = true;
            sendDemoMessage();

            demoInterval = setInterval(sendDemoMessage, function () {
                return 1000 + Math.random() * 2000;
            }());
        }

        setTimeout(tryInit, 500);
    };

    function sendDemoMessage() {
        var iframe = document.getElementById('preview-frame');
        if (!iframe || !iframe.contentWindow) return;

        // Randomize interval for next message
        if (demoInterval) {
            clearInterval(demoInterval);
            demoInterval = setInterval(sendDemoMessage, 1000 + Math.random() * 2000);
        }

        // 75% chance chat, 25% chance event
        var isEvent = Math.random() < 0.25;

        if (isEvent) {
            var evt = demoEventMessages[Math.floor(Math.random() * demoEventMessages.length)];
            var eventData = {
                __danmakuDemo: true,
                msgType: 'event',
                platform: evt.platform,
                data: {
                    username: evt.username,
                    color: evt.color,
                    action: evt.action
                }
            };
            if (evt.value) eventData.data.value = evt.value;
            if (evt.message) eventData.data.messageHtml = evt.message;

            iframe.contentWindow.postMessage(eventData, '*');
        } else {
            var chat = demoChatMessages[Math.floor(Math.random() * demoChatMessages.length)];
            var chatData = {
                __danmakuDemo: true,
                msgType: 'chat',
                platform: chat.platform,
                data: {
                    text: chat.text,
                    username: chat.username,
                    color: chat.color
                }
            };

            iframe.contentWindow.postMessage(chatData, '*');
        }
    }

    // ─── Initialize Everything ────────────────────
    loadSettingsFromURL();
    updateLayerURLs();

    // Small delay then start the preview and demo
    setTimeout(function () {
        updatePreview();
        startDemo();
    }, 100);

    // Re-inject handler when iframe reloads (src change)
    var previewFrame = document.getElementById('preview-frame');
    if (previewFrame) {
        previewFrame.addEventListener('load', function () {
            demoHandlerInjected = false;
            demoActive = false;
            if (demoInterval) {
                clearInterval(demoInterval);
                demoInterval = null;
            }
            // Restart demo with new iframe content
            setTimeout(startDemo, 300);
        });
    }

})();
