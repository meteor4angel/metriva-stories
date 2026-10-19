# The Bell Beneath Brackenmere — visual continuity report

Definition: `stories/story-06.json` · Spatial manifest v1 · 5 scenes

All rectangles use percentages of the uncropped master image. This report checks metadata and geometry; a human must still compare the artwork.

## Bell Tower (tower)

- Master: `assets/story06-tower-realistic.png` (1672×941)
- Layout: Bell centered above two work surfaces; the severed rope lies on the left floor, the map in the foreground, and Edda’s ledger on the right desk.
- Lighting: Warm lantern light from both sides meets cold storm light through the rear arch.
- Landmarks: bronze bell; storm-facing stone arch; left bell frame; foreground map crate; right ledger desk

| Physical object | Footprint x, y, width×height | Depth / layer | Surface / material | Nearby | States |
|---|---|---|---|---|---|
| brackenmere.tower.cut-rope | 13, 65, 25×25% | 0.9 / 2 | stone floor / hemp | — | default |
| brackenmere.tower.bell-ledger | 65, 55, 31×24% | 0.6 / 2 | right desk / leather and paper | — | default |
| brackenmere.tower.tide-note | 33, 68, 37×24% | 0.8 / 2 | foreground crate / paper | — | default |

- **The severed bell rope**: Frayed, cleanly severed pale hemp coil on wet stone; free end points toward the bell frame.
- **The bellkeeper's ledger**: Open dark leather ledger with cream pages, resting on the right wooden desk beside the lantern.
- **A note beneath the map**: Weathered flood map spread on the foreground crate; a separate small note peeks beneath its lower edge.

| Clue | Marker x,y | Inspection region | View frame | Visible objects | Detail source |
|---|---|---|---|---|---|
| The severed bell rope | 25, 80% | 6, 58, 39×39% | 6, 58, 39×39% | brackenmere.tower.cut-rope, brackenmere.tower.tide-note | master crop |
| The bellkeeper's ledger | 78, 66% | 58, 48, 42×38% | 58, 48, 42×38% | brackenmere.tower.bell-ledger | assets/story06-tower-ledger-detail.png |
| A note beneath the map | 52, 79% | 26, 61, 51×38% | 26, 61, 51×38% | brackenmere.tower.cut-rope, brackenmere.tower.tide-note | assets/story06-tower-map-detail.png |

Overlapping inspection regions: cut-rope ↔ tide-note (screen overlap only; review depth and framing); bell-ledger ↔ tide-note (screen overlap only; review depth and framing).
Potentially visible objects omitted from views: bell-ledger-view ↔ brackenmere.tower.tide-note (review occlusion/depth); tide-note-view ↔ brackenmere.tower.bell-ledger (review occlusion/depth).

## Pump House (pump-house)

- Master: `assets/story06-pump-realistic.png` (1672×941)
- Layout: The chart is fixed to the left wall, the gauge sits high on a right pipe, Edda’s lantern is behind the central floor grate, and the key ledger lies on the right bench.
- Lighting: Warm pipe-house lanterns against cool rainy light through the open door.
- Landmarks: left chart board; central pump flywheel; right pressure pipe; floor drain grate; right workbench

| Physical object | Footprint x, y, width×height | Depth / layer | Surface / material | Nearby | States |
|---|---|---|---|---|---|
| brackenmere.pump-house.pressure-gauge | 63, 5, 13×19% | 0.5 / 3 | upper-right pipe / brass and glass | — | default |
| brackenmere.pump-house.valve-chart | 5, 8, 21×34% | 0.4 / 2 | left wall board / paper | — | default |
| brackenmere.pump-house.lantern-wick | 47, 70, 10×22% | 0.9 / 1 | recess behind floor grate / brass and glass | — | default |
| brackenmere.pump-house.ferry-key | 76, 59, 23×19% | 0.7 / 2 | right workbench / paper and iron | — | default |

- **The pressure gauge**: Round cream-faced pressure gauge in a tarnished brass rim, bolted to the upper right pipe.
- **The valve chart**: Aging parchment valve-route diagram pinned flat to the left timber board.
- **A damp lantern wick**: Small lit brass lantern beneath the central drain grate; damp wick and blue wool at its hinge.
- **The ferry key ledger**: Open key ledger with one black iron key resting diagonally across its pages on the right workbench.

