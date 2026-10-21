# Metriva Story Engine v1.7

All six stories run on `js/story-engine.js`. Stories 1, 2, and 3 import existing browser progress from their former save keys on first open, then save through the shared progress repository.

## Story authoring

The sources of truth are `stories/story-01.json` through `stories/story-06.json`. They contain narrative, scene references, clue positions and evidence, character profiles, player questions and character replies, declarative unlock conditions, puzzle definitions, progressive hints, and endings. New stories can use the same schema and the existing JSON source/progress repository adapters.

Static character portraits are defined once per story in the optional `characterPortraits` map, keyed by character ID. The same image appears in every chapter where that person is present, in the People here card and conversation window. The builder checks that the referenced image files exist. Story 6 has transparent portrait PNGs for its four speaking characters and for Edda Moss, the missing case subject.

Optional `characterSprites` and `voiceMap` entries add existing character motion and recorded speech. Sprite frames may reference an expression sheet or individual images. Voice keys may use `[speaker, text]` for a unique line or `[speaker, text, characterId, questionId, lineIndex]` when the same text occurs in more than one turn. The page builder checks that every mapped MP3 exists. Without a sprite mapping, the engine uses the configured static portrait; without a voice mapping, it leaves the written dialogue in place and does not show audio controls. Motion and audio can be paused independently, and reduced-motion preferences are respected.

Build a local-file-friendly page after editing JSON:

```sh
node scripts/build-story-page.js brackenmere-bell
node scripts/build-story-page.js echoes-library
node scripts/build-story-page.js midnight-train
node scripts/build-story-page.js vanishing-letter
node scripts/build-story-page.js letters-after-midnight
node scripts/build-story-page.js days-we-almost-met
```

The builder validates the engine schema and referenced scene files, then injects the definition into a non-executable `application/json` block in the numbered story page. Each story also rebuilds its configured legacy address from the same definition. This keeps the stories playable when opened as local files, where browsers commonly block JSON `fetch()` requests. The shared template is `templates/story-page.html`.

### Reusable investigation-page appearance

The shared investigation layout reads an optional top-level `pageAppearance` object. Story 2 uses it for the softly blurred library background, translucent parchment cards, green accents, and a wider page. The default engine appearance is unchanged for stories that omit the object. To give another story its own look, add its artwork path and palette to its JSON definition; no story-specific CSS or JavaScript is needed.

```json
"pageAppearance": {
  "backgroundImage": "assets/story02-library-wide-sunlit.png",
  "backgroundPosition": "center center",
  "backdropTint": "#fff4dc70",
  "palette": {
    "surface": "#fff9ee", "ink": "#17241d", "accent": "#214e3c",
    "accentSoft": "#e6eee6", "border": "#ddc9a7",
    "muted": "#596057", "gold": "#c4a466",
    "headingInk": "#214e3c", "headingMuted": "#35443a"
  },
  "layout": {"contentWidth": 1400, "sidebarPercent": 30, "surfaceOpacity": 0.9}
}
```

The palette uses six-digit hex colors; `headingInk` and `headingMuted` set the story title and supporting header text, so they can be tuned for dark or light page backgrounds. `backdropTint` uses eight-digit hex (the last two digits set opacity). The background must be a local image under `assets/` and is checked during the build. `contentWidth` is 960–1800 pixels, `sidebarPercent` is 24–42, and `surfaceOpacity` is 0.75–1. `chapterPickerIcon` selects a built-in `map-pin`, `book`, `flower`, `compass`, or `sprout` icon for the chapter dropdown. Mobile screens always use one column. These settings style the investigation page; puzzle artwork and chapter scenes remain separate story content.

Stories may optionally configure custom cursors with `pageAppearance.cursorTheme`: `default` is used over non-interactive page content, `interactive` over buttons and links, and `disabled` remains the standard `not-allowed` cursor for unavailable controls. The two artwork paths must point to local PNG files under `assets/`.

