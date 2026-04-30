# DanmakuChat

A danmaku (bullet chat / 弾幕) style multi-platform chat overlay for streaming with OBS. Chat messages float across the screen in real-time, supporting multiple streaming platforms through Streamer.bot.

## Features

- **Danmaku/Bullet Chat**: Messages float across the screen in classic danmaku style
- **3-Layer System**: Front (events), Middle (standard chat), Back (blurred depth) - each as a separate OBS browser source
- **Multi-Platform Support**: Twitch, YouTube, Kick, TikTok, and 6 donation platforms
- **Platform Badges**: Full badge support - Twitch subscriber/moderator/broadcaster badges, Kick badges (moderator, VIP, subscriber, verified, etc.), YouTube icons, and all platform logos
- **Event Styling**: Events (subs, follows, cheers, donations) get special styling with platform-colored gradients and glow effects
- **Chance-Based Routing**: Normal chat messages randomly distributed across layers; events always go to the front layer
- **Configurable**: Full settings page with URL parameter generation for OBS
- **Streamer.bot Integration**: Connects to Streamer.bot for all platform events

## Supported Platforms

### Chat Platforms
| Platform | Connection | Events |
|----------|-----------|--------|
| **Twitch** | Streamer.bot WebSocket | Chat, Follows, Subs, Gift Subs, Bits, Raids, Announcements, Rewards |
| **YouTube** | Streamer.bot WebSocket | Chat, Super Chats, Super Stickers, Memberships, Gift Memberships |
| **Kick** | Direct Pusher WebSocket + Streamer.bot | Chat, Follows, Subs, Gift Subs, Mass Gifts, Rewards, Raids, Gifts |
| **TikTok** | TikFinity WebSocket | Chat, Follows, Gifts, Subs, Joins, Shares, Likes |

### Donation Platforms
| Platform | Connection | Events |
|----------|-----------|--------|
| **StreamElements** | Streamer.bot | Tips |
| **StreamLabs** | Streamer.bot | Donations |
| **Patreon** | Streamer.bot | Pledges |
| **Ko-fi** | Streamer.bot | Donations, Subscriptions, Shop Orders |
| **TipeeeStream** | Streamer.bot | Donations |
| **Fourthwall** | Streamer.bot | Donations, Subscriptions, Orders, Gifts |

## OBS Setup

1. Open `settings.html` in your browser
2. Configure your platforms and appearance settings
3. Copy the 3 layer URLs (Front, Middle, Back)
4. In OBS, add **3 Browser Sources** - one for each layer
5. Set each source to transparent background
6. Layer them: Back (bottom) → Middle → Front (top)

## Requirements

- **Streamer.bot** running locally (default: `127.0.0.1:8080`)
- **TikFinity** for TikTok support (optional)
- **OBS Studio** with browser source support

## Credits

Inspired by [ChatRD](https://github.com/vortisrd/chatrd) by VortisRD. Uses the same `@streamerbot/client` library for Streamer.bot integration and similar platform module architecture.
