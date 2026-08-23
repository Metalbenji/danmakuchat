# DanmakuChat

A danmaku (bullet chat / 弾幕) style multi-platform chat overlay for OBS. Chat messages float across your stream in real-time, supporting Twitch, YouTube, Kick, TikTok, and 6 donation platforms through Streamer.bot. No build tools, no dependencies to install — just static HTML/CSS/JS files.

---

## Features

- **Classic Danmaku Overlay** — Messages scroll across the screen in traditional bullet-chat style
- **2-Layer System** — Front (in front of you - events), Back (behind you - standard chat with depth effect) — each layer is a separate OBS scene you can compose freely
- **10 Platform Modules** — Twitch, YouTube, Kick, TikTok, StreamElements, StreamLabs, Patreon, Ko-fi, TipeeeStream, Fourthwall
- **Real Avatars** — Fetches actual Twitch avatars from Decapi; auto-generates deterministic gradient avatars for other platforms (no network dependency)
- **Platform Badges** — Twitch subscriber/mod/broadcaster, Kick mod/VIP/subscriber/verified/broadcaster/og, YouTube icons, and all platform logos in 5 display styles
- **Event Styling** — Subs, follows, cheers, donations get special treatment with gradient backgrounds, glow effects, and platform-specific colors
- **One-Click OBS Script** — Generates a Lua script that creates all 3 scenes and browser sources automatically
- **Built-in Demo Mode** — Preview exactly how your overlay will look before going live
- **Zero Dependencies** — No Node.js, no npm, no build step. Pure static files served by any web server (or opened directly from your filesystem)

---

## Quick Start

### Option 1: Local Files (Simplest — No Docker)

1. **Download or clone** this repository
2. **Open `settings.html`** in your browser (double-click it, or drag it into Chrome/Firefox)
3. The live preview starts automatically with demo messages
4. Configure your settings (platforms, appearance, etc.)
5. Copy the 2 layer URLs using the **Front / Back** buttons at the top
6. In OBS, add 3 Browser Sources — one URL per source, transparent background checked
7. Stack them in your scene: Back (bottom) → Middle → Front (top)

That's it. No Docker, no web server, no command line needed.

### Option 2: Docker

```bash
git clone https://github.com/Metalbenji/danmakuchat.git
cd danmakuchat
docker compose up -d
```

Then open `http://localhost:8088/settings.html` in your browser.

### Option 3: OBS Lua Script (Auto-Setup)

1. Open `settings.html` and configure your settings
2. Click the **OBS Script** button in the header to download `danmaku_setup.lua`
3. In OBS, go to **Tools → Scripts** and click the **+** button
4. Select the downloaded `danmaku_setup.lua` file
5. The script creates 3 scenes automatically:
   - **Danmaku Back** — with a browser source pointing to the back layer
   - **Danmaku Front** — with a browser source pointing to the front layer
6. Add these scenes as scene sources to your streaming scene and layer them however you want

You can safely re-run the script — it removes old sources before creating new ones.

---

## Requirements

| Software | Required | Notes |
|----------|----------|-------|
| **OBS Studio** | Yes | Any recent version with browser source support |
| **Streamer.bot** | Yes (for Twitch/YouTube/Kick/Donations) | Default: `127.0.0.1:8080` |
| **TikFinity** | Only for TikTok | Must be running locally on port `21213` |
| **Docker** | Optional | Alternative to local file serving |

---

## Supported Platforms

### Chat Platforms

| Platform | Connection | Chat Events |
|----------|-----------|-------------|
| **Twitch** | Streamer.bot WebSocket | Messages, Follows, Subs, Gift Subs, Gift Bombs, Bits, Raids, Announcements, Rewards, Shared Chat |
| **YouTube** | Streamer.bot WebSocket | Messages, Super Chats, Super Stickers, Memberships, Gift Memberships, Membership Trains |
| **Kick** | Direct Pusher WebSocket + Streamer.bot | Messages, Follows, Subs, Gift Subs, Mass Gifts, Rewards, Raids, Gifts, Gift Sub Trains |
| **TikTok** | TikFinity WebSocket (`localhost:21213`) | Messages, Follows, Gifts, Subs, Joins, Shares, Likes, Small Gifts |

### Donation Platforms

