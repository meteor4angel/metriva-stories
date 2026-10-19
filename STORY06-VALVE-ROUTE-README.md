# Story 6 valve route update

Extract this archive into the Metriva Stories project root, preserving the folder paths. Open `story-06.html` to play the updated Story 6 locally. The archive includes that page, its engine and stylesheet, the source JSON, the puzzle-only chart, and the artwork referenced by the story. It does not change Stories 1–5.

Chapter 2 uses the valve chart as an interactive pipe puzzle. Choose four stops from nine valve wheels, including five plausible wrong turns. Selected pipe connections remain antique gold until the complete route is submitted correctly; only a confirmed route glows emerald. Select a valve again to remove it, undo the last selection, or reset the route. The original evidence chart, zoom controls, hints, save/export, and chapter progression remain available. Closing evidence opened from the puzzle returns to the same unfinished route.

The Story 6 notebook now uses equal-height, undistorted clue thumbnails. Every chapter tab displays its collected-evidence count, and the scene and notebook show the count for the chapter being viewed. All five chapter scenes place their numbered markers beside the clue artwork while leaving the physical inspection areas on the clue objects.

To rebuild from the JSON source after further edits, run `node scripts/build-story-page.js brackenmere-bell` in the full project checkout.
