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
// Minimal event system so platform modules can call .on() like before

var _sbHandlers = {};
var _sbConnected = false;

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

// ─── Raw WebSocket Connection ─────────────────

var _sbWebSocket = null;
var _sbReconnectTimer = null;
var _sbReconnectDelay = 2000;
var _sbMaxReconnectDelay = 30000;
var _sbSubscriptionSent = false;

function _sbConnect() {
    var url = 'ws://' + streamerBotServerAddress + ':' + streamerBotServerPort + '/Socket';
    console.log('[DanmakuChat] Connecting to Streamer.bot at', url);

    try {
        _sbWebSocket = new WebSocket(url);
    } catch(err) {
        console.error('[DanmakuChat] Failed to create WebSocket:', err);
        _sbScheduleReconnect();
        return;
    }

    _sbWebSocket.onopen = function() {
        console.log('[DanmakuChat] Connected to Streamer.bot');
        _sbConnected = true;
        _sbReconnectDelay = 2000; // Reset reconnect delay

        // Subscribe to all events we care about
        _sbSubscribe();
    };

    _sbWebSocket.onmessage = function(event) {
        try {
            var msg = JSON.parse(event.data);

            // Handle subscription response
            if (msg.id && _sbSubscriptionSent && !_sbHandlers['_subscribed']) {
                // Subscription acknowledged
                _sbSubscriptionSent = false;
                console.log('[DanmakuChat] Event subscription confirmed');
            }

            // Handle events from Streamer.bot
            if (msg.event) {
                var sourceType = msg.event.source ? msg.event.source.type : '';
                var eventType = msg.event.type || '';
                var handlerKey = sourceType + '.' + eventType;

                // Build a response object matching what @streamerbot/client provided
                var response = {
                    data: msg.event.data,
                    event: handlerKey,
                    source: sourceType
                };

                _sbEmit(handlerKey, response);
                _sbEmit('Raw.Event', msg);
            }
        } catch(err) {
            // Not JSON or parse error, ignore
        }
    };

    _sbWebSocket.onclose = function(event) {
        console.log('[DanmakuChat] Disconnected from Streamer.bot (code: ' + event.code + ')');
        _sbConnected = false;
        _sbWebSocket = null;
        _sbScheduleReconnect();
    };

    _sbWebSocket.onerror = function(err) {
        console.warn('[DanmakuChat] WebSocket error');
        // onclose will fire after onerror, which handles reconnect
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
        // No handlers registered yet — platform modules load after sb.js
        // Retry subscription after a short delay
        setTimeout(_sbSubscribe, 500);
        return;
    }

    var subscribeMsg = {
        request: 'Subscribe',
        id: 'danmaku-sub-' + Date.now(),
        events: events
    };

    try {
        _sbWebSocket.send(JSON.stringify(subscribeMsg));
        _sbSubscriptionSent = true;
        console.log('[DanmakuChat] Subscribed to events:', JSON.stringify(events));
    } catch(err) {
        console.warn('[DanmakuChat] Failed to send subscription:', err);
    }
}

function _sbScheduleReconnect() {
    if (_sbReconnectTimer) return; // Already scheduled
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

        // If we're already connected, re-subscribe with new events
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
        var resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        var data = await resp.json();
        return data;
    } catch(err) {
        console.warn('[DanmakuChat] getStreamerInfo failed (this is OK from file://):', err.message);
        return null;
    }
}

// ─── Connect on load ──────────────────────────

try {
    _sbConnect();
} catch(err) {
    console.warn('[DanmakuChat] Streamer.bot init failed:', err);
}
