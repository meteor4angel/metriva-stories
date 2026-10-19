# Metriva Stories — Story 02 bookshelf update

Copy these three files into the matching paths in your existing Metriva project:

- `echoes-library.html`
- `js/library-engine.js`
- `css/library-storybook.css`

**Keep all existing assets, stories/echoes-library.js, dialogue files, audio scripts and other stylesheets.** This package contains only files changed for the update, not the complete website.

Changes:
- Chapter 1's catalog puzzle is now an interactive shelf: select two books to swap. On correct order, the shelf slides aside and the secret door opens in a short silent animation. The existing chapter completion and unlock mechanism runs when the player chooses **Enter the hidden passage**.
- Conversation evidence cards have a paper-and-ink treatment. Other notebook cards use consistent dimensions.
- Evidence journals have aligned image, observation, notes and illustration metadata styling.
- Existing progress-based hint logic is retained: hint 1 initially, hint 2 after at least half the required evidence, hint 3 after chapter puzzle completion. On previously completed chapters all three hints are expected to show as available.
- No sound has been added.

Test from a copy of your site, with a fresh Story 2 save if you want to verify first-time progression. Existing Story 2 saves and IDs are unchanged. Browser gameplay has not been exhaustively tested.
