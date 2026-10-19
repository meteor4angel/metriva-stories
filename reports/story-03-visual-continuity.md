# The Midnight Train — visual continuity report

Definition: `stories/story-03.json` · Spatial manifest v1 · 5 scenes

All rectangles use percentages of the uncropped master image. This report checks metadata and geometry; a human must still compare the artwork.

## Carriage Four (carriage-four)

Legacy scene: `assets/cover-midnight-train.png` (no spatial manifest).

## The Dining Car (dining-car)

Legacy scene: `assets/train-ch2-dining.png` (no spatial manifest).

## The Unscheduled Stop (unscheduled-stop)

Legacy scene: `assets/train-ch3-observation.png` (no spatial manifest).

## The Baggage Car (baggage-car)

Legacy scene: `assets/train-ch4-baggage.png` (no spatial manifest).

## The Last Platform (last-platform)

Legacy scene: `assets/train-ch5-tower.png` (no spatial manifest).

## Manual visual-review checklist

- Compare each close-up against its master for furniture, object identity, orientation, damage, and light direction.
- Check that each neighboring object listed as visible genuinely falls inside the view and has the same physical relationship.
- Check overlap warnings against actual depth; a 2D overlap does not prove adjacency.
- Test scene and clue state variants before and after interaction, refresh, export, and import.
- Open the playable page with `?visual-debug=1` to overlay object footprints (teal), inspection regions (orange), and view frames (yellow).
