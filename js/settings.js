/* ============================================ */
/*   DANMAKU CHAT - SETTINGS LOGIC              */
/*   Live Preview, Demo Mode, URL Builder      */
/* ============================================ */

(function () {
  'use strict';

  // ─── Default Configuration ──────────────────
  const DEFAULTS = {
    // Streamer.bot
    streamerBotServerAddress: '192.168.0.19',
    streamerBotServerPort: '8080',
    // Preview
    enableDemo: true,
    // General
    fontSize: 1,
    chatFontFamily: 'DM Sans',
    fontWeight: 'normal',
    bgColor: '#000000',
    bgOpacity: 0,
    showTimestamps: false,
    use24h: false,
    direction: 'left',
    // Appearance - Speed & Density
    danmakuSpeed: 8,
    speedRandomness: 2,
    danmakuDensity: 28,
    maxDanmaku: 80,
    // Appearance - Message Style
    chatBg: 'none',
    chatBorder: 'none',
    danmakuOpacity: 1,
    textShadow: 'medium',
    // Appearance - Badges & Avatars
    showBadges: true,
    showAvatar: true,
    avatarSize: 20,
    showUsername: true,
    showSeparator: true,
    // Appearance - Platform Badge
    platformBadge: 'logo',
    badgeSize: 1.1,
    // Appearance - Message Padding
    paddingX: 12,
    paddingY: 4,
    borderRadius: 5,
    elementGap: 5,
    // Depth & Layers
    layer: 'all',
    frontChance: 0.05,
    backChance: 0.4,
    depthEffect: true,
    depthMinScale: 0.45,
    depthMaxScale: 1.3,
    depthMinOpacity: 0.3,
    depthMaxOpacity: 1.0,
    backLayerBlur: 1.5,
    backLayerOpacity: 0.7,
    frontLayerGlow: true,
    // Event Messages
    eventStyle: 'solid',
    eventOpacity: 0.7,
    eventFontSize: 'larger',
    eventDurationBonus: 2,
    eventPaddingX: 28,
    eventPaddingY: 8,
    eventLeftPadding: 16,
    showEventGlow: true,
    eventPlatformColors: true,
    highlightValueColor: '#fbbf24',
    // Filtering
    ignoreCommands: true,
    ignoreChatters: 'Streamlabs,Streamelements',
    minMsgLength: 0,
    maxMsgLength: 0,
    spamProtection: 0,
    hideEmotes: false,
    // Platforms
    showTwitch: true,
    showTwitchMessages: true,
    showTwitchFollows: true,
    showTwitchBits: true,
    showTwitchSubs: true,
    showTwitchGiftedSubs: true,
    showTwitchMassGiftedSubs: true,
    showTwitchRewardRedemptions: true,
    showTwitchRaids: true,
    showTwitchAnnouncements: true,
    showTwitchSharedChat: true,
    showYoutube: true,
    showYouTubeMessages: true,
    showYouTubeSuperChats: true,
    showYouTubeSuperStickers: true,
    showYouTubeMemberships: true,
    showYouTubeGiftMemberships: true,
    showYouTubeMembershipsTrain: true,
    showKick: true,
    showKickMessages: true,
    showKickFollows: true,
    showKickSubs: true,
    showKickGiftedSubs: true,
    showKickMassGiftedSubs: true,
    showKickRewardRedemptions: true,
    showKickRaids: true,
    showKickGifts: true,
    showKickGiftedSubsUserTrain: true,
    showTiktok: true,
    showTikTokMessages: true,
    showTikTokFollows: true,
    showTikTokGifts: true,
    showTikTokSubs: true,
    showTikTokJoins: false,
    showTikTokLikes: false,
    showTikTokShares: false,
    showSmallTikTokGifts: true,
    showStreamelements: true,
    showStreamlabs: true,
    showPatreon: true,
    showKofi: true,
    showTipeee: true,
    showFourthwall: true,
  };

  let config = { ...DEFAULTS };
  let refreshTimeout = null;
  let demoPaused = false;
  let demoActive = false;
  let demoInterval = null;
  let lastPreviewSrc = '';

  // ─── Build Settings Sections ────────────────
  function buildSettingsSections() {
    return [
      {
        id: 'section-streamerbot',
        title: 'Streamer.bot',
        icon: '🔌',
        settings: [
          { key: 'streamerBotServerAddress', label: 'Server Address', type: 'text', placeholder: '127.0.0.1' },
          { key: 'streamerBotServerPort', label: 'Port', type: 'number', min: 1, max: 65535, placeholder: '8080' },
        ],
        extra: '<div class="connection-status"><span class="connection-dot" id="sb-status-dot"></span><span id="sb-status-text">Not connected</span></div>',
      },
      {
        id: 'section-preview',
        title: 'Preview',
        icon: '👁️',
        settings: [
          { key: 'enableDemo', label: 'Demo Messages', type: 'toggle', tag: 'Preview' },
        ],
      },
      {
        id: 'section-general',
        title: 'General',
        icon: '⚙️',
        settings: [
          { key: 'fontSize', label: 'Font Size', type: 'range', min: 0.5, max: 3, step: 0.1, unit: 'x' },
          { key: 'chatFontFamily', label: 'Font Family', type: 'text', placeholder: 'DM Sans', wide: true },
          { key: 'fontWeight', label: 'Font Weight', type: 'select', options: [
            { value: 'normal', label: 'Normal' },
            { value: '500', label: 'Medium' },
            { value: '600', label: 'Semibold' },
            { value: 'bold', label: 'Bold' },
          ]},
          { key: 'bgColor', label: 'Background Color', type: 'color' },
          { key: 'bgOpacity', label: 'Background Opacity', type: 'range', min: 0, max: 1, step: 0.05, unit: '' },
          { key: 'showTimestamps', label: 'Show Timestamps', type: 'toggle' },
          { key: 'use24h', label: '24h Format', type: 'toggle' },
          { key: 'direction', label: 'Direction', type: 'select', options: [
            { value: 'left', label: 'Left to Right' },
            { value: 'right', label: 'Right to Left' },
          ]},
        ],
      },
      {
        id: 'section-appearance',
        title: 'Appearance',
        icon: '✏️',
        settings: [
          // Speed & Density
          { key: '_sub_speed', label: 'Speed & Density', type: 'subsection' },
          { key: 'danmakuSpeed', label: 'Scroll Speed', type: 'range', min: 3, max: 20, step: 0.5, unit: 's' },
          { key: 'speedRandomness', label: 'Speed Randomness', type: 'range', min: 0, max: 5, step: 0.5, unit: 's' },
          { key: 'danmakuDensity', label: 'Lane Density', type: 'range', min: 20, max: 60, step: 2, unit: 'px' },
          { key: 'maxDanmaku', label: 'Max Danmaku Count', type: 'number', min: 10, max: 300, step: 1 },
          // Message Style
          { key: '_sub_message', label: 'Message Style', type: 'subsection' },
          { key: 'chatBg', label: 'Chat Background', type: 'select', options: [
            { value: 'dark', label: 'Dark (glass)' },
            { value: 'light', label: 'Light (glass)' },
            { value: 'solid', label: 'Solid dark' },
            { value: 'none', label: 'None / Transparent' },
          ]},
          { key: 'chatBorder', label: 'Chat Border', type: 'select', options: [
            { value: 'subtle', label: 'Subtle' },
            { value: 'none', label: 'None' },
            { value: 'colored', label: 'Colored (platform)' },
          ]},
          { key: 'danmakuOpacity', label: 'Message Opacity', type: 'range', min: 0.1, max: 1, step: 0.05, unit: '' },
          { key: 'textShadow', label: 'Text Shadow Intensity', type: 'select', options: [
            { value: 'none', label: 'None' },
            { value: 'light', label: 'Light' },
            { value: 'medium', label: 'Medium' },
            { value: 'heavy', label: 'Heavy' },
          ]},
          // Badges & Avatars
          { key: '_sub_badges', label: 'Badges & Avatars', type: 'subsection' },
          { key: 'showBadges', label: 'Show Badges', type: 'toggle' },
          { key: 'showAvatar', label: 'Show Avatars', type: 'toggle' },
          { key: 'avatarSize', label: 'Avatar Size', type: 'range', min: 0, max: 40, step: 2, unit: 'px' },
          { key: 'showUsername', label: 'Show Username', type: 'toggle' },
          { key: 'showSeparator', label: 'Show Separator', type: 'toggle' },
          // Platform Badge
          { key: '_sub_platform_badge', label: 'Platform Badge', type: 'subsection' },
          { key: 'platformBadge', label: 'Badge Style', type: 'select', options: [
            { value: 'logo', label: 'Logo' },
            { value: 'pill', label: 'Pill' },
            { value: 'name', label: 'Name' },
            { value: 'hider', label: 'Hider (icon only)' },
            { value: 'off', label: 'Off' },
          ]},
          { key: 'badgeSize', label: 'Badge Size', type: 'range', min: 0.5, max: 2, step: 0.1, unit: 'x' },
          // Message Padding
          { key: '_sub_padding', label: 'Message Padding', type: 'subsection' },
          { key: 'paddingX', label: 'Horizontal Padding', type: 'range', min: 2, max: 24, step: 2, unit: 'px' },
          { key: 'paddingY', label: 'Vertical Padding', type: 'range', min: 1, max: 12, step: 1, unit: 'px' },
          { key: 'borderRadius', label: 'Border Radius', type: 'range', min: 0, max: 20, step: 1, unit: 'px' },
          { key: 'elementGap', label: 'Element Gap', type: 'range', min: 0, max: 12, step: 1, unit: 'px' },
        ],
      },
      {
        id: 'section-depth',
        title: 'Depth & Layers',
        icon: '📑',
        settings: [
          // Layer Routing
          { key: '_sub_routing', label: 'Layer Routing', type: 'subsection' },
          { key: 'layer', label: 'Preview Layer', type: 'select', tag: 'Preview', options: [
            { value: 'middle', label: 'Middle (Standard chat)' },
            { value: 'front', label: 'Front (Events + rare chat)' },
            { value: 'back', label: 'Back (Blurred depth)' },
            { value: 'all', label: 'All Layers (stacked)' },
          ]},
          { key: 'frontChance', label: 'Front Layer Chance', type: 'range', min: 0, max: 0.2, step: 0.01, unit: '%', displayPercent: true },
          { key: 'backChance', label: 'Back Layer Chance', type: 'range', min: 0, max: 1, step: 0.05, unit: '%', displayPercent: true },
          // Star-Field Depth
          { key: '_sub_depth', label: 'Star-Field Depth Effect', type: 'subsection' },
          { key: 'depthEffect', label: 'Depth Effect', type: 'toggle' },
          { key: 'depthMinScale', label: 'Min Scale', type: 'range', min: 0.2, max: 0.8, step: 0.05, unit: '' },
          { key: 'depthMaxScale', label: 'Max Scale', type: 'range', min: 1, max: 1.5, step: 0.05, unit: '' },
          { key: 'depthMinOpacity', label: 'Min Opacity', type: 'range', min: 0.1, max: 0.6, step: 0.05, unit: '' },
          { key: 'depthMaxOpacity', label: 'Max Opacity', type: 'range', min: 0.7, max: 1, step: 0.05, unit: '' },
          // Back Layer Effects
          { key: '_sub_backlayer', label: 'Back Layer Effects', type: 'subsection' },
          { key: 'backLayerBlur', label: 'Back Layer Blur', type: 'range', min: 0, max: 5, step: 0.5, unit: 'px' },
          { key: 'backLayerOpacity', label: 'Back Layer Opacity', type: 'range', min: 0.1, max: 1, step: 0.05, unit: '' },
          { key: 'frontLayerGlow', label: 'Front Layer Glow', type: 'toggle' },
        ],
      },
      {
        id: 'section-events',
        title: 'Event Messages',
        icon: '⭐',
        settings: [
          { key: 'eventStyle', label: 'Event Style', type: 'select', options: [
            { value: 'solid', label: 'Solid' },
            { value: 'glass', label: 'Glass' },
            { value: 'bordered', label: 'Bordered' },
            { value: 'minimal', label: 'Minimal' },
          ]},
          { key: 'eventOpacity', label: 'Event Opacity', type: 'range', min: 0.3, max: 1, step: 0.05, unit: '' },
          { key: 'eventFontSize', label: 'Event Font Size', type: 'select', options: [
            { value: 'same', label: 'Same as chat' },
            { value: 'slightly-larger', label: 'Slightly larger' },
            { value: 'larger', label: 'Larger' },
            { value: 'much-larger', label: 'Much larger' },
          ]},
          { key: 'eventDurationBonus', label: 'Event Duration Bonus', type: 'range', min: 0, max: 10, step: 1, unit: 's', prefix: '+' },
          { key: 'eventPaddingX', label: 'Event Padding X', type: 'range', min: 8, max: 40, step: 2, unit: 'px' },
          { key: 'eventPaddingY', label: 'Event Padding Y', type: 'range', min: 4, max: 16, step: 1, unit: 'px' },
          { key: 'eventLeftPadding', label: 'Event Left Padding', type: 'range', min: 8, max: 40, step: 2, unit: 'px' },
          { key: 'showEventGlow', label: 'Show Event Glow', type: 'toggle' },
          { key: 'eventPlatformColors', label: 'Use Platform Colors', type: 'toggle' },
          { key: 'highlightValueColor', label: 'Highlight Value Color', type: 'color' },
        ],
      },
      {
        id: 'section-filtering',
        title: 'Filtering',
        icon: '🔍',
        settings: [
          { key: 'ignoreCommands', label: 'Ignore Commands', type: 'toggle' },
          { key: 'ignoreChatters', label: 'Ignore Chatters', type: 'text', placeholder: 'Streamlabs,Streamelements', wide: true },
          { key: 'minMsgLength', label: 'Min Message Length', type: 'number', min: 0, max: 100 },
          { key: 'maxMsgLength', label: 'Max Message Length', type: 'number', min: 0, max: 500 },
          { key: 'spamProtection', label: 'Spam Protection', type: 'number', min: 0, max: 30000, step: 500 },
          { key: 'hideEmotes', label: 'Hide Emotes', type: 'toggle' },
        ],
      },
      {
        id: 'section-platforms',
        title: 'Platforms',
        icon: '🌐',
        type: 'platforms',
      },
      {
        id: 'section-obs',
        title: 'OBS Setup Guide',
        icon: '📺',
        type: 'obs-guide',
      },
    ];
  }

  // ─── Platform Definitions ───────────────────
  function buildPlatformDefs() {
    return [
      {
        key: 'Twitch', name: 'Twitch', color: '#9146ff',
        logo: 'js/modules/twitch/images/logo-twitch.svg',
        subSettings: [
          { key: 'showTwitchMessages', label: 'Chat Messages' },
          { key: 'showTwitchFollows', label: 'Follows' },
          { key: 'showTwitchBits', label: 'Bits / Cheers' },
          { key: 'showTwitchSubs', label: 'Subscriptions' },
          { key: 'showTwitchGiftedSubs', label: 'Gifted Subs' },
          { key: 'showTwitchMassGiftedSubs', label: 'Gift Bombs' },
          { key: 'showTwitchRewardRedemptions', label: 'Rewards' },
          { key: 'showTwitchRaids', label: 'Raids' },
          { key: 'showTwitchAnnouncements', label: 'Announcements' },
          { key: 'showTwitchSharedChat', label: 'Shared Chat' },
        ],
      },
      {
        key: 'Youtube', name: 'YouTube', color: '#ff0000',
        logo: 'js/modules/youtube/images/logo-youtube.svg',
        subSettings: [
          { key: 'showYouTubeMessages', label: 'Chat Messages' },
          { key: 'showYouTubeSuperChats', label: 'Super Chats' },
          { key: 'showYouTubeSuperStickers', label: 'Super Stickers' },
          { key: 'showYouTubeMemberships', label: 'Memberships' },
          { key: 'showYouTubeGiftMemberships', label: 'Gifted Memberships' },
          { key: 'showYouTubeMembershipsTrain', label: 'Membership Trains' },
        ],
      },
      {
        key: 'Kick', name: 'Kick', color: '#53fc18',
        logo: 'js/modules/kick/images/logo-kick.svg',
        subSettings: [
          { key: 'showKickMessages', label: 'Chat Messages' },
          { key: 'showKickFollows', label: 'Follows' },
          { key: 'showKickSubs', label: 'Subscriptions' },
          { key: 'showKickGiftedSubs', label: 'Gifted Subs' },
          { key: 'showKickMassGiftedSubs', label: 'Gift Bombs' },
          { key: 'showKickRewardRedemptions', label: 'Rewards' },
          { key: 'showKickRaids', label: 'Raids' },
          { key: 'showKickGifts', label: 'Gifts' },
          { key: 'showKickGiftedSubsUserTrain', label: 'Gift Sub Train' },
        ],
        note: '<i class="fa-solid fa-circle-info"></i> Kick chat uses a direct WebSocket connection. Configure your chatroom ID in Streamer.bot.',
      },
      {
        key: 'Tiktok', name: 'TikTok', color: '#ff0050',
        logo: 'js/modules/tiktok/images/logo-tiktok.svg',
        subSettings: [
          { key: 'showTikTokMessages', label: 'Chat Messages' },
          { key: 'showTikTokFollows', label: 'Follows' },
          { key: 'showTikTokGifts', label: 'Gifts' },
          { key: 'showTikTokSubs', label: 'Subscriptions' },
          { key: 'showTikTokJoins', label: 'Joins' },
          { key: 'showTikTokLikes', label: 'Likes' },
          { key: 'showTikTokShares', label: 'Shares' },
          { key: 'showSmallTikTokGifts', label: 'Small Gifts' },
        ],
        note: '<i class="fa-solid fa-circle-info"></i> TikTok requires <a href="https://tikfinity.com" target="_blank">TikFinity</a> running locally (default: ws://localhost:21213).',
      },
      {
        key: 'Streamelements', name: 'StreamElements', color: '#00bfff',
        logo: 'js/modules/streamelements/images/logo-streamelements.svg',
      },
      {
        key: 'Streamlabs', name: 'StreamLabs', color: '#00c2ff',
        logo: 'js/modules/streamlabs/images/logo-streamlabs.svg',
      },
      {
        key: 'Patreon', name: 'Patreon', color: '#ff424d',
        logo: 'js/modules/patreon/images/logo-patreon.svg',
      },
      {
        key: 'Kofi', name: 'Ko-fi', color: '#434b57',
        logo: 'js/modules/kofi/images/logo-kofi.svg',
      },
      {
        key: 'Tipeee', name: 'TipeeeStream', color: '#3baaee',
        logo: 'js/modules/tipeeestream/images/logo-tipeeestream.svg',
      },
      {
        key: 'Fourthwall', name: 'Fourthwall', color: '#ffffff',
        logo: 'js/modules/fourthwall/images/logo-fourthwall.svg',
      },
    ];
  }

  // ─── Render Sections ────────────────────────
  function renderSections(sections, container) {
    container.innerHTML = '';

    sections.forEach(function (section) {
      if (section.type === 'platforms') {
        renderPlatformsSection(container);
        return;
      }
      if (section.type === 'obs-guide') {
        renderOBSSection(container);
        return;
      }

      var sectionEl = document.createElement('div');
      sectionEl.className = 'settings-section';
      sectionEl.id = section.id;

      var settingsHTML = section.settings.map(function (s) { return buildSettingHTML(s); }).join('');

      sectionEl.innerHTML =
        '<div class="section-header" data-section-id="' + section.id + '">' +
          '<span class="section-icon">' + section.icon + '</span>' +
          '<span class="section-title">' + section.title + '</span>' +
          '<svg class="section-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>' +
        '</div>' +
        '<div class="section-body">' +
          settingsHTML +
          (section.extra || '') +
        '</div>';

      container.appendChild(sectionEl);

      // Collapsible
      var header = sectionEl.querySelector('.section-header');
      var body = sectionEl.querySelector('.section-body');
      var chevron = sectionEl.querySelector('.section-chevron');
      header.addEventListener('click', function () {
        var isOpen = !body.classList.contains('collapsed');
        body.classList.toggle('collapsed');
        chevron.classList.toggle('collapsed', isOpen);
      });

      // Bind controls
      section.settings.forEach(function (s) {
        if (s.type !== 'subsection') bindSetting(s, sectionEl);
      });
    });

    // Add Layer URLs at the very bottom
    renderLayerURLs(container);
  }

  // ─── Build Setting HTML ─────────────────────
  function buildSettingHTML(s) {
    if (s.type === 'subsection') {
      return '<div class="subsection-title">' + s.label + '</div>';
    }

    var id = 'setting-' + s.key;
    var inputHTML = '';
    var isOn = !!config[s.key];
    var tag = s.tag ? '<span class="setting-tag">' + s.tag + '</span>' : '';

    switch (s.type) {
      case 'toggle':
        inputHTML =
          '<div class="toggle-switch ' + (isOn ? 'on' : '') + '" id="' + id + '" data-key="' + s.key + '">' +
            '<div class="toggle-track"><div class="toggle-thumb"></div></div>' +
            '<span class="toggle-state ' + (isOn ? 'on' : '') + '">' +
              '<span class="state-dot" style="background:' + (isOn ? 'var(--green)' : 'var(--red)') + '"></span>' +
              (isOn ? 'ON' : 'OFF') +
            '</span>' +
          '</div>';
        break;

      case 'range':
        var displayVal = config[s.key];
        if (s.displayPercent) {
          displayVal = Math.round(parseFloat(config[s.key]) * 100) + '%';
        } else if (s.prefix) {
          displayVal = s.prefix + config[s.key] + (s.unit || '');
        } else {
          displayVal = config[s.key] + (s.unit || '');
        }
        inputHTML =
          '<div class="range-control">' +
            '<input type="range" id="' + id + '" data-key="' + s.key + '" ' +
              'min="' + s.min + '" max="' + s.max + '" step="' + (s.step || 1) + '" ' +
              'value="' + config[s.key] + '" class="range-input">' +
            '<span class="range-value" id="' + id + '-value">' + displayVal + '</span>' +
          '</div>';
        break;

      case 'number':
        inputHTML =
          '<input type="number" id="' + id + '" data-key="' + s.key + '" ' +
            (s.min !== undefined ? 'min="' + s.min + '"' : '') +
            (s.max !== undefined ? 'max="' + s.max + '"' : '') +
            (s.step ? 'step="' + s.step + '"' : '') +
            'value="' + config[s.key] + '" class="text-input" placeholder="' + (s.placeholder || '') + '">';
        break;

      case 'text':
        inputHTML =
          '<input type="text" id="' + id + '" data-key="' + s.key + '" ' +
            'value="' + config[s.key] + '" class="text-input' + (s.wide ? ' wide' : '') + '" ' +
            'placeholder="' + (s.placeholder || '') + '">';
        break;

      case 'color':
        inputHTML =
          '<div class="color-control">' +
            '<input type="color" id="' + id + '" data-key="' + s.key + '" value="' + config[s.key] + '" class="color-input">' +
            '<span class="color-value" id="' + id + '-value">' + config[s.key] + '</span>' +
          '</div>';
        break;

      case 'select':
        inputHTML =
          '<select id="' + id + '" data-key="' + s.key + '" class="select-input">' +
            s.options.map(function (o) {
              return '<option value="' + o.value + '"' + (config[s.key] === o.value ? ' selected' : '') + '>' + o.label + '</option>';
            }).join('') +
          '</select>';
        break;
    }

    return '<div class="setting-row" id="row-' + s.key + '">' +
      '<div class="setting-label"><span>' + s.label + '</span>' + tag + '</div>' +
      '<div class="setting-input">' + inputHTML + '</div>' +
    '</div>';
  }

  // ─── Bind Setting Controls ──────────────────
  function bindSetting(s, sectionEl) {
    var id = 'setting-' + s.key;
    var el = sectionEl.querySelector('#' + id);
    if (!el) return;

    switch (s.type) {
      case 'toggle':
        el.addEventListener('click', function () {
          config[s.key] = !config[s.key];
          var isOn = config[s.key];
          el.className = 'toggle-switch ' + (isOn ? 'on' : '');
          el.querySelector('.toggle-thumb').style.transform = isOn ? 'translateX(18px)' : '';
          el.querySelector('.toggle-track').style.background = isOn ? 'var(--green-bg)' : 'var(--red-bg)';
          el.querySelector('.toggle-track').style.borderColor = isOn ? 'var(--green-border)' : 'var(--red-border)';
          var stateEl = el.querySelector('.toggle-state');
          stateEl.className = 'toggle-state ' + (isOn ? 'on' : '');
          stateEl.innerHTML = '<span class="state-dot" style="background:' + (isOn ? 'var(--green)' : 'var(--red)') + '"></span>' + (isOn ? 'ON' : 'OFF');
          onConfigChange();
        });
        break;

      case 'range':
        el.addEventListener('input', function () {
          config[s.key] = parseFloat(el.value);
          var displayVal = el.value;
          if (s.displayPercent) {
            displayVal = Math.round(parseFloat(el.value) * 100) + '%';
          } else if (s.prefix) {
            displayVal = s.prefix + el.value + (s.unit || '');
          } else {
            displayVal = el.value + (s.unit || '');
          }
          document.getElementById(id + '-value').textContent = displayVal;
          onConfigChange();
        });
        break;

      case 'number':
        el.addEventListener('change', function () {
          config[s.key] = parseFloat(el.value) || 0;
          onConfigChange();
        });
        break;

      case 'text':
        el.addEventListener('input', function () {
          config[s.key] = el.value;
          onConfigChange();
        });
        break;

      case 'color':
        el.addEventListener('input', function () {
          config[s.key] = el.value;
          document.getElementById(id + '-value').textContent = el.value;
          onConfigChange();
        });
        break;

      case 'select':
        el.addEventListener('change', function () {
          config[s.key] = el.value;
          // Force preview refresh on layer change (different iframe count)
          if (s.key === 'layer') {
            lastPreviewSrc = '';
            updateLayerIndicators();
          }
          onConfigChange();
        });
        break;
    }
  }

  // ─── Render Platforms Section ───────────────
  function renderPlatformsSection(container) {
    var platforms = buildPlatformDefs();

    var sectionEl = document.createElement('div');
    sectionEl.className = 'settings-section';
    sectionEl.id = 'section-platforms';

    var bodyContent = '';

    // Chat platforms (first 4: Twitch, YouTube, Kick, TikTok)
    var chatPlatforms = platforms.slice(0, 4);
    chatPlatforms.forEach(function (p) {
      bodyContent += '<div class="platform-block">';
      bodyContent += '<div class="platform-row">';
      bodyContent += '<img class="platform-logo" src="' + p.logo + '" alt="' + p.name + '">';
      bodyContent += '<span class="platform-dot" style="background:' + p.color + '"></span>';
      bodyContent += '<span class="platform-name">' + p.name + '</span>';
      var mainKey = 'show' + p.key;
      var isOn = !!config[mainKey];
      bodyContent +=
        '<div class="toggle-switch ' + (isOn ? 'on' : '') + '" data-key="' + mainKey + '" data-toggle-target="' + p.key.toLowerCase() + '-sub">' +
          '<div class="toggle-track"><div class="toggle-thumb"></div></div>' +
          '<span class="toggle-state ' + (isOn ? 'on' : '') + '">' +
            '<span class="state-dot" style="background:' + (isOn ? 'var(--green)' : 'var(--red)') + '"></span>' +
            (isOn ? 'ON' : 'OFF') +
          '</span>' +
        '</div>';
      bodyContent += '</div>';

      if (p.subSettings) {
        bodyContent += '<div class="platform-sub-settings" id="' + p.key.toLowerCase() + '-sub" style="display:' + (isOn ? 'block' : 'none') + ';">';
        p.subSettings.forEach(function (ss) {
          var ssOn = !!config[ss.key];
          bodyContent +=
            '<div class="setting-row">' +
              '<div class="setting-label"><span>' + ss.label + '</span></div>' +
              '<div class="setting-input">' +
                '<div class="toggle-switch ' + (ssOn ? 'on' : '') + '" data-key="' + ss.key + '">' +
                  '<div class="toggle-track"><div class="toggle-thumb"></div></div>' +
                  '<span class="toggle-state ' + (ssOn ? 'on' : '') + '">' +
                    '<span class="state-dot" style="background:' + (ssOn ? 'var(--green)' : 'var(--red)') + '"></span>' +
                    (ssOn ? 'ON' : 'OFF') +
                  '</span>' +
                '</div>' +
              '</div>' +
            '</div>';
        });
        if (p.note) {
          bodyContent += '<p class="platform-note">' + p.note + '</p>';
        }
        bodyContent += '</div>';
      }

      bodyContent += '</div>';
    });

    // Donation platforms (rest)
    bodyContent += '<div class="donation-header"><i class="fa-solid fa-heart"></i> Donation Platforms</div>';
    var donationPlatforms = platforms.slice(4);
    donationPlatforms.forEach(function (p) {
      bodyContent += '<div class="platform-block">';
      bodyContent += '<div class="platform-row">';
      bodyContent += '<img class="platform-logo" src="' + p.logo + '" alt="' + p.name + '">';
      bodyContent += '<span class="platform-dot" style="background:' + p.color + '"></span>';
      bodyContent += '<span class="platform-name">' + p.name + '</span>';
      var mainKey = 'show' + p.key;
      var isOn = !!config[mainKey];
      bodyContent +=
        '<div class="toggle-switch ' + (isOn ? 'on' : '') + '" data-key="' + mainKey + '">' +
          '<div class="toggle-track"><div class="toggle-thumb"></div></div>' +
          '<span class="toggle-state ' + (isOn ? 'on' : '') + '">' +
            '<span class="state-dot" style="background:' + (isOn ? 'var(--green)' : 'var(--red)') + '"></span>' +
            (isOn ? 'ON' : 'OFF') +
          '</span>' +
        '</div>';
      bodyContent += '</div></div>';
    });

    sectionEl.innerHTML =
      '<div class="section-header" data-section-id="section-platforms">' +
        '<span class="section-icon">🌐</span>' +
        '<span class="section-title">Platforms</span>' +
        '<svg class="section-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>' +
      '</div>' +
      '<div class="section-body">' + bodyContent + '</div>';

    container.appendChild(sectionEl);

    // Collapsible
    var header = sectionEl.querySelector('.section-header');
    var body = sectionEl.querySelector('.section-body');
    var chevron = sectionEl.querySelector('.section-chevron');
    header.addEventListener('click', function () {
      var isOpen = !body.classList.contains('collapsed');
      body.classList.toggle('collapsed');
      chevron.classList.toggle('collapsed', isOpen);
    });

    // Bind all toggle switches in this section
    sectionEl.querySelectorAll('.toggle-switch').forEach(function (toggleEl) {
      toggleEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var key = toggleEl.getAttribute('data-key');
        if (!key || !(key in config)) return;

        config[key] = !config[key];
        var isOn = config[key];
        toggleEl.className = 'toggle-switch ' + (isOn ? 'on' : '');
        toggleEl.querySelector('.toggle-thumb').style.transform = isOn ? 'translateX(18px)' : '';
        toggleEl.querySelector('.toggle-track').style.background = isOn ? 'var(--green-bg)' : 'var(--red-bg)';
        toggleEl.querySelector('.toggle-track').style.borderColor = isOn ? 'var(--green-border)' : 'var(--red-border)';
        var stateEl = toggleEl.querySelector('.toggle-state');
        stateEl.className = 'toggle-state ' + (isOn ? 'on' : '');
        stateEl.innerHTML = '<span class="state-dot" style="background:' + (isOn ? 'var(--green)' : 'var(--red)') + '"></span>' + (isOn ? 'ON' : 'OFF');

        // Show/hide sub-settings
        var targetId = toggleEl.getAttribute('data-toggle-target');
        if (targetId) {
          var target = document.getElementById(targetId);
          if (target) target.style.display = isOn ? 'block' : 'none';
        }

        onConfigChange();
      });
    });
  }

  // ─── Render OBS Section ─────────────────────
  function renderOBSSection(container) {
    var sectionEl = document.createElement('div');
    sectionEl.className = 'settings-section';
    sectionEl.id = 'section-obs';

    sectionEl.innerHTML =
      '<div class="section-header" data-section-id="section-obs">' +
        '<span class="section-icon">📺</span>' +
        '<span class="section-title">OBS Setup Guide</span>' +
        '<svg class="section-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>' +
      '</div>' +
      '<div class="section-body">' +
        '<div class="obs-steps">' +
          '<div class="step"><div class="step-num">1</div><div class="step-content"><h4>Add 3 Browser Sources</h4><p>In OBS, add <strong>3 Browser Sources</strong> (one for each layer: Front, Middle, Back). Name them "Danmaku Front", "Danmaku Middle", "Danmaku Back".</p></div></div>' +
          '<div class="step"><div class="step-num">2</div><div class="step-content"><h4>Set the URLs</h4><p>Copy the layer URLs from below. The <strong>Front</strong> layer goes on top, <strong>Middle</strong> in the middle, <strong>Back</strong> at the bottom of your source list.</p></div></div>' +
          '<div class="step"><div class="step-num">3</div><div class="step-content"><h4>Custom Size</h4><p>Set each browser source to the same dimensions (e.g., your full stream resolution). Set <strong>width</strong> and <strong>height</strong> in the browser source properties.</p></div></div>' +
          '<div class="step"><div class="step-num">4</div><div class="step-content"><h4>Transparent Background</h4><p>Make sure "Transparent background" is <strong>checked</strong> in each browser source so only the danmaku messages are visible over your stream.</p></div></div>' +
        '</div>' +
        '<div class="obs-note"><strong>Tip:</strong> Use the <em>Copy OBS URL</em> button in the header to quickly copy the middle layer URL for the most common setup.</div>' +
      '</div>';

    container.appendChild(sectionEl);

    var header = sectionEl.querySelector('.section-header');
    var body = sectionEl.querySelector('.section-body');
    var chevron = sectionEl.querySelector('.section-chevron');
    header.addEventListener('click', function () {
      var isOpen = !body.classList.contains('collapsed');
      body.classList.toggle('collapsed');
      chevron.classList.toggle('collapsed', isOpen);
    });
  }

  // ─── Render Layer URLs (Bottom) ────────────
  function renderLayerURLs(container) {
    var div = document.createElement('div');
    div.className = 'url-boxes';
    div.innerHTML =
      '<div class="url-boxes-title"><i class="fa-solid fa-link"></i> Layer URLs</div>' +
      '<div class="url-box">' +
        '<div class="url-box-label"><i class="fa-solid fa-arrow-up"></i> Front Layer URL</div>' +
        '<code id="url-front"></code>' +
        '<div class="copy-hint">Click to copy</div>' +
      '</div>' +
      '<div class="url-box">' +
        '<div class="url-box-label"><i class="fa-solid fa-minus"></i> Middle Layer URL</div>' +
        '<code id="url-middle"></code>' +
        '<div class="copy-hint">Click to copy</div>' +
      '</div>' +
      '<div class="url-box">' +
        '<div class="url-box-label"><i class="fa-solid fa-arrow-down"></i> Back Layer URL</div>' +
        '<code id="url-back"></code>' +
        '<div class="copy-hint">Click to copy</div>' +
      '</div>';

    container.appendChild(div);

    // Click to copy
    div.querySelectorAll('code').forEach(function (code) {
      code.addEventListener('click', function () {
        navigator.clipboard.writeText(code.textContent).then(function () {
          code.classList.add('copied');
          setTimeout(function () { code.classList.remove('copied'); }, 600);
        }).catch(function () {
          // Fallback
          var range = document.createRange();
          range.selectNodeContents(code);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
      });
    });
  }

  // ─── Config Change Handler ─────────────────
  function onConfigChange() {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(function () {
      // Force iframe reload by invalidating cache key
      lastPreviewSrc = '';
      refreshPreview();
      updateLayerURLDisplay();
      updateLayerIndicators();
      updatePreviewStatus();
    }, 300);
  }

  // ─── Update Preview Status ─────────────────
  function updatePreviewStatus() {
    var status = document.querySelector('#preview-status');
    if (!status) return;
    var layerLabel = config.layer === 'all' ? 'All Layers' : config.layer.charAt(0).toUpperCase() + config.layer.slice(1);
    if (!config.enableDemo) {
      status.innerHTML = '<span class="status-dot paused"></span><span>Demo Off</span>';
    } else if (demoPaused) {
      status.innerHTML = '<span class="status-dot paused"></span><span>Paused · ' + layerLabel + '</span>';
    } else {
      status.innerHTML = '<span class="status-dot active"></span><span>Live Preview · ' + layerLabel + '</span>';
    }
  }

  // ─── Generate Overlay URL ──────────────────
  function generateURL(layer, forPreview) {
    var params = new URLSearchParams();
    var defaults = DEFAULTS;
    Object.keys(defaults).forEach(function (key) {
      if (config[key] !== defaults[key]) {
        params.set(key, String(config[key]));
      }
    });
    params.set('layer', layer);
    if (forPreview) {
      params.set('preview', 'true');
      if (config.enableDemo !== false) {
        params.set('demo', 'true');
      }
      // Cache-bust so browser never serves stale overlay.html
      params.set('_t', String(Date.now()));
    }

    var basePath = window.location.pathname.replace('settings.html', 'overlay.html');
    return basePath + '?' + params.toString();
  }

  // ─── Update Layer URL Display ──────────────
  function updateLayerURLDisplay() {
    ['front', 'middle', 'back'].forEach(function (layer) {
      var el = document.getElementById('url-' + layer);
      if (el) {
        var url = generateURL(layer, false);
        el.textContent = url;
      }
    });
  }

  // ─── Update Layer Indicators ───────────────
  function updateLayerIndicators() {
    var layer = config.layer || 'middle';
    var isAll = layer === 'all';
    ['front', 'middle', 'back'].forEach(function(l) {
      var ind = document.getElementById('ind-' + l);
      if (ind) {
        if (isAll || l === layer) {
          ind.className = 'indicator-dot active';
        } else {
          ind.className = 'indicator-dot';
        }
      }
    });
  }

  // ─── Refresh Preview ───────────────────────
  function refreshPreview() {
    var previewContainer = document.getElementById('preview-container');
    var previewSize = document.getElementById('preview-size');
    if (!previewContainer) return;

    var sizeStr = previewSize ? previewSize.value : '1280x720';
    var parts = sizeStr.split('x');
    var w = parseInt(parts[0]) || 1280;
    var h = parseInt(parts[1]) || 720;

    var layer = config.layer || 'middle';
    var isAll = layer === 'all';

    // Generate a cache key so we don't reload needlessly
    var layers = isAll ? ['back', 'middle', 'front'] : [layer];
    var newSrcKey = layers.map(function(l) { return generateURL(l, true); }).join('|');
    if (newSrcKey === lastPreviewSrc) {
      // Just resize existing iframes
      var frames = previewContainer.querySelectorAll('.preview-iframe');
      frames.forEach(function(f) { f.style.width = w + 'px'; f.style.height = h + 'px'; });
      return;
    }
    lastPreviewSrc = newSrcKey;

    // Remove existing preview iframes
    var oldFrames = previewContainer.querySelectorAll('.preview-iframe');
    oldFrames.forEach(function(f) { f.remove(); });

    // Remove old wrapper if exists
    var oldWrapper = previewContainer.querySelector('.preview-stack');
    if (oldWrapper) oldWrapper.remove();

    if (isAll) {
      // All-layers mode: stack 3 iframes on top of each other
      var wrapper = document.createElement('div');
      wrapper.className = 'preview-stack';
      wrapper.style.position = 'relative';
      wrapper.style.width = w + 'px';
      wrapper.style.height = h + 'px';

      // Layer order: back (bottom) → middle → front (top)
      var layerOrder = ['back', 'middle', 'front'];
      layerOrder.forEach(function(l, i) {
        var iframe = document.createElement('iframe');
        iframe.id = 'preview-frame-' + l;
        iframe.className = 'preview-iframe';
        iframe.src = generateURL(l, true);
        iframe.allowTransparency = 'true';
        iframe.allow = 'autoplay';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = w + 'px';
        iframe.style.height = h + 'px';
        iframe.style.border = i === 2 ? '1px solid var(--border)' : 'none';
        iframe.style.borderRadius = 'var(--radius)';
        iframe.style.zIndex = i + 1;
        iframe.style.background = i === 0 ? '#000' : 'transparent';
        iframe.style.boxShadow = i === 2 ? '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)' : 'none';
        iframe.style.transition = 'width 0.3s ease, height 0.3s ease';
        wrapper.appendChild(iframe);
      });

      previewContainer.appendChild(wrapper);
    } else {
      // Single-layer mode: one iframe (keep id for backwards compat)
      var iframe = document.createElement('iframe');
      iframe.id = 'preview-frame';
      iframe.className = 'preview-iframe';
      iframe.src = generateURL(layer, true);
      iframe.allowTransparency = 'true';
      iframe.allow = 'autoplay';
      iframe.style.width = w + 'px';
      iframe.style.height = h + 'px';
      previewContainer.appendChild(iframe);
    }
  }

  // ─── Load Settings from URL ────────────────
  function loadSettingsFromURL() {
    var params = new URLSearchParams(window.location.search);
    params.forEach(function (value, key) {
      if (key === 'demo' || key === 'preview' || key === 'layer') return;
      if (key in config) {
        if (typeof config[key] === 'boolean') {
          config[key] = value === 'true';
        } else {
          config[key] = value;
        }
      }
    });

    var layerParam = params.get('layer');
    if (layerParam && ['front', 'middle', 'back', 'all'].indexOf(layerParam) !== -1) {
      config.layer = layerParam;
    }
  }

  // ─── Section Toggle (exposed globally) ─────
  window.toggleSection = function (headerEl) {
    var section = headerEl.parentElement;
    var body = section.querySelector('.section-body');
    var chevron = section.querySelector('.section-chevron');
    if (body) {
      var isOpen = !body.classList.contains('collapsed');
      body.classList.toggle('collapsed');
      if (chevron) chevron.classList.toggle('collapsed', isOpen);
    }
  };

  // ─── Scroll to Section (exposed globally) ──
  window.scrollToSection = function (id) {
    var panelScroll = document.getElementById('panel-scroll');
    var section = document.getElementById(id);
    if (!panelScroll || !section) return;

    // Ensure section is not collapsed
    var body = section.querySelector('.section-body');
    var chevron = section.querySelector('.section-chevron');
    if (body && body.classList.contains('collapsed')) {
      body.classList.remove('collapsed');
      if (chevron) chevron.classList.remove('collapsed');
    }

    var offset = section.offsetTop - panelScroll.offsetTop - 8;
    panelScroll.scrollTo({ top: offset, behavior: 'smooth' });

    // On mobile, close panel after scroll
    if (window.innerWidth <= 700) {
      var panel = document.getElementById('settings-panel');
      if (panel) panel.classList.remove('open');
    }
  };

  // ─── Mobile Panel Toggle ───────────────────
  window.toggleMobilePanel = function () {
    var panel = document.getElementById('settings-panel');
    if (panel) panel.classList.toggle('open');
  };

  // ═══════════════════════════════════════════
  //              DEMO MODE
  // ═══════════════════════════════════════════

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

  // Helper: get all preview iframes (single or stacked)
  function getPreviewIframes() {
    var container = document.getElementById('preview-container');
    if (!container) return [];
    return Array.from(container.querySelectorAll('.preview-iframe'));
  }

  // danmaku.js already has a postMessage listener — no injection needed
  window.startDemo = function () {
    if (demoPaused || !config.enableDemo) return;

    var attempts = 0;
    var maxAttempts = 30;

    function tryInit() {
      attempts++;
      var iframes = getPreviewIframes();
      if (iframes.length === 0) {
        if (attempts < maxAttempts) setTimeout(tryInit, 300);
        return;
      }

      // Wait until at least one iframe has contentWindow
      var ready = iframes.some(function(f) { return f.contentWindow; });
      if (!ready) {
        if (attempts < maxAttempts) setTimeout(tryInit, 300);
        return;
      }

      if (demoActive) return;
      demoActive = true;
      sendDemoMessage();

      demoInterval = setInterval(sendDemoMessage, 1000 + Math.random() * 2000);
    }

    setTimeout(tryInit, 500);
  };

  function sendDemoMessage() {
    if (demoPaused) return;
    var iframes = getPreviewIframes();
    if (iframes.length === 0) return;

    // Randomize next interval
    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = setInterval(sendDemoMessage, 1000 + Math.random() * 2000);
    }

    // Build one message
    var msg;
    if (Math.random() < 0.25) {
      var evt = demoEventMessages[Math.floor(Math.random() * demoEventMessages.length)];
      msg = {
        __danmakuDemo: true,
        msgType: 'event',
        platform: evt.platform,
        data: { username: evt.username, color: evt.color, action: evt.action }
      };
      if (evt.value) msg.data.value = evt.value;
      if (evt.message) msg.data.messageHtml = evt.message;
    } else {
      var chat = demoChatMessages[Math.floor(Math.random() * demoChatMessages.length)];
      msg = {
        __danmakuDemo: true,
        msgType: 'chat',
        platform: chat.platform,
        data: { text: chat.text, username: chat.username, color: chat.color }
      };
    }

    // Broadcast to all preview iframes
    iframes.forEach(function(iframe) {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(msg, '*');
        }
      } catch(e) { /* ignore cross-origin errors */ }
    });
  }

  // ─── Streamer.bot Connection Status ────────
  function initConnectionStatus() {
    var dot = document.getElementById('sb-status-dot');
    var text = document.getElementById('sb-status-text');
    if (!dot || !text) return;

    function checkConnection() {
      var addr = config.streamerBotServerAddress || '127.0.0.1';
      var port = config.streamerBotServerPort || '8080';
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
  }

  // ═══════════════════════════════════════════
  //           INITIALIZATION
  // ═══════════════════════════════════════════

  function init() {
    loadSettingsFromURL();

    var panelScroll = document.getElementById('panel-scroll');
    var sections = buildSettingsSections();
    renderSections(sections, panelScroll);

    var previewSize = document.getElementById('preview-size');

    // Preview size change
    previewSize.addEventListener('change', function() { lastPreviewSrc = ''; refreshPreview(); });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', function () {
      if (confirm('Reset all settings to defaults?')) {
        config = { ...DEFAULTS };
        renderSections(buildSettingsSections(), panelScroll);
        refreshPreview();
        initConnectionStatus();
      }
    });

    // Copy OBS URL button
    document.getElementById('btn-export').addEventListener('click', function () {
      var url = generateURL('middle', false);
      navigator.clipboard.writeText(url).then(function () {
        var btn = document.getElementById('btn-export');
        var origHTML = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> <span class="btn-text">Copied!</span>';
        setTimeout(function () { btn.innerHTML = origHTML; }, 2000);
      }).catch(function () {
        // Fallback
        prompt('Copy this URL:', url);
      });
    });

    // Pause/Resume demo
    document.getElementById('btn-pause-demo').addEventListener('click', function () {
      demoPaused = !demoPaused;
      var btn = document.getElementById('btn-pause-demo');

      if (demoPaused) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Resume';
        updatePreviewStatus();
        if (demoInterval) {
          clearInterval(demoInterval);
          demoInterval = null;
        }
      } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
        updatePreviewStatus();
        demoActive = false;
        startDemo();
      }
    });

    // Burst button
    document.getElementById('btn-burst').addEventListener('click', function () {
      demoActive = false;
      if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
      }
      lastPreviewSrc = '';
      refreshPreview();
    });

    // iframe load handler — use MutationObserver since iframes are now dynamic
    var previewContainer = document.getElementById('preview-container');
    var pendingFrameLoads = 0;

    function onFrameLoaded() {
      pendingFrameLoads--;
      if (pendingFrameLoads <= 0) {
        pendingFrameLoads = 0;
        demoActive = false;
        if (demoInterval) {
          clearInterval(demoInterval);
          demoInterval = null;
        }
        setTimeout(startDemo, 300);
      }
    }

    var iframeObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          var iframes = [];
          if (node.tagName === 'IFRAME' && node.classList.contains('preview-iframe')) {
            iframes.push(node);
          }
          if (node.tagName === 'DIV') {
            iframes = Array.from(node.querySelectorAll('iframe.preview-iframe'));
          }
          iframes.forEach(function(iframe) {
            pendingFrameLoads++;
            iframe.addEventListener('load', onFrameLoaded);
          });
        });
      });
    });
    iframeObserver.observe(previewContainer, { childList: true, subtree: true });

    // Initial preview
    updateLayerURLDisplay();
    updateLayerIndicators();
    updatePreviewStatus();
    refreshPreview();
    initConnectionStatus();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
