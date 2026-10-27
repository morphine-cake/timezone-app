# Kairos for iOS & macOS — Analysis and Plan

## 1. What the web app is today

| Area | Current implementation |
|---|---|
| Stack | Next.js 15 (static export `output: "export"`), React 19, Tailwind 4, Luxon, deployed on Netlify |
| Screens | One page (`app/page.tsx`) + full-screen "Add City" modal (`app/components/CitySelectionModal.tsx`) + 1.3 s loading screen |
| City catalog | `server/data/cities.json` — 383 cities `{ id, name, country, timezone }`, served statically via `app/api/cities/route.ts` |
| User data | Ordered list of selected cities in `localStorage["kairos-selected-cities"]` (JSON array). The local-timezone city (`id: "local-user-timezone"`) is generated per device, always first, never saved |
| Core interaction | `TimeSlider` — horizontal ruler you drag to shift time ±N minutes; first step snaps to the next/previous quarter hour, then 15-min steps; double-click/tap animates back to "now" in 460 ms |
| Other | Drag-to-reorder rows, hover-to-reveal delete, per-digit rolling time animation, Google Analytics, footer with social links |
| Unused | `app/api/time/route.ts`, most of `components/ui/*` (shadcn), `theme-toggle.tsx`, most of `globals.css` below the animations |

**Key takeaway:** the only user state is *an ordered list of city records*. That is tiny, which makes iCloud sync simple.

## 2. Recommended architecture

```
timezone-app/
├── app/, components/, lib/, …     ← web app, unchanged, still deployed by Netlify
├── server/data/cities.json         ← single source of truth, shared by web + Apple apps
└── apple/
    ├── Kairos.xcodeproj            ← ONE multiplatform SwiftUI target (iOS + macOS)
    ├── Kairos/
    │   ├── App/        KairosApp.swift, RootView.swift
    │   ├── Design/     Tokens.swift, Fonts/, Assets.xcassets (logo, colors)
    │   ├── Model/      City.swift, CityCatalog.swift, TimeMath.swift
    │   ├── Store/      CityStore.swift (iCloud KVS + local fallback)
    │   └── Views/      Header, TimeSlider, CityRow, AnimatedTimeText, AddCitySheet, LoadingView
    └── KairosTests/    TimeMathTests.swift, CityStoreTests.swift
```

- **Native SwiftUI, not a WebView wrapper.** A wrapper (Capacitor/WKWebView) would reuse the design for free, but iCloud sync then needs a native bridge anyway, the Mac version feels non-native, and App Review guideline 4.2 often rejects thin web wrappers. SwiftUI can reproduce this design exactly because it is a flat, dark, typographic layout with fixed numbers.
- **Web stays separate.** Netlify keeps building only the Next.js app; `apple/` is ignored by it. The Xcode project references `server/data/cities.json` directly (folder reference, no copy) so the catalog never diverges.
- **Sync with `NSUbiquitousKeyValueStore` (iCloud Key-Value Storage)**, not CloudKit/SwiftData:
  - Data is a few KB (limit 1 MB) → perfect fit.
  - Keeps the exact same key and JSON shape as the web (`kairos-selected-cities` → `[City]`), so order is preserved for free.
  - No schema, no CloudKit dashboard, no conflict code: last-writer-wins, which is fine for a city list.
  - Listen to `didChangeExternallyNotification` to update live when another device changes the list.
  - Mirror to `UserDefaults` so the app works when iCloud is signed out.
  - The local-timezone city stays **device-local** (not synced), exactly like the web.
- **Web ↔ Apple sync is not included.** iCloud KVS is Apple-only. If you later want the website to share the same list, that needs a backend (CloudKit JS + Sign in with Apple, or your own API) — a separate project.

## 3. Design spec to reproduce exactly (extracted from the code)

### Colors
| Token | Value | Used for |
|---|---|---|
| `background` | `#121212` | everything (app, header, rows, modal, loading) |
| `textPrimary` | `#FFFFFF` | city name, time |
| `textSecondary` | `#ACACAC` | country, time difference |
| `textFooter` | `#515151` | footer credits/icons |
| `accent` | `#FF7C35` | slider needle, "CURRENT TIME" label, triangle, drop line |
| `divider.reference` | white @ 0.25 | line under reference city |
| `divider.row` | white @ 0.08 | row separators, footer top border, modal search border |
| `divider.slider` | white @ 0.24 | slider top border |
| `button.border` | white @ 0.12 | + / × buttons, search field |
| `fill.hover` / `fill.pressed` | white @ 0.04 / 0.08 | button and row states, slider range rectangle (0.04) |
| `addedText` | `#666666` | already-added city in modal |

