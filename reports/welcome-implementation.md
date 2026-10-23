# Homepage welcome experience — 23 October 2026

Implemented in the existing plain HTML/CSS/JavaScript homepage. Story engines, story cards and story progress are untouched by this feature. No animation library, video, GIF or canvas is used. The storyboard revision adds an illustrated door and two concerned host expressions via the built-in imagegen tool; see welcome-art-revision.md.

## Files

- `index.html`: includes the new stylesheet and independent welcome controller.
- `js/app.js`: emits a route event so navigation can cancel the welcome immediately.
- `js/welcome-experience.js`: timed state machine, expressions, waiting frames, safe storage, controls, optional prerecorded audio, cancellation and missing-image fallbacks.
- `css/welcome-experience.css`: responsive illustrations, small speech captions, arrival/exit movement, crossfades, illustrated hinged door, reduced motion.
- `public/assets/welcome/welcome-experience.json`: adapted proposal, actual pose references and all first-visit/returning/close dialogue steps.
- `public/assets/welcome/{female,male,biscuit,cat,bird,group}/`: 32 original transparent WebP crops plus three revision assets; original crops are retained.
- `public/assets/welcome/asset-manifest.json`: source identifiers, crop coordinates, output dimensions, processing notes.
- `scripts/prepare-welcome-assets.py`: deterministic, reproducible crop/background-cleanup preparation from the supplied attachment originals. Requires Pillow and NumPy; source originals are left untouched.
- `reports/welcome-asset-contact-sheet.jpg`: all exported assets on a cream background for visual review.
- `reports/welcome-preview.html`: isolated desktop/phone review modes, with temporary memory rather than real visitor or player storage.
- `tests/welcome-experience.test.js`: lifecycle, timing, safe storage, waiting order, cancellation, reduced motion, assets and audio gating.
- `reports/welcome-test-results.txt`: full test results.

## Behaviour

The five guides float in the bottom-left viewport corner while the reader scrolls. The overlay uses a smaller layout on phones, respects safe-area insets, and reserves no page space. Artwork and captions let clicks pass through to the page; only toolbar and reopen controls intercept clicks. Closing leaves a small floating Meet the guides button.

All active greetings, reactions, entrances, invitations and goodbyes now use complete supplied five-character group artwork. Eight new waiting crops play in order **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8**, with 4.5-second frames and 500 ms crossfades. The 14 active group assets share a 640 × 660 transparent canvas and common baseline. Individual assets and the earlier generated door are retained for future use but hidden in this configuration. See welcome-composed-update.md for the current pose map.

First visit uses the full introduction. A future session uses the shorter returning greeting. Reloading in the same tab/session restores the visible waiting group without repeating the full introduction. Closing leaves a small **Meet the guides** button, including after reload, so dismissal is reversible. Clicking Close again skips the goodbye; browsing to the catalog or a story dismisses immediately. The door closes before the welcome is removed. All timers and audio are cancelled on removal.

Visited/sound/reduced-motion preferences use guarded localStorage. Seen/dismissed flags use guarded sessionStorage. Blocked storage falls back to memory and does not break the page. No story-save keys are accessed.

## Art limitations and missing assets

- Used the five supplied individual sheets and the four-pose combined group sheet. Original source sheets are preserved; the new concerned-expression variants keep the same two host identities.
- The male, Biscuit, cat and bird sheets contained baked-in checkerboards. Border-connected neutral backgrounds were removed, isolated neighboring scraps discarded, and outputs visually checked on cream.
- Groups 3 and 4 touch around the cat paw / neighboring skirt. A minimum-alpha silhouette seam separates them, rather than a rectangle that includes another pose. All five mascots remain together in each group.
- Dedicated sad female/male host drawings were not present in the original sheets. New concerned expressions now match the storyboard reaction; the original thoughtful/confused crops are retained. Biscuit's supplied sad pose and the cat's unimpressed pose are used directly.
- No voice recordings were supplied: captions work throughout; the sound control clearly indicates **Captions only** when enabled. Proposed voice paths are documented in `public/assets/welcome/audio/README.md`; no fake recordings were created.
- The storyboard revision replaces the CSS door with a transparent illustrated oak door, hinged with CSS and used for left-entry and right-exit peeking.

## How to review

Open `http://127.0.0.1:8776/reports/welcome-preview.html` while the existing local server is running. Choose **First visit**, **Returning visit**, **Waiting loop**, **Goodbye**, **Reduced motion**, **Missing artwork**, or the phone links. Preview storage is temporary and does not modify player progress or real welcome history. `&hold=1` holds the first caption for visual inspection; live homepage timings are unchanged. `&mobile=320` checks the narrow layout.

For real visitor behaviour, open `index.html` in a fresh browser session/profile. Refresh once to check that the waiting group remains visible. Close the welcome to check **Meet the guides**. Open a new session with the same local visit history to see the returning greeting. Clearing only the `metrivaHasVisited`, `metrivaWelcomeSound`, `metrivaWelcomeReducedMotion` local keys and `metrivaWelcomeSeenSession`, `metrivaWelcomeDismissed` session keys resets this feature; do not clear story saves.

## Verification

- Browser: desktop 1265 px, phone 390 px and narrow phone 320 px; no horizontal overflow.
- First greeting, returning caption, complete five-character waiting poses, repeated waiting order 1 → 2 → 3 → 4, close/reaction, decorative open door, and missing-expression fallback checked visually.
- Reduced-motion review held waiting frame 1 and disabled spatial animations/crossfades.
- Sound remains caption-only without voice files; no unsolicited audio.
- Clicking **Explore the library** immediately removed the welcome and displayed the existing story catalog with its Play buttons.
- Automated checks cover same-session suppression, returning sessions, storage failures, timer cancellation, skip-close, reduced-motion timing, exact waiting order, missing group fallback and audio requiring gesture plus an available file.

Run `node --test tests/*.test.js` for the complete suite.

Preview startup now uses DOMContentLoaded and excludes analytics from its isolated iframe; the real homepage analytics integration remains unchanged.

## Direct-file compatibility fix

`index.html` also loads `public/assets/welcome/welcome-config.js`, generated from the authoritative JSON by `node scripts/sync-welcome-config.js`. The controller uses this classic-script data on both file:// and HTTP pages, so double-clicking the homepage does not require a JSON fetch or a Node server. Explicit custom HTTP config URLs remain supported.

After editing welcome-experience.json, run the sync script. `node scripts/sync-welcome-config.js --check` and the test suite detect stale generated configuration.

The direct-file resolution path is covered by an automated test that forbids fetch. The shared page was verified through HTTP. The automated browser security policy prohibits file:// navigation, so a visual test of the user's local-file URL could not be performed by the agent.

The latest waiting sheet is exported to waiting-v4 with transparent backgrounds, common baseline and all five characters. The enlarged floating group supports pointer/touch dragging from the artwork or Move control, arrow-key movement from Move, and viewport clamping on resize/reopen.

Waiting now supports the supplied transparent hover reaction (mouse only), holds the current idle frame during hover, and resumes it on mouse leave. The compact speech bubble has an independent Hide text / Show text toggle; this keeps animation and dragging active.
