// Metriva Story 01 · Chapter 1 evidence display metadata.
// Load this script AFTER vanishing-data.js and BEFORE vanishing-engine.js.
// IDs must match the existing spot IDs; do not rename them.
window.VANISHING_EVIDENCE = {
  "schemaVersion": 1,
  "storyId": "vanishing-letter",
  "discoveries": {
    "drawer-open": {
      "type": "discovery",
      "notebookTitle": "Correspondence drawer",
      "title": "The Correspondence Drawer",
      "image": "assets/clue-notes.png",
      "observation": "Inside the unlocked drawer are postcards signed ‘E.’ One reads: ‘If the letter ever returns, leave it where our first spring began.’",
      "question": "Why did the sender choose the Memorial Garden?"
    }
  },
  "chapters": {
    "flower-shop": {
      "register": {
        "markerLabel": "Register",
        "title": "The Receipt",
        "zoomTitle": "Examining the Receipt",
        "notebookTitle": "Receipt",
        "caseNote": "The Receipt · 6:12 PM",
        "question": "Why was a ribbon sold after closing?"
      },
      "window": {
        "markerLabel": "Back window",
        "title": "The Loose Latch",
        "zoomTitle": "Examining the Loose Latch",
        "notebookTitle": "Loose latch",
        "caseNote": "Damp soil on window",
        "question": "Who might have approached this window?"
      },
      "letter": {
        "markerLabel": "Writing desk",
        "title": "The Broken Seal",
        "zoomTitle": "Examining the Broken Seal",
        "notebookTitle": "Broken seal",
        "caseNote": "Crescent moon seal",
        "question": "What happened to the letter on this desk?"
      },
      "miso": {
        "markerLabel": "Miso",
        "title": "The Brass Token",
        "zoomTitle": "Examining the Brass Token",
        "notebookTitle": "Brass token",
        "caseNote": "Brass garden token",
        "question": "Where might this token belong?"
      }
    }
  }
};
