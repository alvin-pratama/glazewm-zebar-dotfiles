import * as zebar from 'zebar';

const volDisplay = 'bar';
const batDisplay = 'bar';
const cpuDisplay = 'ring';
const memDisplay = 'ring';
const showBar = false;
let darkMode = true;
const betterWsWindows = true;

const showNet = false;
const showBat = false;
const showCpu = false;
const showMem = false;
const showVol = false;
const showMic = false;
const showAppCount = false;
const showDate = true;
const showScoreBoard = false;
const showBinary = true;
const showNormal = false;
const showTiling = false;
const showWsWindows = false;
const wsWindowsMode = 'active';

const providers = await zebar.createProviderGroup({
  glazewm: { type: 'glazewm' },
  date: { type: 'date', formatting: 'HH:mm' },
  time12h: { type: 'date', formatting: 'hh:mm a' },
  timeFull: { type: 'date', formatting: 'HH:mm:ss' },
  timePart: { type: 'date', formatting: 'HHmm' },
  dateTime: { type: 'date', formatting: 'EEE, MMM dd yyyy HH:mm' },
  battery: { type: 'battery' },
  cpu: { type: 'cpu' },
  memory: { type: 'memory' },
  network: { type: 'network' },
  audio: { type: 'audio' },
});

let accentMode = 'rgb';
let hue = 220;
let intervalId;
let blinkToggle = false;
const wsColors = {
  '1': '65 117 250',
  '2': '245 146 24',
  '3': '74 222 128',
  '4': '167 139 250',
  '5': '239 68 68',
};

function startRgbCycle() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    hue = (hue + 5) % 360;
    const [r, g, b] = hslToRgb(hue, 95, 62).map(c => Math.round(c * 255));
    document.documentElement.style.setProperty('--customable-single-tone', `${r} ${g} ${b}`);
  }, 50);
}

function setAccentMode(mode) {
  accentMode = mode;
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  if (mode === 'rgb') {
    startRgbCycle();
  } else if (mode === 'blink') {
    let t = 0;
    intervalId = setInterval(() => {
      t = (t + 0.04) % (Math.PI * 2);
      const s = (Math.sin(t) + 1) / 2;
      const v = Math.round(140 + s * (245 - 140));
      document.documentElement.style.setProperty('--customable-single-tone', `${v} ${v} ${v}`);
    }, 16);
  } else if (mode === 'workspace') {
  } else {
    document.documentElement.style.setProperty('--customable-single-tone', mode === 'white' ? '245 245 245' : '140 140 140');
  }
  render();
}

function cycleAccentMode() {
  const modes = ['rgb', 'white', 'dim', 'blink', 'workspace'];
  setAccentMode(modes[(modes.indexOf(accentMode) + 1) % modes.length]);
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  return [f(0), f(8), f(4)];
}

startRgbCycle();

const root = document.getElementById('root');

