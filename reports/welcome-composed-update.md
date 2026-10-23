# Composed welcome update — 23 October 2026

The welcome now uses the two newly supplied group sheets for every active pose. Each asset preserves the two hosts, Biscuit, cat and bird together. Individual layers and the previous separate door remain available but are not rendered.

| Beat | Selected artwork |
|---|---|
| First entrance | First sheet, upper left peek |
| Hello | First sheet, upper greeting |
| Happy greeting | Second sheet, open-arm greeting |
| Pick a story | First sheet, pointing invitation |
| Returning entrance | Second sheet, running group |
| Returning affection | Second sheet, lower hugging group |
| Returning invitation | Second sheet, upper-right pointing group |
| Close reaction | First sheet, disappointed group |
| Goodbye | First sheet, ornate right doorway with all five |
| Waiting | First sheet, bottom four groups, left to right 1 → 2 → 3 → 4 |

Fourteen transparent WebP assets are stored in public/assets/welcome/group-v3. They use a shared 640 × 660 canvas and baseline. Minimum-alpha seams separate touching poses; border-connected checkerboard removal is used for the second sheet. The celebration pose without a visible bird is excluded. No new generated artwork was needed.

Run scripts/prepare-welcome-groups.py to reproduce the crops. Crop provenance is in group-v3/manifest.json. reports/welcome-composed-contact.jpg shows all 14 on cream.