### Typography (bundle the font files — both are OFL-licensed)
| Style | Font | Size / line height | Tracking | Case |
|---|---|---|---|---|
| City name | Manrope Regular | 24 / 32 | 1 | as-is |
| Time `HH:mm` | Manrope Regular | 24 / 32 | 2 | — |
| Meta (country, diff, labels, footer) | Fira Mono Regular | 12 / 14 | 1 | UPPERCASE |
| Modal title "Add City" | Manrope Medium | 24 | — | — |

### Layout
- Content max width **560 pt**, horizontal padding **24 pt**; header is sticky.
- Header row: logo (139×34) left, **32×32** "+" button right, radius **8**, 1 pt border, icon 20 pt; vertical padding 24.
- Slider area: 24 top padding, ruler height **100**, 16 bottom margin.
- City row: vertical padding **24**, name/country stacked left (6 pt gap), time/diff stacked right-aligned (6 pt gap). Reference row has a 16 pt map-pin icon before "YOUR TIME".

### Time slider (the signature component)
- One tick every **8 pt**; each tick = one 15-min step.
- Tick heights/opacity: regular 40 / 0.4, every 3rd 50 / 0.6, every 6th 60 / 0.8; 1 pt wide, bottom-aligned.
- Fixed orange needle: 2×60 pt, centered, starting 24 pt above the ruler. Label "CURRENT TIME" or "+1H 15M" in accent Fira Mono 12, 8 pt right of the needle.
- Orange triangle (12 wide × 8 tall) under the ruler marks "now" and moves with the ruler.
- Range rectangle (white 0.04) between "now" and needle.
- 80 pt left/right gradient fades from `#121212` to clear.
- Drag left → future, drag right → past. First step snaps to the nearest quarter hour, then ±15 min.
- Release / programmatic change: 0.4 s linear. Double-tap: step back to zero over 460 ms total.

### Motion
| Element | Animation |
|---|---|
| Time digits | Each changed digit rolls in from top (future) or bottom (past), 0.3 s, `cubic-bezier(0.4, 0, 0.2, 1)` |
| Logo | Outer ring rotates 360° every 60 s, linear, forever |
| App appear | fadeIn 0.6 s (opacity 0→1, y +20→0); reference row slideInUp 0.5 s delay 0.4 s; list rows slideInUp 0.4 s staggered 0.1 s |
| Loading screen | `#121212` + `kairos-logo.png` (max 318×78), shown 1.3 s |
| Add City sheet | full-screen, opacity + scale 0.95→1 + y 20→0, 0.3 s; header/search/list staggered 0.1 s |
| Reorder | dragged row 0.5 opacity, target row scale 1.02, 2 pt orange drop line |

## 4. Platform adaptations (same look, native behaviour)

| Web behaviour | iOS | macOS |
|---|---|---|
| Hover → trash slides in | Swipe-to-delete (custom-styled, same trash icon) | Keep hover reveal exactly as the web |
| HTML5 drag reorder | Long-press drag with orange drop line | Same drag, with pointer |
| Slider drag | `DragGesture` + light haptic on every 15-min step | Drag + scroll-wheel/trackpad horizontal scroll, ←/→ keys |
| Double-tap reset | Double-tap | Double-click, plus ⌘0 |
| Modal keyboard nav | Search field autofocus | ↑/↓/Enter/Esc as in the web |
| Window | Full screen, dark status bar | Hidden title bar, `#121212`, width fixed near 560 pt |
| Footer | Moves into an "About" sheet (or keep the fixed footer) | Keep the footer |
| Google Analytics | Remove (or switch to a privacy-friendly option; needs an App Privacy declaration) | Same |

## 5. Implementation steps

### Phase 0 — Prerequisites
1. Paid Apple Developer account (iCloud needs it).
2. Xcode 26 or newer; minimum OS iOS 18 / macOS 15 (gives `@Observable`, modern `contentTransition`).
3. Pick a bundle ID (e.g. `app.kairos-time.Kairos`). Enable the **iCloud → Key-value storage** capability for both platforms.