| Platform | Events |
|----------|--------|
| **StreamElements** | Tips |
| **StreamLabs** | Donations |
| **Patreon** | Pledges |
| **Ko-fi** | Donations, Subscriptions, Shop Orders |
| **TipeeeStream** | Donations |
| **Fourthwall** | Donations, Subscriptions, Orders, Gifts |

All donation platforms route through Streamer.bot — no extra WebSocket connections needed.

---

## OBS Setup Guide

### Method A: Manual Setup

1. **Open `settings.html`** in your browser and configure all your settings
2. **Copy the layer URLs** using the Front / Back buttons at the top of the page
3. In OBS, go to your streaming scene
4. Add **3 Browser Sources** (Sources → + → Browser):
   - Source 1: Name it "Danmaku Back", paste the Back URL
   - Source 2: Name it "Danmaku Middle", paste the Middle URL
   - Source 3: Name it "Danmaku Front", paste the Front URL
5. For each browser source:
   - Set **Width** and **Height** to your stream resolution (e.g. 1920 × 1080)
   - Check **"Refresh browser when scene becomes active"** (recommended)
   - The overlay renders with a transparent background automatically
6. In your scene's source list, order them:
   - **Danmaku Back** (bottom)
   - **Danmaku Middle** (middle)
   - **Danmaku Front** (top)
7. Set each source to **Stretch to inner bounds** (right-click → Transform → Stretch to inner bounds) if needed

### Method B: OBS Lua Script (One-Click)

