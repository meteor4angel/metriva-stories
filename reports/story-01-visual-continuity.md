# The Vanishing Letter — visual continuity report

Definition: `stories/story-01.json` · Spatial manifest v1 · 5 scenes

All rectangles use percentages of the uncropped master image. This report checks metadata and geometry; a human must still compare the artwork.

## The Flower Shop (chapter-1)

Legacy scene: `assets/scene-shop.png` (no spatial manifest).

## The Greenhouse (chapter-2)

Legacy scene: `assets/scene-greenhouse.png` (no spatial manifest).

## The Back Office (chapter-3)

Legacy scene: `assets/scene-office.png` (no spatial manifest).

## Memorial Garden (chapter-4)

Legacy scene: `assets/scene-garden.png` (no spatial manifest).

## The Final Discovery (chapter-5)

Legacy scene: `assets/scene-finale.png` (no spatial manifest).

## Manual visual-review checklist

- Compare each close-up against its master for furniture, object identity, orientation, damage, and light direction.
- Check that each neighboring object listed as visible genuinely falls inside the view and has the same physical relationship.
- Check overlap warnings against actual depth; a 2D overlap does not prove adjacency.
- Test scene and clue state variants before and after interaction, refresh, export, and import.
- Open the playable page with `?visual-debug=1` to overlay object footprints (teal), inspection regions (orange), and view frames (yellow).
