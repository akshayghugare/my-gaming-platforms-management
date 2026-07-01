/*!
 * GAMRU gamification widgets — embed loader.
 *
 * Usage on any website:
 *
 *   <div class="gamification_widget" data-type="tokens"></div>
 *   <div class="gamification_widget" data-type="missions"></div>
 *
 *   <script
 *     src="https://gamru.com/embed.js"
 *     data-client-id="my-client"
 *     data-auth-key="GAMRU_CLIENT_AUTH_KEY"
 *     data-email="player@example.com">
 *   </script>
 *
 * The script scans for `.gamification_widget` elements and renders each one as
 * a self-sizing iframe served by GAMRU (`/widget/<type>`). It reuses the same
 * validate + data flow as the standalone widget pages.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      if ((all[i].src || '').indexOf('embed.js') !== -1) {
        script = all[i];
        break;
      }
    }
  }

  var cfg = (script && script.dataset) || {};
  // Base origin that serves /widget/<type>. Defaults to the script's origin.
  var BASE = (cfg.base || (script && script.src ? new URL(script.src).origin : '')).replace(/\/$/, '');
  var CLIENT_ID = cfg.clientId || '';
  var AUTH_KEY = cfg.authKey || '';
  var EMAIL = cfg.email || '';
  // Origin of the games-platform frontend (where the real mission games live).
  // The interactive mission/tournament/bundle widgets nest a game from here.
  var GAMES_BASE = cfg.gamesBase || '';

  // Inline (shrink-wrap) widgets vs. block (full-width) widgets.
  var INLINE_TYPES = { tokens: 1, 'gamification-data': 1, avatar: 1, 'badge-level': 1 };

  // Per-element data-* attributes forwarded to the widget URL.
  var PASS = {
    'gamification-type': 'g',
    size: 'size',
    'show-level': 'showLevel',
    'progress-type': 'progressType',
    'text-color': 'textColor',
    reverse: 'reverse',
  };

  var seq = 0;

  function buildUrl(el) {
    var type = el.getAttribute('data-type');
    if (!type) return null;
    var params = new URLSearchParams();
    if (CLIENT_ID) params.set('clientId', CLIENT_ID);
    if (AUTH_KEY) params.set('authKey', AUTH_KEY);
    if (EMAIL) params.set('email', EMAIL);
    if (GAMES_BASE) params.set('gamesBase', GAMES_BASE);
    params.set('embed', '1');
    // The validate request runs from inside the widget iframe, so its Origin is
    // the widget host (gamru), not THIS page. Pass the real embedding hostname
    // so the per-widget allowed_domains whitelist can be matched against it.
    try {
      if (window.location && window.location.hostname) {
        params.set('domain', window.location.hostname);
      }
    } catch (e) {
      /* sandboxed — skip */
    }

    for (var attr in PASS) {
      if (!Object.prototype.hasOwnProperty.call(PASS, attr)) continue;
      var v = el.getAttribute('data-' + attr);
      if (v !== null && v !== '') params.set(PASS[attr], v);
    }

    var fid = 'gw_' + ++seq;
    params.set('fid', fid);
    return { url: BASE + '/widget/' + type + '?' + params.toString(), fid: fid, type: type };
  }

  function mount(el) {
    if (el.getAttribute('data-gw-mounted') === '1') return;
    var built = buildUrl(el);
    if (!built) return;
    el.setAttribute('data-gw-mounted', '1');

    var inline = !!INLINE_TYPES[built.type];
    var iframe = document.createElement('iframe');
    iframe.src = built.url;
    iframe.title = 'gamification-' + built.type;
    iframe.setAttribute('data-gw-id', built.fid);
    if (inline) iframe.setAttribute('data-gw-inline', '1');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.style.border = '0';
    iframe.style.background = 'transparent';
    iframe.style.display = inline ? 'inline-block' : 'block';
    iframe.style.verticalAlign = 'middle';
    iframe.style.width = inline ? '120px' : '100%';
    iframe.style.height = inline ? '120px' : '140px';

    el.appendChild(iframe);
  }

  function scan(root) {
    var nodes = (root || document).querySelectorAll('.gamification_widget');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  // Auto-resize: widgets post their content size; match the iframe to it.
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.source !== 'gamru-widget' || !d.fid) return;
    var frame = document.querySelector('iframe[data-gw-id="' + d.fid + '"]');
    if (!frame) return;
    if (d.height) frame.style.height = Math.ceil(d.height) + 'px';
    // Inline widgets shrink-wrap their content, so keep width in sync too
    // (block widgets stay 100% wide).
    if (d.width && frame.getAttribute('data-gw-inline') === '1') {
      frame.style.width = Math.ceil(d.width) + 'px';
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scan();
    });
  } else {
    scan();
  }

  // Expose a manual hook so SPAs can re-scan after rendering new widgets.
  window.GamruWidgets = { scan: scan, mount: mount };
})();
