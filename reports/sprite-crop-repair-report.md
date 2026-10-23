# Story 7 character-frame repair

The thin pieces over Elias's head were fragments from adjacent poses included in the atlas cell. The ivory outline correctly followed those fragments, making them visible. Five clockmaker frames were affected (16–20). Biscuit's content pose (23) included pieces of the preceding dog at its left edge. Alden's original evenly spaced crop did not match the uneven rows in the old cast sheet.

## Repairs

- Clockmaker: kept all original artwork and expressions. Added explicit source crop windows for frames 16–20, excluding only the adjacent-pose strips. The sprite is clipped inside a separate rendering layer before the outer ivory outline is drawn. Animation cycles use the same corrected crop windows.
- Biscuit: retained all 30 expressions and their existing symbols such as hearts, sparkles and sleep marks. Corrected frame 23's left crop in both dialogue portraits and the movable scene companion.
- Alden: replaced the misaligned old sheet row with eight clean transparent 512 × 512 individual portraits, retaining all expression aliases. His existing sheet is preserved. The regenerated source is `assets/story07/alden-expressions-clean.png`; active portraits are `assets/story07/expressions/alden/01.png` through `08.png`.
- Lena, Jonah and Poppy: checked their separate expression files; no equivalent neighbour fragments found.

Checked all six Story 7 characters (150 frames total). Added crop-boundary regression tests for the six known fragment cases, verified the original character silhouettes remain within the corrected windows, tested expression switching, and extended transparent-margin checks to Alden. **131 tests pass.**

## Alden generation details

Built-in image generation was used for Alden's replacement portraits. Prompt: “Create a clean expression sheet for Alden, the young man with brown hair and round glasses in the fifth row of this character reference. Keep his identity, glasses, cream shirt, brown waistcoat and tie. Eight separate bust portraits, arranged four columns and two rows: neutral, talking, curious, thoughtful hand at chin, friendly smile, relieved, concerned, cheerful folded arms. All heads and hands complete with generous space around each portrait. Transparent background, no lines or labels, no other characters. Match the warm polished storybook character style. High resolution.”

The clockmaker and Biscuit repairs correct rendering crop definitions without changing their raster artwork.