function render() {
  const o = providers.outputMap;
  const ws = o.glazewm;
  if (!ws) return;
  const focusedWs = o.glazewm.allWorkspaces?.find(w => w.hasFocus);

  if (accentMode === 'workspace' && focusedWs) {
    const c = wsColors[focusedWs.name];
    if (c) document.documentElement.style.setProperty('--customable-single-tone', c);
  }

  let html = '<div class="left">';
  html += '<div class="center-mode">';

  if (showDate) {
    if (o.date) {
      if (showBinary) {
        const digits = o.timePart?.formatted?.split('').map(Number);
        let bcHtml = '<span class="binary-clock">';
        for (let i = 0; i < digits.length; i++) {
          const d = digits[i];
          if (d === ':') {
            bcHtml += '<span class="bc-sep"></span>';
            continue;
          }
          const dNum = Number(d);
          bcHtml += `<span class="bc-col${i < 2 ? ' bc-hour' : ''}">`;
          for (const b of [8, 4, 2, 1]) {
            bcHtml += `<span class="bc-bit ${(dNum & b) ? 'on' : 'off'}"></span>`;
          }
          bcHtml += '</span>';
        }
        bcHtml += '</span>';
        html += bcHtml;
      }
    }
  }

  if (showAppCount) {
    if (focusedWs && focusedWs.children) {
      html += `<span class="app-count">${focusedWs.children.length}</span>`;
    }
  }

  if (showWsWindows) {
    let wsWindows;
    if (wsWindowsMode === 'all') {
      wsWindows = o.glazewm.allWorkspaces?.flatMap(ws => ws.children || []) || [];
    } else if (wsWindowsMode === 'active') {
      const win = focusedWs?.children?.find(c => c.hasFocus) || focusedWs?.children?.[0];
      wsWindows = win ? [win] : [];
    } else {
      const win = focusedWs?.children || [];
      wsWindows = win;
    }
    if (wsWindows.length > 0) {
      html += '<span class="ws-windows">';
      const toTitleCase = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      for (const w of wsWindows) {
        let title = w.processName || w.title || '';
        title = title.split(/\s+/).map(toTitleCase).join(' ');
        const maxLen = 20;
        const display = title.length > maxLen ? title.slice(0, maxLen) + '\u2026' : title;
        const cls = w.hasFocus ? 'ws-win focused' : 'ws-win';
        if (betterWsWindows) {
          html += `<button class="${cls}" data-win-id="${w.id || ''}" data-minimized="${w.isMinimized || false}">${display}</button>`;
        } else {
          html += `<span class="date-normal">${display}</span>`;
        }
      }
      html += '</span>';
    }
  }

  html += '</div>';
  html += '</div>';

  html += '<div class="center">';
  html += '<div class="workspace-list">';
  const wsByName = {};
  for (const w of o.glazewm.allWorkspaces) wsByName[w.name] = w;
  const icons = {
    '1': '<span>1</span>',
    '2': '<span>2</span>',
    '3': '<span>3</span>',
    '4': '<span>4</span>',
    '5': '<span>5</span>',
  };
  for (const name of ['1', '2', '3', '4', '5']) {
    const w = wsByName[name];
    let cls = 'workspace';
    if (w) {
      cls += ' exists';
      if (w.children.length > 0) cls += ' has-children';
      if (w.isDisplayed) cls += ' displayed';
      if (w.hasFocus) cls += ' focused';
    }
    const icon = icons[name] || '<i class="nf nf-fa-circle"></i>';
    html += `<button class="${cls}" data-name="${name}">${icon}</button>`;
  }
  html += '</div>';
  html += '</div>';

  html += '<div class="right">';

  if (showNet) {
    const net = o.network?.defaultInterface;
    const gw = o.network?.defaultGateway;

    const hasInterface = o.network?.defaultInterface !== null;
    const isOnline = navigator.onLine && hasInterface;

    html += `<span class="net-box ${isOnline ? 'online' : 'offline'}">`;
    if (isOnline) {
      html += `<span class="net-arrows"><span class="net-up">\u25B2</span><span class="net-down off">\u25BC</span></span>`;
    } else {
      html += `<span class="net-arrows"><span class="net-up off">\u25B2</span><span class="net-down">\u25BC</span></span>`;
    }
    html += '</span>';
  }

  if (showCpu) {
    const cpu = o.cpu;
    if (cpu) {
      const pct = Math.round(cpu.usage);

      if (cpuDisplay === 'bar' && showBar) {
        html += `<span class="cpu-wrap cpu-bar-wrap">
          <span class="cpu-bar-icon"><i class="nf nf-fa-microchip"></i></span>
          <span class="cpu-bar-track">
            <span class="cpu-bar-fill" style="width:${pct}%;background:var(--cpu-color)"></span>
          </span>
          <span class="cpu-bar-pct">${pct}</span>
        </span>`;
      } else if (cpuDisplay === 'ring' && showBar) {
        html += `<span class="cpu-wrap">
          <span class="cpu-ring" style="background: conic-gradient(var(--cpu-color) 0% ${pct}%, var(--bat-track) ${pct}% 100%)">
            <span class="cpu-ring-inner"><i class="nf nf-fa-microchip"></i></span>
          </span>
        </span>`;
      } else {
        html += `<span class="cpu-wrap cpu-bar-wrap">
          <span class="cpu-bar-icon"><i class="nf nf-fa-microchip"></i></span>
          <span class="cpu-bar-pct">${pct}</span>
        </span>`;
      }
    }
  }

  if (showMem) {
    const mem = o.memory;
    if (mem) {
      const pct = Math.round(mem.usage);

      if (memDisplay === 'bar' && showBar) {
        html += `<span class="ram-wrap ram-bar-wrap">
          <span class="ram-bar-icon"><i class="nf nf-fa-server"></i></span>
          <span class="ram-bar-track">
            <span class="ram-bar-fill" style="width:${pct}%;background:var(--ram-color)"></span>
          </span>
          <span class="ram-bar-pct">${pct}</span>
        </span>`;
      } else if (memDisplay === 'ring' && showBar) {
        html += `<span class="ram-wrap">
          <span class="ram-ring" style="background: conic-gradient(var(--ram-color) 0% ${pct}%, var(--bat-track) ${pct}% 100%)">
            <span class="ram-ring-inner"><i class="nf nf-fa-server"></i></span>
          </span>
        </span>`;
      } else {
        html += `<span class="ram-wrap ram-bar-wrap">
          <span class="ram-bar-icon"><i class="nf nf-fa-server"></i></span>
          <span class="ram-bar-pct">${pct}</span>
        </span>`;
      }
    }
  }

  if (showVol) {
    const audio = o.audio?.defaultPlaybackDevice;
    if (audio) {
      const vol = Math.round(audio.volume);
      const muted = audio.isMuted || vol === 0;
      let volColor = '#4ade80';
      if (vol > 50) volColor = '#facc15';
      if (vol > 75) volColor = '#ef4444';

      if (volDisplay === 'bar' && showBar) {
        html += `<span class="vol-wrap vol-bar-wrap ${muted ? 'muted' : ''}">
          <span class="vol-bar-icon">${muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}</span>
          <span class="vol-bar-track">
            <span class="vol-bar-fill" style="width:${vol}%;background:${volColor}"></span>
          </span>
          <span class="vol-bar-pct">${vol}</span>
        </span>`;
      } else if (volDisplay === 'ring' && showBar) {
        html += `<span class="vol-wrap ${muted ? 'muted' : ''}">
          <span class="vol-ring" style="background: conic-gradient(${volColor} 0% ${vol}%, var(--bat-track) ${vol}% 100%)">
            <span class="vol-ring-inner">${muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}</span>
          </span>
        </span>`;
      } else {
        html += `<span class="vol-wrap vol-bar-wrap ${muted ? 'muted' : ''}">
          <span class="vol-bar-icon">${muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}</span>
          <span class="vol-bar-pct">${vol}</span>
        </span>`;
      }
    }
  }

  if (showMic) {
    const mic = o.audio?.defaultRecordingDevice;
    if (mic) {
      const vol = Math.round(mic.volume);
      const muted = mic.isMuted || vol === 0;
      let volColor = '#4ade80';
      if (vol > 50) volColor = '#facc15';
      if (vol > 75) volColor = '#ef4444';

      if (volDisplay === 'bar' && showBar) {
        html += `<span class="vol-wrap vol-bar-wrap ${muted ? 'muted' : ''}">
          <span class="vol-bar-icon">${muted ? '\uD83C\uDFA4' : '\uD83C\uDF99'}</span>
          <span class="vol-bar-track">
            <span class="vol-bar-fill" style="width:${vol}%;background:${volColor}"></span>
          </span>
          <span class="vol-bar-pct">${vol}</span>
        </span>`;
      } else if (volDisplay === 'ring' && showBar) {
        html += `<span class="vol-wrap mic-wrap ${muted ? 'muted' : ''}">
          <span class="vol-ring" style="background: conic-gradient(${volColor} 0% ${vol}%, var(--bat-track) ${vol}% 100%)">
            <span class="vol-ring-inner">${muted ? '\uD83C\uDFA4' : '\uD83C\uDF99'}</span>
          </span>
        </span>`;
      } else {
        html += `<span class="vol-wrap vol-bar-wrap ${muted ? 'muted' : ''}">
          <span class="vol-bar-icon">${muted ? '\uD83C\uDFA4' : '\uD83C\uDF99'}</span>
          <span class="vol-bar-pct">${vol}</span>
        </span>`;
      }
    }
  }

  if (showBat) {
    const bat = o.battery;
    if (bat) {
      const pct = Math.round(bat.chargePercent);
      const charging = bat.isCharging;
      let barColor = 'var(--bat-high)';
      if (pct <= 20) barColor = 'var(--bat-low)';
      else if (pct <= 50) barColor = 'var(--bat-mid)';

      if (batDisplay === 'bar' && showBar) {
        html += `<span class="bat-wrap bat-bar-wrap ${charging ? 'charging' : ''}">
          <span class="bat-bar-icon">\u26A1</span>
          <span class="bat-bar-track">
            <span class="bat-bar-fill" style="width:${pct}%;background:${barColor}"></span>
          </span>
          <span class="bat-bar-pct">${pct}</span>
        </span>`;
      } else if (batDisplay === 'ring' && showBar) {
        html += `<span class="bat-wrap ${charging ? 'charging' : ''}">
          <span class="bat-ring" style="background: conic-gradient(${barColor} 0% ${pct}%, var(--bat-track) ${pct}% 100%)">
            <span class="bat-ring-inner">\uD83D\uDD0B</span>
          </span>
        </span>`;
      } else {
        html += `<span class="bat-wrap bat-bar-wrap ${charging ? 'charging' : ''}">
          <span class="bat-bar-icon">\u26A1</span>
          <span class="bat-bar-pct">${pct}</span>
        </span>`;
      }
    }
  }

  if (showDate) {
    if (o.date) {
      const parts = o.date.formatted.split('');
      if (showScoreBoard) {
        const chars = parts.map((c, i) =>
          c === ':' ? `<span class="sb-sep">:</span>` :
          i < 2 ? `<span class="sb-digit sb-hour">${c}</span>` :
          `<span class="sb-digit">${c}</span>`
        ).join('');
        html += `<span class="scoreboard">${chars}</span>`;
      }

      if (showNormal) {
        html += `<span class="date-normal">${o.time12h.formatted}</span>`;
      }
    }
  }

  if (showTiling) {
    if (o.glazewm.tilingDirection) {
      const dir = o.glazewm.tilingDirection;
      const icon = dir === 'horizontal' ? 'nf-md-swap_horizontal' : 'nf-md-swap_vertical';
      html += `<span class="mode-wrap"><button class="tiling-direction nf ${icon}" id="tiling-btn"></button></span>`;
    }
  }

  html += `<span class="theme-btn" id="theme-btn" hidden>${darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}</span>`;
  html += `<span class="accent-mode" id="accent-mode-btn">${
    accentMode === 'rgb' ? '\uD83C\uDFA8' :
    accentMode === 'white' ? '\u2600\uFE0F' :
    accentMode === 'blink' ? '\uD83D\uDCA1' :
    accentMode === 'workspace' ? '\uD83C\uDFAF' : '\uD83C\uDF19'
  }</span>`;

  html += '</div>';

  root.innerHTML = html;
  document.body.classList.toggle('light', !darkMode);

  root.querySelectorAll('.ws-win').forEach(btn => {
    btn.onmousedown = async () => {
      const winId = btn.dataset.winId;
      if (!winId) return;
      await providers.outputMap.glazewm.runCommand(`focus --container-id ${winId}`);
      if (btn.dataset.minimized === 'true') {
        providers.outputMap.glazewm.runCommand('toggle-minimized');
      }
    };
  });

  root.querySelectorAll('.workspace').forEach(btn => {
    btn.onmousedown = () => providers.outputMap.glazewm.runCommand(`focus --workspace ${btn.dataset.name}`);
  });

  root.querySelectorAll('.vol-wrap').forEach(el => {
    el.onmousedown = () => {
      const audio = o.audio;
      if (audio) audio.setMute(!audio.defaultPlaybackDevice?.isMuted);
    };
  });

  root.querySelector('#theme-btn').onmousedown = () => {
    darkMode = !darkMode;
    render();
  };

  root.querySelector('#accent-mode-btn').onmousedown = (e) => {
    e.stopPropagation();
    cycleAccentMode();
  };

  root.oncontextmenu = (e) => e.preventDefault();
}

providers.onOutput(render);
render();
