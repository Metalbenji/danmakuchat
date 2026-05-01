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
var _sbHelloReceived = false;

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
        try {
            var result = h(data);
            // Catch async errors (handlers are often async functions)
            if (result && typeof result.catch === 'function') {
                result.catch(function(err) {
                    console.error('[DanmakuChat] Async handler error for ' + eventName + ':', err);
                });
            }
        } catch(err) {
            console.error('[DanmakuChat] Handler error for ' + eventName + ':', err);
        }
    });
}

// ─── Debug (console only — no on-screen overlay in OBS) ─────────

function _sbDebug(msg) {
    console.log('[DanmakuChat]', msg);
}

// ─── Raw WebSocket Connection ─────────────────
// Protocol flow (matches Streamer.bot docs & working widgets):
//   1. Client connects to ws://host:port/
//   2. Server sends Hello: { "request": "Hello", "id": "...", "info": {...} }
//   3. Client sends Subscribe: { "request": "Subscribe", "id": "...", "events": {...} }
//   4. Server responds: { "id": "...", "status": "ok", "events": {...} }
//   5. Events flow: { "timeStamp": "...", "event": { "source": "Twitch", "type": "ChatMessage" }, "data": {...} }

var _sbWebSocket = null;
var _sbReconnectTimer = null;
var _sbReconnectDelay = 2000;
var _sbMaxReconnectDelay = 30000;

function _sbConnect() {
    var url = 'ws://' + streamerBotServerAddress + ':' + streamerBotServerPort + '/';
    console.log('[DanmakuChat] Connecting to', url);
    _sbHelloReceived = false;

    try {
        _sbWebSocket = new WebSocket(url);
    } catch(err) {
        console.error('[DanmakuChat] WebSocket ERROR:', err.message);
        _sbScheduleReconnect();
        return;
    }

    _sbWebSocket.onopen = function() {
        console.log('[DanmakuChat] Connected, waiting for Hello...');
    };

    _sbWebSocket.onmessage = function(event) {
        try {
            if (!event.data || typeof event.data !== 'string') return;
            var msg = JSON.parse(event.data);

            var msgType = msg.request || (msg.event ? msg.event.source + '.' + msg.event.type : '?');

            // ── Step 1: Handle Hello message ──
            // Server sends this first after connection opens.
            // We MUST wait for it before subscribing.
            if (msg.request === 'Hello') {
                _sbHelloReceived = true;
                _sbConnected = true;
                _sbReconnectDelay = 2000;
                var name = msg.info ? (msg.info.name + ' v' + msg.info.version) : 'Streamer.bot';
                console.log('[DanmakuChat] Hello from', name);

                // Wait a moment then subscribe (same as Streamgoals does)
                setTimeout(function() {
                    _sbSubscribe();
                }, 500);
                return;
            }

            // ── Step 2: Handle Subscribe response ──
            if (msg.request === 'Subscribe') {
                if (msg.status === 'ok' || msg.id) {
                    var count = 0;
                    if (msg.events) {
                        for (var k in msg.events) count += msg.events[k].length;
                    }
                    console.log('[DanmakuChat] Subscribed!');
                } else if (msg.error) {
                    console.error('[DanmakuChat] Subscribe ERROR:', msg.error);
                }
                return;
            }

            // ── Step 3: Handle other request responses ──
            if (msg.request && msg.id) {
                return;
            }

            // ── Step 4: Handle actual events ──
            // Format varies by Streamer.bot version:
            //   v1: { "timeStamp": "...", "event": { "source": "Twitch", "type": "ChatMessage" }, "data": {...} }
            //   v2: { "timestamp": "...", "event": { "source": "Twitch", "type": "ChatMessage", "data": {...} } }
            // Handle both by checking msg.data first, then msg.event.data
            if (msg.event && msg.event.source && msg.event.type) {
                _sbEventCount++;
                var sourceType = msg.event.source;  // STRING: "Twitch", "YouTube", etc.
                var eventType = msg.event.type;      // STRING: "ChatMessage", "Follow", etc.
                var handlerKey = sourceType + '.' + eventType;

                // Get event payload — try both formats
                var eventData = msg.data || msg.event.data || {};

                // Build response object matching what @streamerbot/client provided
                // The handlers expect response.data to be the event payload
                var response = {
                    data: eventData,
                    event: handlerKey,
                    source: sourceType
                };

                _sbEmit(handlerKey, response);


            }
        } catch(err) {
            // Not JSON or parse error, ignore
        }
    };

    _sbWebSocket.onclose = function(event) {

        _sbConnected = false;
        _sbHelloReceived = false;
        _sbWebSocket = null;
        console.log('[DanmakuChat] Disconnected (code ' + event.code + ') — retrying...');
        _sbScheduleReconnect();
    };

    _sbWebSocket.onerror = function(err) {
        console.warn('[DanmakuChat] WebSocket error');
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
        // No handlers registered yet — retry shortly
        console.log('[DanmakuChat] No handlers yet, retrying...');
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
        console.log('[DanmakuChat] Subscribing to', count, 'events');
    } catch(err) {
        console.error('[DanmakuChat] Subscribe failed:', err.message);
    }
}

function _sbScheduleReconnect() {
    if (_sbReconnectTimer) return;
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
    _sbHelloReceived = false;
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

                        handlers[evtKey](response);
                    });
                })(event);
            }
        }

        // If already connected AND Hello received, re-subscribe
        if (_sbConnected && _sbHelloReceived) {
            _sbSubscribe();
        }
    } catch(err) {
        // ignore
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
        console.error('[DanmakuChat] Init failed:', err.message);
    }
}, 0);