With `pageAppearance`, the investigation page also uses compact clue pills, a separate case notebook and save-controls box, notebook arrows when evidence cards overflow, an unlocked-chapter shortcut, and a visual Locations menu. Solved chapters offer a read-only “Review the revelations” action; Story 2's bookshelf review reopens its B-17 reference without changing the saved solution. Set `peopleMode` to `"all"` to keep the full cast visible in the Investigation panel. People in the current location can be spoken to; people in earlier unlocked locations link back there, and later encounters remain visible but locked. The notebook contains evidence only.

### Reusable single-question puzzle

A `choice` puzzle has two reusable light presentations. Option 1, `single-question`, shows a branded Metriva header, a puzzle title, one prompt, and a compact list of answers. Option 2, `single-question-clues`, adds linked clue previews between the prompt and answers. The clue previews open the existing evidence detail and return to the puzzle when closed. Neither option uses a scene banner or dark clue board. Story 1 Chapter 1 and Story 3 use these templates.

Set `puzzle.presentation.mode` to either option. `presentation.optionStyle` can be `radio` (default), `numbered`, `icon`, or `numbered-icon`; icon artwork comes from each answer's validated `icon` key. Option 2 also requires `presentation.evidenceRefs`, a nonempty list of evidence IDs from the same chapter. Optionally provide `presentation.theme` with any of `accent`, `surface`, `border`, `selected`, and `ink`, each a six-digit hex color. `presentation.actions` can reorder or replace the footer controls with `submit`, `hint`, `evidence`, and `close` actions; an evidence action names a clue `target` in the same chapter. Each action's label and optional built-in icon are story data. Buttons remain left aligned, size to their text, and use consistent spacing. Omit the theme or actions to use engine defaults. The chapter-dropdown icon is similarly configurable with `pageAppearance.chapterPickerIcon`, using the built-in `map-pin`, `book`, `flower`, `compass`, or `sprout` keys. This story JSON configuration is the source model for a future authoring dashboard: its image paths, visual theme, option art, picker icon, labels, and links can be edited as fields without changing engine code. For example:

```json
{
  "type": "choice",
  "prompt": "Which seat was removed from the chart?",
  "options": [{"id":"4A","label":"Seat 4A"},{"id":"4C","label":"Seat 4C"}],
  "answer": "4C",
  "presentation": {"mode":"single-question-clues","evidenceRefs":["ticket","chart"],"theme":{"accent":"#436854","selected":"#edf3ec"}}
}
```

The example shows the reusable puzzle fields; a chapter still needs its normal puzzle `id`, `title`, and `success`, and evidence entries matching the listed IDs. Theme colors and clue references are validated before the page builds. The answer, hints, save state, and completion behavior remain part of the generic engine. Other `choice` puzzles retain their existing presentation unless they opt in.

### Reusable text-answer puzzle

An `input` puzzle uses the standard Metriva modal header and left-aligned footer actions. Expected answers of one to five characters render as individual character boxes while a single accessible input handles typing, paste, and saved progress. Longer answers use a regular text field. Set `input.mode` to `numeric` for a number keypad, and optionally set `input.label`, `placeholder`, `maxLength`, `submitLabel`, and `evidenceRef`. The evidence reference must point to a clue in the same chapter; its existing detail image can appear beside the prompt. Story 1 Chapter 3 demonstrates a three-digit code linked to its existing locked-drawer clue.

### Reusable illustrated ordering puzzle

A `sequence` puzzle accepts any number of labeled items (at least two) and an `answer` array containing each item ID in its correct order. An optional `presentation.initialOrder` sets the starting arrangement as a permutation of those IDs; reset returns to that order. The same engine supports drag-and-drop, tap-to-place, and earlier/later arrow controls. For an illustrated `timeline`, items can include a `time`, an `image`, or an `imageCrop` in pixels from a shared `presentation.imageSheet` (`src`, `width`, and `height`). `presentation.theme` accepts six-digit hex values for `green`, `gold`, `cream`, `panel`, `line`, and `ink`. Optional `sectionTitle` and `sectionDescription` adjust the instruction panel.