| Clue | Marker x,y | Inspection region | View frame | Visible objects | Detail source |
|---|---|---|---|---|---|
| The pressure gauge | 69, 13% | 56, 0, 27×31% | 56, 0, 27×31% | brackenmere.pump-house.pressure-gauge | assets/story06-pump-pressure-gauge-detail.png |
| The valve chart | 14, 23% | 0, 1, 33×48% | 0, 1, 33×48% | brackenmere.pump-house.valve-chart | assets/story06-pump-valve-chart-detail.png |
| A damp lantern wick | 52, 78% | 40, 63, 24×36% | 40, 63, 24×36% | brackenmere.pump-house.lantern-wick | assets/story06-pump-lantern-wick-detail.png |
| The ferry key ledger | 87, 68% | 69, 52, 31×33% | 69, 52, 31×33% | brackenmere.pump-house.ferry-key | assets/story06-pump-ferry-key-detail.png |

Overlapping inspection regions: none.
Potentially visible objects omitted from views: none.

## Aqueduct Gallery (aqueduct)

- Master: `assets/story06-aqueduct-realistic.png` (1672×941)
- Layout: The verse relief and mineral lines share the left wall, while a pipe diagram is mounted above the right-hand resonator and a tuning fork rests on its stone ledge.
- Lighting: Warm wall lantern near the relief; cold storm light across the river and right wall.
- Landmarks: left verse relief; left mineral-streaked wall; arched passage; right pipe diagram; stone resonator

| Physical object | Footprint x, y, width×height | Depth / layer | Surface / material | Nearby | States |
|---|---|---|---|---|---|
| brackenmere.aqueduct.water-marks | 5, 46, 30×26% | 0.5 / 1 | left wall / mineral residue | brackenmere.aqueduct.verse-panel | default |
| brackenmere.aqueduct.pipe-diagram | 75, 5, 24×29% | 0.4 / 2 | right wall board / paper | — | default |
| brackenmere.aqueduct.verse-panel | 5, 5, 26×34% | 0.4 / 2 | left wall / carved stone | brackenmere.aqueduct.water-marks | default |
| brackenmere.aqueduct.sound-test | 80, 59, 17×17% | 0.8 / 2 | right resonator ledge / steel | — | default |

- **The water marks**: Three pale mineral tide lines running across the lower left stone wall, newest line below the pipe.
- **The pipe diagram**: Worn engineering drawing pinned on a dry upper-right board above the iron pipe.
- **The Echo Keeper verse**: Relief-carved folklore panel set into the left masonry, with weathered verse detailing.
- **A tuning fork on stone**: Small steel tuning fork placed on the dry resonator ledge beside a fresh scrape.

| Clue | Marker x,y | Inspection region | View frame | Visible objects | Detail source |
|---|---|---|---|---|---|
| The water marks | 20, 62% | 0, 39, 42×40% | 0, 28, 42×52% | brackenmere.aqueduct.water-marks, brackenmere.aqueduct.verse-panel | master crop |
| The pipe diagram | 87, 20% | 68, 0, 32×41% | 68, 0, 32×41% | brackenmere.aqueduct.pipe-diagram | assets/story06-aqueduct-pipe-diagram-detail.png |
| The Echo Keeper verse | 14, 24% | 0, 0, 38×46% | 0, 0, 40×60% | brackenmere.aqueduct.verse-panel, brackenmere.aqueduct.water-marks | assets/story06-aqueduct-verse-panel-detail.png |
| A tuning fork on stone | 87, 67% | 73, 52, 27×31% | 73, 52, 27×31% | brackenmere.aqueduct.sound-test | master crop |

Overlapping inspection regions: water-marks ↔ verse-panel (declared nearby).
Potentially visible objects omitted from views: none.

## Spring Garden (spring-garden)

- Master: `assets/story06-garden-realistic.png` (1672×941)
- Layout: Four verse stones stand on the middle terrace; the survey map is on the right bench, a lantern marks the left lower stair, and a chalk arrow is on the lower center service door.
- Lighting: Moonlit blue terraces with small warm lantern pools on the stairs.
- Landmarks: old well; four verse stones; right survey bench; three terrace arches; lower service door

| Physical object | Footprint x, y, width×height | Depth / layer | Surface / material | Nearby | States |
|---|---|---|---|---|---|
| brackenmere.spring-garden.verse-stones | 42, 31, 24×19% | 0.5 / 2 | middle garden terrace / stone and lichen | — | default |
| brackenmere.spring-garden.garden-map | 78, 40, 19×18% | 0.7 / 2 | right stone bench / paper | — | default |
| brackenmere.spring-garden.lantern-trail | 17, 72, 13×20% | 0.9 / 2 | lower-left stair / brass and glass | — | default |
| brackenmere.spring-garden.counterweight-mark | 47, 69, 12×19% | 0.8 / 2 | lower service door / chalk on wood | — | default |

