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
        try { h(data); } catch(err) {
            console.error('[DanmakuChat] Handler error for ' + eventName + ':', err);
            _sbDebug('HANDLER ERROR: ' + eventName + ': ' + err.message);
        }
    });
}

// ─── On-screen debug (visible in OBS) ─────────

var _sbDebugEl = null;
var _sbDebugTimeout = null;
var _sbDebugLog = [];
var _sbMaxLogLines = 12;

function _sbInitDebug() {
    var el = document.createElement('div');
    el.id = 'sb-debug';
    el.style.cssText = 'position:fixed;top:4px;left:4px;z-index:99999;font:10px monospace;' +
        'color:#0f0;background:rgba(0,0,0,0.75);padding:4px 6px;border-radius:3px;pointer-events:none;' +
        'max-width:95vw;max-height:40vh;overflow:hidden;word-break:break-all;line-height:1.35;white-space:pre-wrap;';
    el.textContent = 'Connecting...';
    document.body.appendChild(el);
    _sbDebugEl = el;
}

function _sbDebug(msg) {
    if (!_sbDebugEl) _sbInitDebug();
    _sbDebugLog.push(msg);
    if (_sbDebugLog.length > _sbMaxLogLines) _sbDebugLog.shift();
    _sbDebugEl.textContent = _sbDebugLog.join('\n');
    // Auto-hide after 15s of no updates (only when connected)
    if (_sbDebugTimeout) clearTimeout(_sbDebugTimeout);
    _sbDebugTimeout = setTimeout(function() {
        if (_sbDebugEl && _sbConnected && _sbHelloReceived) {
            _sbDebugEl.style.transition = 'opacity 1s';
            _sbDebugEl.style.opacity = '0';
            setTimeout(function() { if (_sbDebugEl) _sbDebugEl.remove(); _sbDebugEl = null; }, 1000);
        }
    }, 15000);
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
    console.log('[DanmakuChat] Connecting to Streamer.bot at', url);
    _sbDebug('Connecting to ' + url + '...');
    _sbHelloReceived = false;

    try {
        _sbWebSocket = new WebSocket(url);
    } catch(err) {
        console.error('[DanmakuChat] Failed to create WebSocket:', err);
        _sbDebug('WebSocket ERROR: ' + err.message);
        _sbScheduleReconnect();
        return;
    }

    _sbWebSocket.onopen = function() {
        console.log('[DanmakuChat] WebSocket opened, waiting for Hello...');
        _sbDebug('Connected, waiting for Hello...');
        // Do NOT subscribe yet — wait for the Hello message from the server
    };

    _sbWebSocket.onmessage = function(event) {
        try {
            if (!event.data || typeof event.data !== 'string') return;
            var msg = JSON.parse(event.data);

            // Log every raw message to debug overlay (truncate long ones)
            var rawStr = JSON.stringify(msg);
            if (rawStr.length > 120) rawStr = rawStr.substring(0, 120) + '...';
            var msgType = msg.request || (msg.event ? msg.event.source + '.' + msg.event.type : '?');
            _sbDebug('<< ' + msgType + ': ' + rawStr);
            console.log('[DanmakuChat] Received:', msgType, msg);

            // ── Step 1: Handle Hello message ──
            // Server sends this first after connection opens.
            // We MUST wait for it before subscribing.
            if (msg.request === 'Hello') {
                _sbHelloReceived = true;
                _sbConnected = true;
                _sbReconnectDelay = 2000;
                var name = msg.info ? (msg.info.name + ' v' + msg.info.version) : 'Streamer.bot';
                console.log('[DanmakuChat] Hello from', name);
                _sbDebug('Hello from ' + name + ' — subscribing...');

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
                    console.log('[DanmakuChat] Subscription confirmed: ' + count + ' events');
                    _sbDebug('Subscribed! (' + count + ' events) Waiting for chat...');
                } else if (msg.error) {
                    console.error('[DanmakuChat] Subscription failed:', msg.error);
                    _sbDebug('Subscribe ERROR: ' + msg.error);
                }
                return;
            }

            // ── Step 3: Handle other request responses ──
            if (msg.request && msg.id) {
                console.log('[DanmakuChat] Response for', msg.request, ':', msg);
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

                // DEBUG: Show the data structure for first 2 events
                if (_sbEventCount <= 2) {
                    var dataKeys = Object.keys(eventData);
                    var preview = {};
                    dataKeys.slice(0, 10).forEach(function(k) {
                        var v = eventData[k];
                        if (v && typeof v === 'object') {
                            preview[k] = Object.keys(v);
                        } else if (typeof v === 'string' && v.length > 40) {
                            preview[k] = v.substring(0, 40) + '...';
                        } else {
                            preview[k] = v;
                        }
                    });
                    _sbDebug('DATA keys: ' + JSON.stringify(preview));
                }

                // Build response object matching what @streamerbot/client provided
                // The handlers expect response.data to be the event payload
                var response = {
                    data: eventData,
                    event: handlerKey,
                    source: sourceType
                };

                _sbEmit(handlerKey, response);
                _sbEmit('Raw.Event', msg);

                // Show first few events in debug overlay
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
        _sbHelloReceived = false;
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
        // No handlers registered yet — retry shortly
        _sbDebug('No handlers yet, retrying...');
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
        console.log('[DanmakuChat] Sending subscription for ' + count + ' events:', JSON.stringify(events));
        _sbDebug('Subscribing to ' + count + ' events...');
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
                        if (logPrefix) {
                            console.debug(logPrefix + ' ' + evtKey, response.data);
                        }
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
