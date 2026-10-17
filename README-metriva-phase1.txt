METRIVA · STORY 01 · PHASE 1 (EVIDENCE METADATA)

FILES
  vanishing-engine.js         -> replace your current js/vanishing-engine.js
  vanishing-evidence-data.js  -> add to your js/ folder
  vanishing-evidence.json     -> optional reference for future database migration; NOT loaded by the site yet

REQUIRED HTML CHANGE
  In the HTML page for The Vanishing Letter, find the existing script tag that loads js/vanishing-engine.js.
  Add this line IMMEDIATELY BEFORE it:

  <script src="js/vanishing-evidence-data.js"></script>

  Keep the existing vanishing-data.js script and its order. If your project uses a different folder path, match its path.

DO NOT replace vanishing-data.js or CSS. DO NOT change internal clue IDs.

WHAT CHANGED
  Chapter 1 evidence title, zoom title, notebook title, case note and question read from VANISHING_EVIDENCE.
  Markers and tooltips still read the original s.label (Register, Back window, Writing desk, Miso).
  Chapters 2–5 continue using their previous titles.
  Existing progress keys, state format, dialogue rules, chapter unlocks, images and CSS are unchanged.

TEST
  1. Open Chapter 1; verify marker 1 tooltip says Register.
  2. Inspect it: The Receipt; zoom: Examining the Receipt; notebook: Receipt.
  3. Inspect window/desk/Miso: titles The Loose Latch, The Broken Seal, The Brass Token.
  4. Reopen old save; confirm collected evidence and Clara unlock still work.
  5. Visit Chapter 2; verify old evidence labels remain unchanged.
  6. If titles do not change, check that the new script is loaded BEFORE vanishing-engine.js and hard refresh.

The .json file is a future-facing reference, not a live source. Keep .js and .json in sync until a future migration introduces JSON loading.