### Phase 1 — Repository housekeeping
4. Remove the 458 committed `node_modules` files from git (`git rm -r --cached node_modules`); `.gitignore` already ignores them.
5. Add Xcode entries to `.gitignore` (`xcuserdata/`, `DerivedData/`, `*.xcuserstate`).
6. Create `apple/Kairos.xcodeproj` as a multiplatform SwiftUI app and add `server/data/cities.json` as a file reference.

### Phase 2 — Design system
7. Add Manrope and Fira Mono `.ttf` files and register them (`UIAppFonts` on iOS, `ATSApplicationFontsPath` on macOS).
8. `Tokens.swift`: the colors, fonts (size, line height, tracking) and spacing from section 3.
9. Export the Kairos SVG logo to the asset catalog in two layers: the rotating ring and the static mark/wordmark. Add `kairos-logo.png` for the loading screen and an app icon built from `app/icon.png`.

### Phase 3 — Model and time logic (port + tests)
10. `City` (`Codable`, `Identifiable`, same fields as the web). `CityCatalog` loads the bundled JSON.
11. `TimeMath.swift`: port `getFirstQuarterHourOffset`, the steps→minutes mapping, the offset label (`+1H 15M`), and the time difference string, using `TimeZone`/`Calendar` instead of Luxon.
12. Port `getUserLocalCity`: `TimeZone.current.identifier` → city name, region map, Istanbul→Ankara override.
13. Unit tests for snapping at minutes 0/7/15/44/59, negative direction, DST zones, and half-hour zones (Kolkata, Kathmandu, Adelaide).

### Phase 4 — iCloud store
14. `CityStore` (`@Observable`):
    - Load: iCloud KVS → else `UserDefaults` → else the 5 default cities (Dubai, London, Tokyo, Los Angeles, Sydney).
    - Always put the device's local city first; never save it.
    - On add/remove/move: write JSON to KVS and `UserDefaults`, then call `synchronize()`.
    - Observe `NSUbiquitousKeyValueStore.didChangeExternallyNotification` → reload and animate the list change.
15. Test on two devices or simulators signed into the same Apple ID (KVS sync can take from seconds up to a minute).

### Phase 5 — UI, component by component, compared with the web
16. `LoadingView` (1.3 s) → `RootView` with the appear animations.
17. `HeaderView`: logo with rotating ring, "+" button with pressed state.
18. `TimeSliderView`: draw ticks with `Canvas`, offset by the drag translation; needle, label, triangle, range rectangle, fades; snapping + haptics; double-tap reset.
19. `AnimatedTimeText`: five slots (`H H : m m`), each digit a clipped view that rolls on change (the exact web curve), driven by `TimelineView(.everyMinute)` + offset.
20. `CityRowView` and reference row; platform delete + reorder from section 4.
21. `AddCitySheet`: full-screen cover, search field, filter + sort logic copied from the web (name prefix first, then alphabetical, max 50), "ADDED" state, `COUNTRY / ABBR GMT+X` subtitle.
22. Footer / About.

### Phase 6 — Pixel check
23. Screenshot the web at 390 pt (iPhone) and 560 pt (Mac window) and overlay them on simulator/Mac screenshots; fix spacing until they match.

### Phase 7 — Ship
24. App Store Connect: one app record with Universal Purchase (iOS + macOS), privacy label "No data collected", screenshots.
25. TestFlight for iOS and macOS → App Store.

### Later (optional)
- Home-screen / desktop widgets and a macOS menu-bar extra (needs an App Group for shared storage).
- Web ↔ Apple sync via a backend.

## 6. Issues found in the web app while reviewing (worth fixing in both)

1. **Times don't tick live.** `AnimatedTimeDisplay`'s effect depends only on `[timezone, timeOffset]`, so displayed times don't update as the clock passes a minute unless the slider moves.
2. **Half-hour zones are wrong.** `getTimeDifference` uses `Math.round(diff / 60)`, so India (+5:30) shows `+3H` instead of `+2H 30M` from Istanbul. The modal's `GMT+X` has the same problem.
3. **DST across the offset.** The difference uses `DateTime.now()` instead of the shifted time, so dragging past a DST change shows the old difference.
4. **Dead code.** `/api/time`, unused shadcn components, theme toggle, legacy CSS classes.
5. **Committed `node_modules`** (458 files).
6. **Footer share URL** points to `kairos-timezone.netlify.app` while metadata uses `kairos-time.app`.
