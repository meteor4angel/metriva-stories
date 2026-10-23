# Dialogue audit and corrections

Audited all **7 stories, 35 chapters and 151 question exchanges**, including character introductions and the conversation scripts actually displayed by the engine. The final runtime inventory contains **673 spoken lines**. Story 5's approved external conversation script was included; stored mirrors of the same opening greeting were treated as one line and checked against the engine's playback behaviour.

## Findings and fixes by story and chapter

| Story | Chapter(s) | Finding | Correction |
|---|---|---|---|
| 1 — The Vanishing Letter | 1–5 | No duplicate conversations or replies found. | Dialogue content retained. |
| 2 — Echoes in the Library | 1–5 | No duplicate conversations or replies found. | Dialogue content retained. |
| 3 — The Midnight Train | 1–5 | No duplicate conversations or replies found. | Dialogue content retained. |
| 4 — Letters After Midnight | 1 — The Attic | All three Celia exchanges used the same generic follow-up and repeated their first answer verbatim. | Added distinct follow-ups about torn pages, identifying Julian and Iris's visits to the rooftop. |
| 4 | 2 — Across the Street | Rowan's three follow-ups repeated their answers; these conversations were copied into Chapters 3–5. | Retained the initial studio questions and supplied new follow-ups about handwriting, separating writers and keeping envelopes with pages. |
| 4 | 3 — The Unsent Years | Repeated Chapter 2's entire Rowan dialogue and introduction. | Replaced with dated-letter comparisons, the 1995 postcard, the 2004 envelope and the storm-calendar lead. |
| 4 | 4 — The Rooftop Garden | Repeated Chapter 2's studio questions while standing on the rooftop. | Replaced with the closed stair, exterior access, carved initials, mosaic and keepsake-box dials. |
| 4 | 5 — The Letter Never Sent | Repeated Chapter 2 instead of responding to the recovered letters. | Replaced with the two meeting locations, undelivered change of plan, storm record and preserving both voices. |
| 5 — The Days We Almost Met | 1–5 | No duplicate topic exchanges. Each chapter's two character greetings also existed in its approved opening; opening another character's menu could repeat a greeting already heard. | Updated the shared engine to suppress a menu introduction already spoken in the completed chapter opening. All approved dialogue and voice mappings retained. |
| 6 — The Bell Beneath Brackenmere | 1–5 | No duplicate conversations or replies found. | Dialogue content retained. |
| 7 — The Clockmaker's Last Hour | 1 — The Clockmaker's Workshop | Lena's conversations were copied into Chapters 2 and 5; Jonah's into Chapters 3 and 4. Early dialogue also referred to evidence not yet discovered. | Replaced with workshop observations, the archive key, the missing tool and normal service access. No identity or motive is established here. |
| 7 | 2 — The Forgotten Hour | Elias admitted the stop was deliberate and explained that grief had made him prolong it. Elias's exchanges were copied into Chapters 3–4; Poppy's into Chapters 3 and 5; Lena repeated Chapter 1. | Wrote archive-specific questions about the cut leaf, stamp, unsigned slip, index and reference clocks. Removed the premature admission and the slip's unsupported attribution to Elias. |
| 7 | 3 — The Town Square | Reused Elias/Poppy Chapter 2 topics and Jonah Chapter 1 topics, including the premature confession. | Wrote distinct witness and timeline conversations: bell reference times, an unclear silhouette, non-exclusive case shape, copper dust and the service route. The figure is not conclusively identified. |
| 7 | 4 — The Hidden Mechanism | Reused Elias and Jonah conversations. Dialogue and clues treated a shared tool as proof of its user. | Wrote inspection-specific questions about the pin, spring, protected metal, latch and maintenance card. A deliberate intervention is established; tool access is not treated as personal identification. The repair puzzle now explicitly plans the repair before the final restart. |
| 7 | 5 — The Clockmaker's Last Hour / Sunset Terrace | Lena and Poppy repeated earlier-chapter investigations; chapter openings reused the same two lines. | Replaced with the corrected public record, Mara's actual wish, responsibility to the town and keeping memories without stopping time. Elias's explicit admission and full motive remain in this final chapter. |

## Story 7 mystery progression

1. **Workshop:** establish anomalies and investigate before assigning cause.
2. **Archive:** establish a deliberate record omission; the author and clock-stopper remain unidentified.
3. **Square:** reconstruct the times and route; distinguish observations from guessed identities.
4. **Mechanism:** establish a deliberate mechanical intervention and compare a shared tool; the personal note points toward the terrace without a confession.
5. **Terrace:** Elias explicitly admits responsibility and explains the last minute he shared with Mara. The final choice concerns truth, accountability and making amends.

The Chapter 2 line “I should have told the town it was a deliberate stop” and the question “Did you mean to keep the town clock there forever?” have been removed from Chapters 1–4. The archive slip is now unsigned and technical, rather than a signed instruction to hold the minute. The Chapter 3 work-cloth title now matches its evidence description instead of asserting it came from Elias's cuff. Chapter 4's keepsake note no longer states the whole motive before the terrace reveal.

## Verification

- Initial audit: **11 groups of identical four-line exchanges**, comprising **25 copied topic instances beyond their first occurrence**; **15 self-repeating answers/follow-up answers** in Story 4; repeated chapter-opening lines in Story 7; **6 question/script text mismatches** in Story 7.
- Rewrote **44 question exchanges**: 15 in Story 4 and 29 in Story 7. Also changed Rowan's repeated introductions in Chapters 3–5 and Story 7's chapter openings.
- Final audit: **0 duplicate exchanges, 0 duplicate spoken lines, 0 Story 7 question/script mismatches**. A token-overlap review found no remaining cross-chapter exchange pairs above 65% overlap.
- **129 tests pass**, including dialogue uniqueness, scripted text consistency, the final-chapter reveal boundary, Story 5 greeting suppression, asset paths and chapter gate references.
- Rebuilt all seven story pages and configured legacy entry pages. Existing chapter, character, question, evidence and puzzle IDs and progression gates remain stable. Existing saves do not need to be reset; previously recorded conversation-log entries remain historical text.
- The reusable audit is `node scripts/audit-story-dialogue.js`; its JSON results are saved in `reports/dialogue-audit-results.json`.
