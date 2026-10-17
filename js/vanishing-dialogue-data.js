// Metriva dialogue unlock metadata. Load after vanishing-data.js and before vanishing-engine.js.
window.VANISHING_DIALOGUE_RULES = {
  "schemaVersion": 1,
  "storyId": "vanishing-letter",
  "chapters": {
    "0": {
      "Mrs. Bellamy": {
        "availableWhen": {
          "always": true
        },
        "questions": {
          "0": {
            "always": true
          },
          "1": {
            "evidenceFound": [
              "window"
            ]
          },
          "2": {
            "evidenceFound": [
              "letter"
            ]
          }
        },
        "notificationExclude": [
          0
        ]
      },
      "Clara": {
        "availableWhen": {
          "dialogueCompleted": [
            "0:0:1"
          ]
        },
        "questions": {
          "0": {
            "dialogueCompleted": [
              "0:0:1"
            ]
          },
          "1": {
            "evidenceFound": [
              "register"
            ]
          },
          "2": {
            "evidenceFound": [
              "miso"
            ]
          }
        }
      }
    },
    "1": {
      "Clara": {
        "availableWhen": {
          "evidenceFound": [
            "ledger"
          ]
        },
        "lockedLabel": "Examine the greenhouse ledger",
        "questions": {
          "0": {
            "evidenceFound": [
              "ledger"
            ]
          },
          "1": {
            "evidenceFound": [
              "ledger"
            ]
          }
        }
      },
      "Mr. Finch": {
        "availableWhen": {
          "evidenceFound": [
            "pots"
          ]
        },
        "lockedLabel": "Not introduced yet",
        "questions": {
          "0": {
            "evidenceFound": [
              "pots"
            ]
          },
          "1": {
            "evidenceFound": [
              "labels"
            ]
          },
          "2": {
            "evidenceFound": [
              "labels"
            ]
          }
        }
      }
    }
  }
};
