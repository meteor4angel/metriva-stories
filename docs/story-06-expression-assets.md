# Story 06 character expressions

The five expression sheets are 1024 × 1536 PNGs with transparent backgrounds. Each is a 2 × 2 grid of 512 × 768 cells in this order: attentive/idle (top left), speaking (top right), concerned/thoughtful (bottom left), relieved (bottom right). The original portraits remain the source of character identity and are still used for the opening and investigation cards. The shared engine uses the sheets during conversations.

| Character | Source portrait | Expression sheet |
| --- | --- | --- |
| Edda Moss | `assets/story06-edda-moss.png` | `assets/story06-edda-expressions.png` |
| Rian Holt | `assets/story06-rian-holt.png` | `assets/story06-rian-expressions.png` |
| Jori Wren | `assets/story06-jori-wren.png` | `assets/story06-jori-expressions.png` |
| Marit Pell | `assets/story06-marit-pell.png` | `assets/story06-marit-expressions.png` |
| Sella Fen | `assets/story06-sella-fen.png` | `assets/story06-sella-expressions.png` |

Generated with the built-in image-generation tool, using each existing portrait as an identity and costume reference. The production prompt for each sheet was:

> Edit the attached [character] portrait into a clean 2 × 2 expression sprite sheet PNG with true alpha transparency. Preserve the exact face, hair, clothing, carried items, and painterly photorealistic warm/cool lighting of the reference. Four identically framed, registered, complete waist-up figures: top left attentive neutral with closed mouth; top right naturally speaking with open mouth; bottom left concerned and thoughtful with closed mouth; bottom right relieved with a subtle closed-mouth smile. No backdrop, gradient, shadow behind the figure, text, labels, grid lines, extra people, or cropped head.

The character-specific prompts also identified Edda's cap and rolled map, Rian's engineer equipment, Jori's rust coat and bag, Marit's keys, and Sella's shawl and book. Frame selection is data-driven through `characterSprites` in `stories/story-06.json`. Edda uses the original four-frame animation again; the additional expression transitions were removed at the user's request.