`presentation.actions` controls the number and order of footer buttons. Each entry uses an `action` (`check`, `reset`, `hint`, `evidence`, or `close`) and a `label`; an optional `icon` is one of `check`, `reset`, `hint`, `evidence`, or `close`. An `evidence` action also requires a `target` clue ID from the same chapter, which opens the existing clue viewer and returns to the puzzle. Story 1 Chapter 2 is the illustrated timeline example: its three event cards, order, palette, image crops, and four actions are all configured in `stories/story-01.json`.

Story 2 uses the reusable `bookshelf` sequence presentation. Its JSON names the empty cabinet artwork, seven candidate books, four physical shelf spaces, four handles, Eleanor’s note, the Book Cart stamps, and the existing inside-cover artwork. A placed book leaves an empty space in the available tray and appears only on the physical shelf. The evidence panel shows the Book Cart numbers in their observed order, leaving the player to interpret Eleanor’s note. A wrong book or order keeps the hidden drawer shut; handle D reveals the B–17 slip only after the correct four-book arrangement. The engine saves the shelf slots, opened covers, and drawer state. The original five chapters, 22 evidence items, conversations, three hints per chapter, and two endings live in the JSON. `detailImage` keeps the original clue illustrations. `characterSprites` describes each existing four-frame transparent portrait sheet (idle, blink, speaking, thoughtful), while `voiceMap` points to the existing 76 spoken lines. Story 2 conversations stage the portrait over the current chapter scene. Character lines use the speaking frame; player lines keep idle and blink motion without mouth movement. Dialogue uses the recorded audio when available. The portrait and written dialogue remain visible when motion is paused, reduced motion is requested, a voice file cannot play, or a story has no animated/audio assets.

The `timeline-clean` sequence presentation keeps available evidence and ordered slots in a left column, with an optional fixed-ratio illustration on the right. Set `presentation.sideImage`, optional `sideImageAlt`, `sideImagePosition` and `sideImageFit` (`cover` or `contain`), and an `icon` on each sequence item (`clock`, `flower`, `door`, `book`, `footsteps`, `speech`, `music`, `key`, `leaf`, `bell`, or `event`). Icon and artwork are presentation-only; the puzzle `answer` array remains the source of truth. At narrow widths, the art moves above the controls. The earlier `timeline` presentation remains supported.

The reusable `token-insert` choice presentation accepts any number of labeled target options with optional symbols or icons. Its JSON configures token evidence and artwork, the right-side illustration, target labels, success and mismatch text, and the sequence of token-fit animation, compartment reveal, and optional letter reading. Selecting a recess moves the token artwork from its tray to that recess; Reset selection clears the choice and returns the token. Correct insertion animates the token settling into the selected recess, then presents the fitted-token moment before the player opens the hidden compartment. A configured `presentation.letter` can be read from that reveal and can reuse the story's existing letter text in its evidence record.

### Reusable sequence puzzle

The default `sequence` puzzle uses a connected-card board. Players can drag a card to a position, select one card and then select its destination, or use the arrow buttons. Each move inserts the selected item at its destination and shifts the other items; the existing `puzzleDrafts` save format and answer check are unchanged. The controls remain usable with a keyboard or touch screen.

The optional `puzzle.presentation` object changes the visual framing without adding story-specific code. Use `{"mode":"route","topLabel":"Upper inlet","bottomLabel":"Springworks"}` for a connected-card route, or omit it for the default timeline. The labels are presentation only; `items` and `answer` still define the puzzle. Future JSON stories can reuse the board with their own labels.

For a chart-based route, set `presentation.mode` to `interactive-route` and provide an image with its intrinsic dimensions, an `evidenceId`, and a coordinate for each selectable valve. Optional `decoys` add wrong stops; `choiceOrder` controls their card order. A `network` defines physical pipe edges and optional junctions, so successive selections can trace plausible alternate branches. The chart image and SVG paths share one coordinate system, so resizing and zooming preserve hotspot alignment. The route is selected by mouse, touch, or keyboard; a chosen valve can be selected again to remove it. The engine saves partial selections in `puzzleRouteSelections`. All unsubmitted paths stay antique gold, including correct partial choices. Emerald appears only after the complete route is submitted and confirmed. The older all-pairs `connections` format is also accepted. Story 6 Chapter 2 uses this variant; the original evidence chart remains a separate readable clue. See `docs/STORY06-VALVE-ROUTE-PUZZLE.md` for the asset and authoring details.

