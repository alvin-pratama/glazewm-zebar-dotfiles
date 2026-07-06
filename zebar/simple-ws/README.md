# simple-ws

Widget bar minimal untuk GlazeWM + Zebar.

## Tampilan

```
Left:   [app-count] [HH:mm] [binary clock] [active-window]
Center: [1] [2] [3]
Right:  [▲▼] [battery] [cpu] [ram] [volume] [↔/↕]
```

## Fitur

### Left
| Item | Keterangan |
|------|-----------|
| **App count** | Jumlah window di workspace yang aktif |
| **Scoreboard** | Jam digital `HH:mm` dengan tampilan segmen |
| **Binary clock** | Jam biner `HH:mm:ss` (4 baris bit: 8-4-2-1) |
| **Active window** | Nama process/window yang sedang fokus |

### Center
| Item | Keterangan |
|------|-----------|
| **Workspace list** | Daftar workspace (1-3), ada indikasi focus & isi |

### Right
| Item | Keterangan |
|------|-----------|
| **Network** | Indikator online/offline (▲▼) |
| **Battery** | Persentase baterai (ring/bar) |
| **CPU** | CPU usage (ring/bar) |
| **RAM** | Memory usage (ring/bar) |
| **Volume** | Volume speaker (ring/bar) + mute indicator |
| **Tiling direction** | Tombol indikator horizontal/vertical |

## Kustomisasi

### Show/hide item

Edit `app.js` di bagian atas:

```js
const showAppCount = true;
const showDate = true;
const showBinary = true;
const showTiling = true;
const showWsWindows = true;
const showNet = true;
const showBat = true;
const showCpu = false;
const showMem = false;
const showVol = true;
const showMic = false;
```

### Mode tampilan

```js
const volDisplay = 'ring';  // 'ring' | 'bar'
const batDisplay = 'ring';  // 'ring' | 'bar'
const cpuDisplay = 'bar';   // 'ring' | 'bar'
const memDisplay = 'bar';   // 'ring' | 'bar'
```

### Window display mode

```js
const wsWindowsMode = 'active'; // 'active' = hanya window fokus, 'all' = semua window
```

### Mengubah format jam scoreboard

Edit provider `date`:

```js
date: { type: 'date', formatting: 'HH:mm' },
```

Binary clock otomatis mengikuti format dari provider `dateFull` (`HH:mm:ss`).

### Mengatur klik

Cari bagian `PENGATURAN KLIK` di `app.js`:

| Mode | onclick | root.oncontextmenu |
|------|---------|-------------------|
| Full nonaktif | dikomentari | aktif |
| Kiri doang | unkomentari | aktif |
| Full aktif | unkomentari | dikomentari |
| Kanan doang | dikomentari | dikomentari |

## Provider yang digunakan

| Provider | Keterangan |
|----------|-----------|
| glazewm | Workspace, window, tiling direction |
| date | Jam scoreboard (`HH:mm`) |
| dateFull | Jam binary clock (`HH:mm:ss`) |
| battery | Persentase & status charging |
| cpu | CPU usage |
| memory | Memory usage |
| network | Interface & gateway |
| audio | Volume playback & recording |

## Struktur File

```
simple-ws/
├── app.js           # Source code utama (ES module)
├── index.html       # Entry point widget
├── style.css        # Styling
├── zpack.json       # Konfigurasi pack zebar
├── package.json     # Dependency (jika perlu build)
└── README.md
```

## Instalasi

1. Copy folder `simple-ws` ke `~/.glzr/zebar/`.
2. Buka Zebar GUI → `My widgets` → `simple-ws` → aktifkan.

## Lisensi

MIT
