window.LETTERS = {
  "id": "letters-after-midnight",
  "title": "Letters After Midnight",
  "chapters": [
    {
      "title": "The Attic",
      "subtitle": "Some letters were never meant to be lost.",
      "intro": "In 2005, Alex Morgan returns to Aunt Iris’s apartment to pack away the belongings she left behind. The attic has barely changed in decades: a cedar trunk, an oil lamp, four torn pages, and an envelope addressed to Julian Ellis. Rain taps softly on the skylight.",
      "spots": [
        {
          "id": "paper",
          "label": "Torn letter pages",
          "icon": "✉",
          "x": 34,
          "y": 61,
          "text": "Four pieces of the same cream paper share a pressed flower watermark. Their corner marks read A, B, C and D.",
          "clue": "Torn pages · A B C D"
        },
        {
          "id": "edges",
          "label": "Matching paper edges",
          "icon": "▤",
          "x": 67,
          "y": 61,
          "text": "The writing flows from A (“Dear Julian”) to C (“I waited by the station”), then B (“The stairs were closed”), then D (“I hope you understand”).",
          "clue": "Letter joins · A C B D"
        },
        {
          "id": "envelope",
          "label": "Unsent envelope",
          "icon": "✉",
          "x": 51,
          "y": 38,
          "text": "Turning the envelope over reveals an address to Julian Ellis, 18 Lantern Lane. It has no postmark.",
          "clue": "Unsent envelope"
        },
        {
          "id": "photo",
          "label": "Old photograph",
          "icon": "▧",
          "x": 79,
          "y": 45,
          "text": "Iris and a young man stand together on a rooftop. On the reverse: “Iris & Julian · 1987.”",
          "clue": "1987 rooftop photograph"
        },
        {
          "id": "celia",
          "label": "Talk to Celia",
          "icon": "☏",
          "x": 23,
          "y": 42,
          "text": "“Your aunt loved this apartment,” says caretaker Celia. “She used to write letters after midnight, when the city was quiet.”",
          "clue": "Celia’s memory"
        }
      ],
      "puzzle": "pages",
      "hint": [
        "Look at how the writing continues between torn pages.",
        "The station sentence is followed by the closed-staircase explanation.",
        "Arrange A → C → B → D."
      ],
      "success": "The restored letter says Iris waited at the station while Julian may have been trapped elsewhere. The address leads across the street.",
      "required": [
        "paper",
        "edges",
        "envelope",
        "photo",
        "celia"
      ]
    },
    {
      "title": "Across the Street",
      "subtitle": "The bookbinder kept a story of his own.",
      "intro": "Across the street, Rowan Ellis lets Alex explore his grandfather Julian’s bookbinding studio. Its old press and ink bottles still fill the worktable. Alex shares the torn letter, and Rowan opens a tin of stationery, surprised to see Iris’s name.",
      "spots": [
        {
          "id": "ink",
          "label": "Ink testing sheet",
          "icon": "✎",
          "x": 27,
          "y": 58,
          "text": "Julian used violet ink and signed with a long curved J. Iris wrote in dark green ink and signed with a small dotted I.",
          "clue": "Two handwriting styles"
        },
        {
          "id": "studio",
          "label": "Bookbinding desk",
          "icon": "▤",
          "x": 53,
          "y": 63,
          "text": "A half-bound notebook contains the sentence “I was there. You never came.” It is in Julian’s violet ink.",
          "clue": "Julian’s unsent note"
        },
        {
          "id": "box",
          "label": "Stationery tin",
          "icon": "▣",
          "x": 78,
          "y": 58,
          "text": "Two bundles are tied separately: dark green letters signed I and violet letters signed J.",
          "clue": "Two bundles of letters"
        },
        {
          "id": "rowan",
          "label": "Talk to Rowan",
          "icon": "☏",
          "x": 70,
          "y": 37,
          "text": "“Granddad was gentle, but he avoided talking about the past,” Rowan says. “I never knew he wrote to Iris.”",
          "clue": "Rowan’s recollection"
        },
        {
          "id": "frame",
          "label": "Framed calligraphy",
          "icon": "▧",
          "x": 23,
          "y": 37,
          "text": "The frame shows Julian’s characteristic long curved J beside his signature.",
          "clue": "Julian’s handwriting sample"
        }
      ],
      "puzzle": "ink",
      "hint": [
        "Read the ink testing sheet and the unsent notebook.",
        "The sentence is in violet ink with a curved J.",
        "Julian Ellis wrote the unsent note."
      ],
      "success": "The note is Julian’s. Both Iris and Julian wrote letters that neither ever mailed. Rowan offers to help piece together the missing years.",
      "required": [
        "ink",
        "studio",
        "box",
        "rowan",
        "frame"
      ]
    },
    {
      "title": "The Unsent Years",
      "subtitle": "A lifetime is hiding between dates.",
      "intro": "Back at the studio, Alex sets a closed flip phone beside the ink bottle while they arrange both bundles by date. The letters span 1987 to 2004; the silence between them is longer than either expected.",
      "spots": [
        {
          "id": "iris87",
          "label": "Iris’s first letter",
          "icon": "✉",
          "x": 27,
          "y": 56,
          "text": "Dated June 12, 1987. Iris writes in green ink that she keeps thinking of Julian and cannot quite believe the previous day.",
          "clue": "Iris · June 12, 1987"
        },
        {
          "id": "julian87",
          "label": "Julian’s reply",
          "icon": "✉",
          "x": 72,
          "y": 60,
          "text": "Dated June 13, 1987. Julian replies in violet ink that Iris’s letter found him and that he still hopes to say the words aloud.",
          "clue": "Julian · June 13, 1987"
        },
        {
          "id": "postcard",
          "label": "Later postcard",
          "icon": "▤",
          "x": 49,
          "y": 43,
          "text": "The postcard is dated September 1995. Turning it over reveals Iris’s line: “I still pass the rooftop sometimes.”",
          "clue": "Iris · September 1995"
        },
        {
          "id": "last",
          "label": "Last letter",
          "icon": "✎",
          "x": 76,
          "y": 38,
          "text": "Opening the envelope dated April 2004 reveals Julian’s line: “Some stories do not end. We simply stop telling them aloud.”",
          "clue": "Julian · April 2004"
        },
        {
          "id": "calendar",
          "label": "Calendar clipping",
          "icon": "▣",
          "x": 22,
          "y": 39,
          "text": "The June 1987 calendar circles Friday the 19th and carries a storm reminder. A notice at the rooftop later gives the closure time.",
          "clue": "June 19 storm record"
        }
      ],
      "puzzle": "years",
      "hint": [
        "The letter dates give a clear chronology.",
        "Start with 1987, then 1995, then 2004.",
        "Order: Iris June 12 → Julian June 13 → Iris September 1995 → Julian April 2004."
      ],
      "success": "The dated letters trace years of unanswered hope. June 19, 1987 is circled beside a storm reminder; the rooftop may explain what happened that evening.",
      "required": [
        "iris87",
        "julian87",
        "postcard",
        "last",
        "calendar"
      ]
    },
    {
      "title": "The Rooftop Garden",
      "subtitle": "The meeting place still remembers.",
      "intro": "Rowan leads Alex up the exterior stair to the rooftop garden. The old interior door is still boarded after the storm. Ivy climbs a white trellis, a tile mosaic glows in the afternoon sun, and a brass keepsake box rests near the bench.",
      "spots": [
        {
          "id": "mosaic",
          "label": "Star mosaic",
          "icon": "✦",
          "x": 52,
          "y": 53,
          "text": "Three stars run across the compass mosaic, from the eastern side through its center to the western side. Read them as Dawn, Noon, and Dusk: follow the day from first light to last.",
          "clue": "Mosaic order · Dawn Noon Dusk"
        },
        {
          "id": "bench",
          "label": "Garden bench",
          "icon": "▤",
          "x": 26,
          "y": 66,
          "text": "The weathered bench bears the initials I + J, carved where Iris and Julian once sat together.",
          "clue": "Garden bench · I + J"
        },
        {
          "id": "door",
          "label": "Blocked stairwell",
          "icon": "▣",
          "x": 75,
          "y": 42,
          "text": "A preserved notice reads: ROOFTOP STAIR CLOSED 6 PM, JUNE 19, 1987 — STORM DAMAGE.",
          "clue": "Closed stairwell notice"
        },
        {
          "id": "box",
          "label": "Brass keepsake box",
          "icon": "♧",
          "x": 72,
          "y": 72,
          "text": "The brass keepsake box has three rotating star dials, echoing the three-star mosaic on the garden floor.",
          "clue": "Three-star keepsake lock"
        },
        {
          "id": "rowan2",
          "label": "Talk to Rowan",
          "icon": "☏",
          "x": 27,
          "y": 40,
          "text": "“He came here every spring,” Rowan says. “I thought he loved the view. Maybe he was remembering someone.”",
          "clue": "Rowan’s rooftop memory"
        }
      ],
      "puzzle": "stars",
      "hint": [
        "The mosaic traces a day across its three stars.",
        "Think morning, midday, and evening.",
        "Choose Dawn → Noon → Dusk."
      ],
      "success": "The brass box opens. Inside is an undelivered change-of-plans note and a photograph of Iris and Julian smiling beneath the trellis.",
      "required": [
        "mosaic",
        "bench",
        "door",
        "box",
        "rowan2"
      ]
    },
    {
      "title": "The Letter Never Sent",
      "subtitle": "Sometimes the truth arrives late, but it still matters.",
      "intro": "As evening falls, Alex and Rowan spread the recovered letters across the rooftop’s stone table beside the opened brass box. The last note explains why the meeting failed. What happened is no longer a mystery—but what to do with the letters is a choice.",
      "spots": [
        {
          "id": "station",
          "label": "Iris’s station note",
          "icon": "✉",
          "x": 25,
          "y": 59,
          "text": "Iris wrote: “I will wait beneath the station clock at seven.” She never received Julian’s change of plans.",
          "clue": "Iris waited at station"
        },
        {
          "id": "change",
          "label": "Julian’s changed plan",
          "icon": "▤",
          "x": 70,
          "y": 62,
          "text": "Julian wrote: “The rooftop garden at seven instead. The station is flooded.” The envelope was never delivered.",
          "clue": "Undelivered rooftop message"
        },
        {
          "id": "storm",
          "label": "Storm closure record",
          "icon": "▣",
          "x": 47,
          "y": 39,
          "text": "The rooftop stairs closed at six. Julian used the exterior access, then waited above while Iris waited at the station.",
          "clue": "Storm closure evidence"
        },
        {
          "id": "collections",
          "label": "Two letter collections",
          "icon": "▥",
          "x": 78,
          "y": 40,
          "text": "Both Iris and Julian continued writing for years without sending their letters. The writing is different, but the affection is unmistakable.",
          "clue": "Matching letter collections"
        },
        {
          "id": "rowan3",
          "label": "Talk to Rowan",
          "icon": "☏",
          "x": 25,
          "y": 39,
          "text": "“We can’t give them their missed evening back,” Rowan says. “But we can let their story be understood.”",
          "clue": "Rowan’s proposal"
        }
      ],
      "puzzle": "truth",
      "hint": [
        "Compare where each person said they would wait.",
        "One waited at the station; the other at the rooftop garden.",
        "Choose: They waited at different places because a letter was never delivered."
      ],
      "success": "The missing message explains everything: neither abandoned the other. They were separated by an undelivered letter and a storm.",
      "required": [
        "station",
        "change",
        "storm",
        "collections",
        "rowan3"
      ]
    }
  ]
};