For an illustrated landmark route, set `presentation.mode` to `garden-route` and supply an image with intrinsic dimensions, `locations` for each item ID, a scrambled `verse` reference with text and symbols, optional `shortLabels` for the player's proposed-route trail, and linked `verseEvidenceId` and `mapEvidenceId`. The renderer places accessible SVG markers over the map and draws connections only after the player selects landmarks. Gold traces show the current selection; emerald confirms the complete solved route. Players can undo, deselect, reset, pan, zoom, review either clue, and submit. Partial selections use the same `puzzleRouteSelections` save field as chart routes. The answer and story text remain in JSON. Story 6 Chapter 4 uses this variant with a route-free derivative of its existing survey map, so the map does not reveal the answer before interaction. Evidence opened from either route puzzle uses the shared modal stack; closing the evidence restores the still-mounted puzzle and the evidence button's focus.

## Visual continuity and spatial scenes

Story definitions remain `schemaVersion: 1`. A chapter may now add the optional `spatial` extension (version 1); legacy chapters continue to use `scene` and `evidence.position` without modification. The structural schema is `schemas/story-v1-spatial.schema.json`; `docs/visual-manifest-template.json` is a copyable scene template. The engine additionally validates cross-references and geometry that JSON Schema cannot express.

Each `spatial` block names one stable `sceneId`, its canonical `master` image with pixel dimensions, and an `environment` manifest for layout, lighting, and landmarks. `chapter.scene` must match `spatial.master.src`. All marker, footprint, inspection-region, and view-frame coordinates are percentages of that **uncropped master image**. The scene container uses the master image's aspect ratio so overlays stay aligned on desktop and mobile.

Each physical object has one globally unique `id`, a screen footprint, depth, layer, material, supporting surface, appearance, nearby IDs, and allowed states. The footprint locates the object in the master image; `depth` records relative camera depth, so an overlap on screen does not automatically mean physical proximity. Evidence links to a physical object with `objectId` and a view with `viewId`. A view has a crop frame and the IDs of objects genuinely visible inside it. `view.image` is optional; without it, the player zooms into the current master scene crop. Story 6's clues are tied to five master scenes, with master-derived close-ups for written and important physical clues in Chapters 1–4. A detailed image can reveal new text or wear but must retain the object and surroundings established in the master.

Evidence with writing that the master image cannot render legibly may add a `document` object (`kind`, `heading`, `reference`, `lines`, optional `annotation` and `route`). The clue window shows the master-derived image with an optional readable transcription; players can enlarge the image or written text separately. The text must describe only marks present in the scene or already established by the clue. Story 6's bell ledger and village flood map use this option.

The same object ID can appear in multiple views. Declare `nearby` only when the objects are physically near, and include a neighbor in `visibleObjectIds` only when its footprint falls inside that view's frame. An author can document an occlusion or camera-angle exception in `continuityException`; the build report flags 2D overlaps for manual review rather than treating them as proof of adjacency.

For objects that change, define named `states` and use `evidence.onExamine: [{"objectId":"…","toState":"…"}]` to move between them. `objectStates` is saved inside the existing story-specific v1 progress envelope. Old saves simply acquire default states when loaded. A state that changes physical visibility or sets `visualChange: true` needs a matching `spatial.sceneVariants` image; any separately supplied detail image showing that object also needs a matching `view.variants` image. The engine selects these by declarative `when` mappings. Story 6's current evidence does not move objects, so its approved wide images remain the only artwork and no new state images were invented.

After each build, review `reports/story-06-visual-continuity.md` (or the matching report for a future story). It lists the master, visual constants, every object, clue marker, frame, visible neighbor, state, and overlapping region. Open `story-06.html?visual-debug=1` locally for a developer overlay: teal = object footprints, orange = inspection regions, yellow = close-up frames. The toggle under the scene hides or shows it. This is an authoring preview only; normal players never see it.