- **The four verse stones**: Four distinct mossed verse stones with worn faces, standing together on the middle terrace.
- **The spring-garden map**: Folded survey parchment lying flat on a dry right-hand stone bench.
- **The lantern trail**: Small brass lantern on the lower-left stair with scattered droplets of lamp oil.
- **The counterweight mark**: White chalk arrow drawn down the lower service door beneath the third arch.

| Clue | Marker x,y | Inspection region | View frame | Visible objects | Detail source |
|---|---|---|---|---|---|
| The four verse stones | 53, 39% | 35, 24, 38×33% | 35, 24, 38×33% | brackenmere.spring-garden.verse-stones | assets/story06-garden-verse-stones-detail.png |
| The spring-garden map | 86, 47% | 71, 33, 29×32% | 71, 33, 29×32% | brackenmere.spring-garden.garden-map | assets/story06-garden-map-puzzle.png |
| The lantern trail | 23, 81% | 10, 65, 27×34% | 10, 65, 27×34% | brackenmere.spring-garden.lantern-trail | master crop |
| The counterweight mark | 52, 79% | 40, 62, 26×33% | 40, 62, 26×33% | brackenmere.spring-garden.counterweight-mark | assets/story06-garden-counterweight-detail.png |

Overlapping inspection regions: verse-stones ↔ garden-map (screen overlap only; review depth and framing).
Potentially visible objects omitted from views: none.

## Springworks Chamber (springworks)

- Master: `assets/story06-works-realistic.png` (1672×941)
- Layout: The floodgate and counterweight dominate the left chamber; a dry diagram rests on the left ledge, Edda’s tools are centered, and the tally and waterline sit on the right wall.
- Lighting: Warm practical lanterns on stone ledges against cool water and tunnel light.
- Landmarks: left floodgate; counterweight; central tool ledge; right waterline; upper-right tally board

| Physical object | Footprint x, y, width×height | Depth / layer | Surface / material | Nearby | States |
|---|---|---|---|---|---|
| brackenmere.springworks.gate-diagram | 1, 56, 23×28% | 0.8 / 2 | left stone ledge / paper and metal | brackenmere.springworks.tool-roll | default |
| brackenmere.springworks.waterline | 77, 55, 16×30% | 0.7 / 1 | right wall / water and mineral residue | — | default |
| brackenmere.springworks.tool-roll | 30, 60, 28×20% | 0.9 / 2 | central dry ledge / canvas, steel and brass | brackenmere.springworks.gate-diagram | default |
| brackenmere.springworks.upper-hamlet | 84, 7, 13×22% | 0.4 / 2 | upper-right wall board / paper | — | default |

- **The gate diagram**: Gate-and-bypass engineering diagram held by a metal clip on the dry left ledge.
- **The rising waterline**: Fresh wet line above an older safe mark on the right stone beside the side valve.
- **Edda's tool roll**: Open brown canvas tool roll carrying a wrench, coil of rope, brass whistle, and small note.
- **The upper-hamlet tally**: Folded household water tally pinned to a dry upper-right board.

| Clue | Marker x,y | Inspection region | View frame | Visible objects | Detail source |
|---|---|---|---|---|---|
| The gate diagram | 12, 71% | 0, 49, 31×42% | 0, 49, 31×42% | brackenmere.springworks.gate-diagram, brackenmere.springworks.tool-roll | assets/story06-chapter5-clue-sheet.png |
| The rising waterline | 84, 70% | 70, 48, 30×44% | 70, 48, 30×44% | brackenmere.springworks.waterline | assets/story06-chapter5-clue-sheet.png |
| Edda's tool roll | 43, 70% | 23, 53, 42×34% | 23, 53, 42×34% | brackenmere.springworks.tool-roll, brackenmere.springworks.gate-diagram | assets/story06-chapter5-clue-sheet.png |
| The upper-hamlet tally | 91, 21% | 77, 0, 23×36% | 77, 0, 23×36% | brackenmere.springworks.upper-hamlet | assets/story06-chapter5-clue-sheet.png |

Overlapping inspection regions: gate-diagram ↔ tool-roll (declared nearby).
Potentially visible objects omitted from views: none.

## Manual visual-review checklist

- Compare each close-up against its master for furniture, object identity, orientation, damage, and light direction.
- Check that each neighboring object listed as visible genuinely falls inside the view and has the same physical relationship.
- Check overlap warnings against actual depth; a 2D overlap does not prove adjacency.
- Test scene and clue state variants before and after interaction, refresh, export, and import.
- Open the playable page with `?visual-debug=1` to overlay object footprints (teal), inspection regions (orange), and view frames (yellow).
