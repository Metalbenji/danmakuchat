/* ============================================ */
/*      STREAMER.BOT CONNECTION & UTILS         */
/*   Raw WebSocket — no library dependencies     */
/* ============================================ */

const streamerBotServerAddress = getURLParam("streamerBotServerAddress", "127.0.0.1");
const streamerBotServerPort = getURLParam("streamerBotServerPort", "8080");

function getURLParam(param, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);

    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === null) return defaultValue;

    return value;
}

// ─── Simple EventEmitter ──────────────────────

var _sbHandlers = {};
var _sbConnected = false;
var _sbEventCount = 0;

function _sbOn(eventName, handler) {
    if (!_sbHandlers[eventName]) {
        _sbHandlers[eventName] = [];
    }
    _sbHandlers[eventName].push(handler);
}

function _sbOff(eventName, handler) {
    if (!_sbHandlers[eventName]) return;
    if (handler) {
        _sbHandlers[eventName] = _sbHandlers[eventName].filter(function(h) { return h !== handler; });
    } else {
        delete _sbHandlers[eventName];
    }
}

function _sbEmit(eventName, data) {
    var handlers = _sbHandlers[eventName];
    if (!handlers || handlers.length === 0) return;
    handlers.forEach(function(h) {
        try { h(data); } catch(err) { console.warn('[DanmakuChat] Handler error for ' + eventName + ':', err); }
    });
}

// ─── On-screen debug (visible in OBS) ─────────

var _sbDebugEl = null;
var _sbDebugTimeout = null;

function _sbInitDebug() {
    var el = document.createElement('div');
    el.id = 'sb-debug';
    el.style.cssText = 'position:fixed;top:4px;left:4px;z-index:99999;font:11px monospace;' +
        'color:#0f0;background:#0008;padding:3px 6px;border-radius:3px;pointer-events:none;' +
        'max-width:90vw;word-break:break-all;line-height:1.4;';
    el.textContent = 'Connecting...';
    document.body.appendChild(el);
    _sbDebugEl = el;
}

function _sbDebug(msg) {
    if (!_sbDebugEl) _sbInitDebug();
    _sbDebugEl.textContent = msg;
    // Auto-hide after 10s of no updates
    if (_sbDebugTimeout) clearTimeout(_sbDebugTimeout);
    _sbDebugTimeout = setTimeout(function() {
        if (_sbDebugEl && _sbConnected) {
            _sbDebugEl.style.transition = 'opacity 1s';
            _sbDebugEl.style.opacity = '0';
            setTimeout(function() { if (_sbDebugEl) _sbDebugEl.remove(); _sbDebugEl = null; }, 1000);
        }
    }, 10000);
}

// ─── Raw WebSocket Connection ─────────────────

var _sbWebSocket = null;
var _sbReconnectTimer = null;
var _sbReconnectDelay = 2000;
var _sbMaxReconnectDelay = 30000;

function _sbConnect() {
    // Streamer.bot WebSocket endpoint is "/" (root), NOT "/Socket"
    var url = 'ws://' + streamerBotServerAddress + ':' + streamerBotServerPort + '/';
    console.log('[DanmakuChat] Connecting to Streamer.bot at', url);
    _sbDebug('Connecting to ' + url + '...');

    try {
        _sbWebSocket = new WebSocket(url);
    } catch(err) {
        console.error('[DanmakuChat] Failed to create WebSocket:', err);
        _sbDebug('WebSocket ERROR: ' + err.message);
        _sbScheduleReconnect();
        return;
    }

    _sbWebSocket.onopen = function() {
        console.log('[DanmakuChat] Connected to Streamer.bot');
        _sbConnected = true;
        _sbReconnectDelay = 2000;

        // Subscribe to all events we care about
        _sbSubscribe();
    };

    _sbWebSocket.onmessage = function(event) {
        try {
            if (!event.data || typeof event.data !== 'string') return;
            var msg = JSON.parse(event.data);

            // Handle subscription response (has "status" and "id")
            if (msg.status) {
                if (msg.status === 'ok') {
                    console.log('[DanmakuChat] Subscription confirmed');
                    _sbDebug('Connected & subscribed');
                } else if (msg.status === 'error') {
                    console.warn('[DanmakuChat] Server error:', msg);
                    _sbDebug('Error: ' + (msg.message || JSON.stringify(msg)));
                }
                return;
            }

            // Handle incoming events
            // Streamer.bot format:
            // {
            //   "timeStamp": "...",
            //   "event": { "source": "Twitch", "type": "ChatMessage" },
            //   "data": { ... event payload ... }
            // }
            if (msg.event && msg.event.source && msg.event.type) {
                _sbEventCount++;
                var sourceType = msg.event.source;  // STRING, e.g. "Twitch"
                var eventType = msg.event.type;      // STRING, e.g. "ChatMessage"
                var handlerKey = sourceType + '.' + eventType;

                // Build response matching what @streamerbot/client provided
                // The callback expects response.data to be the event payload
                var response = {
                    data: msg.data,           // Event payload is at msg.data
                    event: handlerKey,
                    source: sourceType
                };

                _sbEmit(handlerKey, response);
                _sbEmit('Raw.Event', msg);

                // Show first few events in debug
                if (_sbEventCount <= 3) {
                    _sbDebug('Event #' + _sbEventCount + ': ' + handlerKey);
                } else if (_sbEventCount === 4) {
                    _sbDebug('Connected — ' + _sbEventCount + ' events received');
                }
            }
        } catch(err) {
            // Not JSON or parse error, ignore
        }
    };

    _sbWebSocket.onclose = function(event) {
        console.log('[DanmakuChat] Disconnected (code: ' + event.code + ')');
        _sbConnected = false;
        _sbWebSocket = null;
        _sbDebug('Disconnected (code ' + event.code + ') — retrying...');
        _sbScheduleReconnect();
    };

    _sbWebSocket.onerror = function(err) {
        console.warn('[DanmakuChat] WebSocket error');
        _sbDebug('WebSocket connection error');
        // onclose fires after onerror
    };
}

