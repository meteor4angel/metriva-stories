// Story hint content and automatic progress-based availability rules.
window.VANISHING_HINT_DATA = {
  "schemaVersion": 2,
  "storyId": "vanishing-letter",
  "chapters": [
    {
      "id": "chapter-1",
      "hints": [
        {
          "text": "Start with the objects on the counter and the loose back window.",
          "availableWhen": {
            "always": true
          }
        },
        {
          "text": "The receipt is later than closing. Miso has found something useful.",
          "availableWhen": {
            "anyEvidence": [
              "register",
              "window"
            ]
          }
        },
        {
          "text": "Examine the register, window, writing desk and Miso. Then visit the greenhouse.",
          "availableWhen": {
            "allEvidence": [
              "register",
              "window",
              "letter",
              "miso"
            ]
          }
        }
      ]
    },
    {
      "id": "chapter-2",
      "hints": [
        {
          "text": "Separate what is recorded from what you assume.",
          "availableWhen": {
            "always": true
          }
        },
        {
          "text": "Compare closing, the ribbon receipt and Clara’s ledger signature.",
          "availableWhen": {
            "allEvidence": [
              "ledger",
              "pots"
            ]
          }
        },
        {
          "text": "Arrange 6:00 PM, 6:12 PM, then 6:20 PM. The later entry is not an alibi for the earlier sale.",
          "availableWhen": {
            "chapterEvidenceComplete": true
          }
        }
      ]
    },
    {
      "id": "chapter-3",
      "hints": [
        {
          "text": "The lock’s reminder refers to a shared beginning.",
          "availableWhen": {
            "always": true
          }
        },
        {
          "text": "Find the year in the garden photograph; the reminder asks for only three digits.",
          "availableWhen": {
            "chapterEvidenceCountAtLeast": 2
          }
        },
        {
          "text": "The photograph is dated 1986. The last three digits are 986.",
          "availableWhen": {
            "chapterEvidenceComplete": true
          }
        }
      ]
    },
    {
      "id": "chapter-4",
      "hints": [
        {
          "text": "The token names a place, not a person.",
          "availableWhen": {
            "always": true
          }
        },
        {
          "text": "Match FIRST SPRING to the seasonal planting note.",
          "availableWhen": {
            "chapterEvidenceCountAtLeast": 2
          }
        },
        {
          "text": "Look for the lavender marking and examine the recess beneath it. The brass token may help explain why this place matters.",
          "availableWhen": {
            "chapterEvidenceComplete": true
          }
        }
      ]
    },
    {
      "id": "chapter-5",
      "hints": [
        {
          "text": "The letter’s author can explain more than the suspicious traces.",
          "availableWhen": {
            "always": true
          }
        },
        {
          "text": "Recover the memory box, then read the letter.",
          "availableWhen": {
            "evidenceFound": [
              "box"
            ]
          }
        },
        {
          "text": "Mrs. Bellamy moved her own letter. Choose how to support her next step.",
          "availableWhen": {
            "revealStarted": true
          }
        }
      ]
    }
  ]
};