### Repeatable authoring sequence

1. Sketch each location's physical layout and camera viewpoint. Name fixed furniture, architecture, and light direction.
2. Establish one master image per location. Record its actual pixel dimensions and keep its aspect ratio in the scene container.
3. Give each important object one stable ID and record its footprint, depth, material, support, orientation, appearance, and states. Record genuine nearby relationships.
4. Keep `evidence.position` on the physical object and place its inspection region around the object. To keep small details visible, use optional `markerPosition` for the visible marker immediately beside the object, within 12 percentage points of its physical position. Both positions use master-scene percentage coordinates.
5. Frame each clue view against the master. List only objects visibly inside that frame. Prefer a master crop before commissioning a separate detail image.
6. If a higher-resolution detail is needed, constrain it with the master, its object description, and any adjacent props. Add only details the wide view cannot resolve. Record its file and dimensions.
7. For any interaction that changes the physical scene, provide scene and detail variants for every affected view, then declare the state transition in JSON.
8. Build the page, inspect the report and geometry overlay, and compare each wide view with every detail side by side. Verify material, damage, orientation, furniture, light, and state before publishing.
9. Test the page at multiple widths, perform interactions, refresh, export/import progress, and run `node --test tests/story-engine.test.js`.

The builder verifies file existence and image dimensions for master, detail, and state assets. Runtime validation verifies object IDs, view references, state transitions, frames, marker placement, and metadata. Neither check can establish that two pictures truly show the same object, so the side-by-side visual review remains required.

## Engine boundaries

- `StoryDataSource.load()` supplies a versioned story definition. `InlineJsonStorySource` supports bundled/local pages; `FetchJsonStorySource` is available for an API-hosted definition.
- `ProgressRepository.load(storyId)`, `save(storyId, state, revision)`, and `clear(storyId)` own progress storage. `LocalProgressRepository` is used today. `ApiProgressRepository` shows the HTTP contract and sends JSON, credentials, and `If-Match` when an ETag is available; it treats 409/412 as a concurrent-save conflict.
- `validateDefinition()` checks schema version, unique chapter/evidence/puzzle/dialogue keys, puzzle types and answers, and evidence references before the page renders.
- Unlock conditions use a small declarative language (`always`, `allEvidence`, `anyEvidence`, `allDialogue`, `anyDialogue`, `puzzleSolved`, `all`, `any`, and `not`). Conditions are evaluated as data; there is no story-authored JavaScript or `eval()`.
- Progress saves are isolated by story ID and schema version. Exports are story-specific JSON files. Restart calls `clear()` only for the active story. `metriva:progress` is emitted after each successful save.

## API contract for a later backend

Use a JSON resource per authenticated user and story, such as `GET/PUT/DELETE /api/stories/{storyId}/progress`. `GET` should return `{ "schemaVersion": 1, "storyId": "…", "revision": 3, "savedAt": "…", "state": {…} }`, plus an `ETag`. `PUT` accepts that envelope and the last ETag in `If-Match`; first-time creation uses `If-None-Match: *`. Return the saved envelope and a fresh ETag. Return 409 or 412 when another session has written a newer revision. `DELETE` resets only the authenticated user's progress for that story. The server remains responsible for identity, authorization, rate limits, validation, and durable storage; the browser adapter is not a security boundary.

To move a future story to the API, inject `new FetchJsonStorySource(url, options)` and `new ApiProgressRepository({baseUrl, headers, credentials})` into `MetrivaStoryEngine.boot(...)`. The UI, gates, dialogue flow, puzzle handlers, and story JSON schema remain the same. Production authentication/token refresh and any server-specific conflict-resolution policy should live in the application's API client, not in story JSON.

## Current schema limits

Engine v1 supports single-answer deduction and ordered-sequence puzzles, per-question conditions, evidence conditions, saved dialogue lines/transcripts, progressive hints, scene zoom, and two-choice endings. The sequence board has drag, tap-to-place, and arrow controls. Recorded audio and portrait frames can be configured in JSON. New puzzle families should be added as engine capabilities with schema validation, not as inline code in a story definition.