function _sbSubscribe() {
    if (!_sbWebSocket || _sbWebSocket.readyState !== WebSocket.OPEN) return;

    // Collect all event types from registered handlers
    var events = {};
    var allEvents = Object.keys(_sbHandlers);

    allEvents.forEach(function(key) {
        // Skip internal events
        if (key === 'Raw.Event' || key === '_subscribed') return;

        var parts = key.split('.');
        if (parts.length !== 2) return;

        var platform = parts[0];
        var eventType = parts[1];

        if (!events[platform]) {
            events[platform] = [];
        }
        if (events[platform].indexOf(eventType) === -1) {
            events[platform].push(eventType);
        }
    });

    if (Object.keys(events).length === 0) {
        // No handlers yet — retry
        _sbDebug('Waiting for handlers to register...');
        setTimeout(_sbSubscribe, 300);
        return;
    }

    var subscribeMsg = {
        request: 'Subscribe',
        id: 'danmaku-sub-' + Date.now(),
        events: events
    };

    try {
        _sbWebSocket.send(JSON.stringify(subscribeMsg));
        var count = 0;
        for (var k in events) count += events[k].length;
        console.log('[DanmakuChat] Subscribed to ' + count + ' events:', JSON.stringify(events));
        _sbDebug('Subscribed to ' + count + ' events');
    } catch(err) {
        console.warn('[DanmakuChat] Failed to send subscription:', err);
        _sbDebug('Subscribe failed: ' + err.message);
    }
}

function _sbScheduleReconnect() {
    if (_sbReconnectTimer) return;
    console.log('[DanmakuChat] Reconnecting in ' + Math.round(_sbReconnectDelay / 1000) + 's...');
    _sbReconnectTimer = setTimeout(function() {
        _sbReconnectTimer = null;
        _sbConnect();
    }, _sbReconnectDelay);
    _sbReconnectDelay = Math.min(_sbReconnectDelay * 1.5, _sbMaxReconnectDelay);
}

// ─── Connection management ────────────────────

function _sbDisconnect() {
    if (_sbReconnectTimer) {
        clearTimeout(_sbReconnectTimer);
        _sbReconnectTimer = null;
    }
    if (_sbWebSocket) {
        try { _sbWebSocket.close(); } catch(e) {}
        _sbWebSocket = null;
    }
    _sbConnected = false;
}

// ─── Public API (drop-in replacement) ─────────

var streamerBotClient = {
    on: function(eventName, handler) {
        _sbOn(eventName, handler);
    },
    off: function(eventName, handler) {
        _sbOff(eventName, handler);
    },
    disconnect: function() {
        _sbDisconnect();
    },
    isConnected: function() {
        return _sbConnected;
    }
};

// Expose for platform modules
var registerPlatformHandlersToStreamerBot = function(handlers, logPrefix) {
    logPrefix = logPrefix || '';
    try {
        for (var event in handlers) {
            if (handlers.hasOwnProperty(event)) {
                (function(evtKey) {
                    _sbOn(evtKey, function(response) {
                        if (logPrefix) {
                            console.debug(logPrefix + ' ' + evtKey, response.data);
                        }
                        handlers[evtKey](response);
                    });
                })(event);
            }
        }

        // If already connected, re-subscribe with all registered events
        if (_sbConnected) {
            _sbSubscribe();
        }
    } catch(err) {
        console.warn('[DanmakuChat] Failed to register platform handlers:', err);
    }
};

// ─── getStreamerInfo (HTTP, may fail from file://) ──

async function getStreamerInfo() {
    var addr = streamerBotServerAddress || '127.0.0.1';
    var port = streamerBotServerPort || '8080';
    var url = 'http://' + addr + ':' + port + '/GetBroadcaster';

    try {
        var resp = await fetch(url);
        var data = await resp.json();
        return data;
    } catch(err) {
        console.warn('[DanmakuChat] getStreamerInfo failed (this is OK from file://):', err.message);
        return null;
    }
}

// ─── Connect on load ──────────────────────────
// Use setTimeout(0) so all synchronous platform module scripts load
// and register their handlers BEFORE we connect and subscribe.

setTimeout(function() {
    try {
        _sbConnect();
    } catch(err) {
        console.warn('[DanmakuChat] Streamer.bot init failed:', err);
        _sbDebug('Init failed: ' + err.message);
    }
}, 0);