See [Quick Start → Option 3](#option-3-obs-lua-script-auto-setup) above.

### Method C: Separate Scenes (Recommended for Compositing)

The OBS Lua script creates 2 separate scenes (one per layer). This lets you add each scene as a **scene source** to any other scene, giving you full control over positioning, cropping, and layering. For example:

- Add "Danmaku Back" to your gameplay scene, scaled to 80% with blur
- Add "Danmaku Middle" to your BRB screen at a different position
- Add "Danmaku Front" to your main streaming scene only

---

## Settings Overview

Open `settings.html` to access the full settings dashboard. All settings are organized into sections:

### Streamer.bot Connection
- **Server Address** — IP/hostname of your Streamer.bot instance (default: `192.168.0.19`)
- **Port** — WebSocket port (default: `8080`)
- **Connection Status** — Live indicator showing if the overlay is connected to Streamer.bot

### General
| Setting | Default | Description |
|---------|---------|-------------|
| Font Size | 2.5x | Base text size multiplier (range: 0.5x – 5x) |
| Font Family | DM Sans | Any installed web font |
| Font Weight | Normal | Normal, Medium, Semi-Bold, Bold |
| Background Color | #000000 | Overlay background (usually transparent in OBS) |
| Background Opacity | 0 | 0 = transparent (recommended for OBS) |
| Show Timestamps | Off | Display time next to messages |
| 24h Format | Off | Use 24-hour timestamps |
| Direction | Left | Messages scroll right-to-left (Left) or left-to-right (Right) |

### Appearance

**Speed & Density**
| Setting | Default | Description |
|---------|---------|-------------|
| Scroll Speed | 15s | How long a message takes to cross the screen |
| Speed Randomness | 3s | Random variation added to scroll speed |
| Lane Density | 28px | Vertical spacing between message lanes |
| Lane Reuse Gap | 40px | Minimum pixel gap before the same lane is reused (higher = fewer message trains, less bunching) |
| Vertical Jitter | 10px | Random up/down nudge within a lane so rows don't look perfectly rigid |
| Max Danmaku | 80 | Maximum messages on screen at once |

**Message Style**
| Setting | Default | Description |
|---------|---------|-------------|
| Chat Background | None | Dark, Light, Solid, or None |
| Chat Border | None | Subtle, Light, or None |
| Message Opacity | 1.0 | Overall message opacity (0.1 – 1.0) |
| Text Shadow | Heavy | None, Light, Medium, Heavy |

**Badges & Avatars**
| Setting | Default | Description |
|---------|---------|-------------|
| Show Badges | On | Display platform badges (mod, sub, etc.) |
| Show Avatars | On | Show user avatars next to names |
| Icon Size | Auto | Avatar size (0 = auto-scale with font size) |
| Show Username | On | Display usernames |
| Show Separator | On | Show colon between username and message |
| Platform Badge | Logo | Logo, Pill, Name, Hider, or Off |

### Depth & Layers

**Layer Routing** — Messages are distributed across 3 layers using deterministic hashing so all OBS sources agree on placement:
| Setting | Default | Description |
|---------|---------|-------------|
| Preview Layer | All | Which layer to preview (Middle, Front, Back, All) |
| Front Layer Chance | 20% | Chance a normal chat message goes to the front layer |
| Back Layer Chance | 30% | Chance a normal chat message goes to the back layer |

| Events | Always | Events (subs, follows, donations) always go to front |

**Star-Field Depth Effect**
| Setting | Default | Description |
|---------|---------|-------------|
| Depth Effect | On | Random scale and opacity on back-layer messages |
| Min Scale | 0.2 | Smallest size for depth-shrunk messages |
| Max Scale | 1.5 | Largest size for depth-grown messages |
| Min/Max Opacity | 0.3 – 1.0 | Opacity range for depth effect |

**Layer Effects**
| Setting | Default | Description |
|---------|---------|-------------|
| Back Layer Blur | 1px | Gaussian blur on back-layer messages |
| Back Layer Opacity | 0.7 | How faded the back layer appears |
| Front Layer Glow | On | Subtle glow effect on front-layer messages |

### Event Messages
| Setting | Default | Description |
|---------|---------|-------------|
| Event Style | Solid | Solid, Glass, Bordered, or Minimal |
| Event BG Opacity | 1.0 | Background fill opacity (0 = transparent, 1 = fully opaque) |
| Event Font Size | Much Larger | Same, Slightly Larger, Larger, Much Larger |
| Event Duration Bonus | +2s | Extra time events stay on screen |
| Event Padding X/Y | 28px / 8px | Padding around event messages |
| Event Left Padding | 16px | Left padding (for platform badges) |
| Event Glow | On | Glow effect behind event messages |
| Platform Colors | On | Use platform-specific colors for events |
| Highlight Value Color | #fbbf24 | Color for donation/tip amounts |

### Filtering
| Setting | Default | Description |
|---------|---------|-------------|
| Ignore Commands | On | Hide messages starting with `!` |
| Ignore Chatters | Streamlabs, Streamelements | Comma-separated usernames to filter out |
| Min/Max Message Length | 0 / 0 | Length filters (0 = disabled) |
| Spam Protection | 0ms | Per-user cooldown between messages |
| Hide Emotes | Off | Strip emote codes from messages |

### Platforms
Toggle individual platforms and event types on/off. Each chat platform has granular sub-toggles for every event type (e.g., Twitch has separate toggles for Messages, Follows, Bits, Subs, Gift Subs, Raids, etc.).

---

## How It Works

### Architecture

```
Streamer.bot (WebSocket)
        │
        ├──→ sb.js (connection handler)
        │       │
        │       ├──→ modules/twitch/module.js
        │       ├──→ modules/youtube/module.js
        │       ├──→ modules/kick/module.js (+ direct Pusher WS)
        │       └──→ modules/tiktok/module.js (via TikFinity)
        │               │
        │               └──→ danmaku.js (core engine)
        │                       │
        │                       ├── Layer routing (hash-based)
        │                       ├── Lane management (collision avoidance)
        │                       ├── DOM creation (chat + events)
        │                       └── CSS animation (GPU-composited)
        │
        └──→ Donation modules (StreamElements, StreamLabs, etc.)
```

### 3-Layer System

The overlay runs 3 independent browser sources in OBS, each loading the same `overlay.html` with a different `?layer=` parameter:

- **`?layer=back`** — Messages routed to the back layer get CSS blur and reduced opacity for a depth-of-field effect
- **`?layer=front`** — Events (subs, follows, donations) and rare messages with glow effects

All 3 sources use **deterministic hash-based routing** — the same message always goes to the same layer, so there's no duplication or disagreement between sources.

### Settings as URL Parameters

All configuration is encoded in the overlay URL. This means:
- No server-side state — works from `file://` or any web server
- Each OBS browser source stores its own settings in its URL
- Changing a setting in the dashboard updates the URL; copy the new URL to OBS to apply
- The OBS Lua script bakes all current settings into the URLs it generates

---

## Project Structure

```
danmakuchat/
├── index.html              # Production overlay (loaded in OBS browser sources)
├── overlay.html            # Preview overlay (cache-busting for settings page)
├── settings.html           # Settings dashboard with live preview
├── css/
│   ├── danmaku.css         # Overlay/danmaku styling
│   └── settings.css        # Settings page styling
├── js/
│   ├── danmaku.js          # Core danmaku engine (lanes, routing, animation, demo)
│   ├── sb.js               # Streamer.bot WebSocket connection (raw, no library)
│   ├── settings.js         # Settings dashboard logic (sections, preview, URL gen)
│   ├── vendor/
│   │   ├── purify.min.js   # DOMPurify HTML sanitizer
│   │   └── streamerbot-client.min.js  # @streamerbot/client (CDN fallback)
│   └── modules/
│       ├── twitch/         # Twitch chat + all event types
│       ├── youtube/        # YouTube chat + Super Chats + Memberships
│       ├── kick/           # Kick chat + events + direct Pusher WebSocket
│       ├── tiktok/         # TikTok via TikFinity WebSocket
│       ├── streamelements/ # StreamElements tips
│       ├── streamlabs/     # StreamLabs donations
│       ├── patreon/        # Patreon pledges
│       ├── kofi/           # Ko-fi donations + subs + shop
│       ├── tipeeestream/   # TipeeeStream donations
│       └── fourthwall/     # Fourthwall donations + subs + gifts
├── Dockerfile              # nginx:alpine based container
├── docker-compose.yml      # Port 8088:80
├── nginx.conf              # Static serving + CORS headers for OBS
└── README.md
```

---

## Performance Notes

The overlay is optimized for smooth performance in OBS's Chromium Embedded Framework (CEF):

- **GPU-composited animations** — Uses `translate3d()` and `will-change: transform` to promote elements to GPU layers
- **No `backdrop-filter`** — Removed from defaults as it's extremely expensive in OBS CEF
- **Layout isolation** — `contain: layout style paint` on each message prevents layout thrashing
- **Live HTMLCollection culling** — Old messages are cleaned up using the browser's live DOM collection instead of querySelectorAll
- **CSS custom properties for depth** — Avoids transform conflicts between inline styles and keyframe animations

If you experience lag in OBS, try:
- Reducing **Max Danmaku** (fewer messages on screen)
- Increasing **Lane Density** (fewer lanes to manage)
- Disabling **Depth Effect**
- Reducing **Scroll Speed** (longer duration = fewer concurrent animations)

---

## Troubleshooting

### Messages aren't appearing in OBS
- Make sure **Streamer.bot is running** and the connection status in settings shows green
- Check the **Server Address and Port** match your Streamer.bot instance
- Verify the browser source URL contains all your settings (copy it fresh from the settings page)
- Try checking **"Refresh browser when scene becomes active"** in the browser source properties

### Overlay shows a white/colored background instead of transparent
- Make sure **Background Opacity is set to 0** in settings
- In the browser source properties, **"Transparent background" should be checked** (it is by default when using the generated URLs)

### Messages are too small in OBS
- Increase the **Font Size** slider (goes up to 5x)
- Make sure your browser source **Width and Height** match your stream resolution (e.g. 1920 × 1080)

### Events are too transparent / too opaque
- Use the **Event BG Opacity** slider — it directly controls the background fill
- 1.0 = fully opaque, 0 = completely transparent, 0.5 = semi-transparent

### Text opacity slider doesn't seem to work
- If **Depth Effect** is enabled, opacity is multiplied with the depth randomness — this is by design so depth-shrunk messages also appear faded
- Try moving the slider to an extreme value (0.1 or 1.0) to see the difference

### Kick chat isn't working
- Kick uses a **direct Pusher WebSocket** (not just Streamer.bot)
- Make sure your Kick chatroom ID is configured in Streamer.bot (Streamer.bot fetches it via `/GetBroadcaster`)

### TikTok isn't working
- TikTok requires **TikFinity** running locally on port `21213`
- Make sure TikFinity is connected to your TikTok account
- Enable the TikTok platform toggle in settings

---

## Credits

- Inspired by [ChatRD](https://github.com/vortisrd/chatrd) by VortisRD
- Uses [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization
- Icons from [Font Awesome](https://fontawesome.com/) 7.1.0
- Fonts: [DM Sans](https://fonts.google.com/specimen/DM+Sans) by Colophon Foundry, [Orbitron](https://fonts.google.com/specimen/Orbitron) by Matt McInerney
- Platform logos are trademarks of their respective owners
