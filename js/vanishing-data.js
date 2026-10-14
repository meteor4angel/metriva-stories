window.VANISHING_DATA={
  "story": [
    {
      "name": "The Flower Shop",
      "subtitle": "The shop closed at six. The register disagrees.",
      "background": "assets/shop.jpg",
      "spots": [
        {
          "id": "register",
          "label": "Register",
          "x": 60,
          "y": 55,
          "icon": "▤",
          "text": "The last sale was entered at 6:12 PM. One lavender ribbon. No customer name. An attached closing checklist records: shop locked at 6:00 PM; Clara’s greenhouse stock count signed at 6:20 PM.",
          "clue": "Receipt · 6:12 PM"
        },
        {
          "id": "window",
          "label": "Back window",
          "x": 86,
          "y": 40,
          "icon": "⌕",
          "text": "The latch is loose. Damp soil has collected along the sill. It might have been opened recently.",
          "clue": "Damp soil on window"
        },
        {
          "id": "letter",
          "label": "Writing desk",
          "x": 47,
          "y": 76,
          "icon": "✉",
          "text": "The writing desk holds a broken crescent-moon wax seal and a spoiled lavender ribbon. The sealed letter Mrs. Bellamy left here is gone.",
          "clue": "Crescent moon seal"
        },
        {
          "id": "miso",
          "label": "Miso",
          "x": 24,
          "y": 72,
          "icon": "🐈",
          "text": "Miso wakes, stretches, and bats a brass token from under the ledger. It reads: WHERE SPRING BEGAN.",
          "clue": "Brass garden token"
        }
      ]
    },
    {
      "name": "The Greenhouse",
      "subtitle": "An entry in the ledger is not an alibi.",
      "background": "assets/greenhouse.jpg",
      "spots": [
        {
          "id": "ledger",
          "label": "Greenhouse ledger",
          "x": 34,
          "y": 68,
          "icon": "▤",
          "text": "Clara signed the stock count at 6:20 PM. Eight minutes after the unexplained sale.",
          "clue": "Ledger · 6:20 PM"
        },
        {
          "id": "pots",
          "label": "Seedling trays",
          "x": 68,
          "y": 69,
          "icon": "✿",
          "text": "Fresh potting soil matches the texture on the back window sill. The trays themselves are undisturbed.",
          "clue": "Matching greenhouse soil"
        },
        {
          "id": "labels",
          "label": "Plant labels",
          "x": 77,
          "y": 37,
          "icon": "❀",
          "text": "A handwritten planting note says: lavender in spring, rosemary in summer, ivy in autumn. Someone has underlined SPRING.",
          "clue": "Seasonal planting note"
        }
      ]
    },
    {
      "name": "The Back Office",
      "subtitle": "A forgotten photograph points somewhere else.",
      "background": "assets/office.jpg",
      "spots": [
        {
          "id": "photo",
          "label": "Old photograph",
          "x": 30,
          "y": 53,
          "icon": "▧",
          "text": "A photograph from 1986 shows the first spring planting at Willowmere Memorial Garden. On the back: “Our first spring — E.”",
          "clue": "1986 garden photograph"
        },
        {
          "id": "drawer",
          "label": "Locked drawer",
          "x": 71,
          "y": 72,
          "icon": "▣",
          "text": "The drawer is locked. A pencilled reminder reads: “The last three digits of the year our first spring began.”",
          "clue": "Three-digit drawer lock"
        },
        {
          "id": "notes",
          "label": "Desk notes",
          "x": 55,
          "y": 42,
          "icon": "✎",
          "text": "Mrs. Bellamy once kept a correspondence box. A note reads: “Some letters were never meant for the post.”",
          "clue": "Correspondence note"
        }
      ]
    },
    {
      "name": "Memorial Garden",
      "subtitle": "The token belongs to a place, not a person.",
      "background": "assets/garden.jpg",
      "spots": [
        {
          "id": "plaque",
          "label": "Garden plaque",
          "x": 49,
          "y": 47,
          "icon": "✧",
          "text": "The garden was established in 1986. Its oldest bed is marked FIRST SPRING.",
          "clue": "First Spring flower bed"
        },
        {
          "id": "bed",
          "label": "Flower bed",
          "x": 73,
          "y": 70,
          "icon": "❀",
          "text": "Three plants are arranged in a row: lavender, rosemary, ivy. A small recess sits beneath the lavender.",
          "clue": "Lavender stone recess"
        },
        {
          "id": "bench",
          "label": "Garden bench",
          "x": 22,
          "y": 70,
          "icon": "⌕",
          "text": "A weathered engraving reads: “Not every goodbye was a farewell.”",
          "clue": "Garden bench inscription"
        }
      ]
    },
    {
      "name": "The Final Discovery",
      "subtitle": "What happened to the missing letter?",
      "background": "assets/finale.jpg",
      "spots": [
        {
          "id": "box",
          "label": "Memory box",
          "x": 50,
          "y": 63,
          "icon": "✉",
          "text": "A small box is hidden in the garden recess. Inside is the missing letter, addressed to E. and never mailed.",
          "clue": "Recovered letter"
        }
      ]
    }
  ],
  "conversations": [
    [
      {
        "name": "Mrs. Bellamy",
        "role": "Florist and shop owner",
        "initial": "B",
        "intro": "The shop smells of lavender and fresh rain. Mrs. Bellamy folds her hands around a cup of tea.",
        "options": [
          [
            "When did you last see the letter?",
            "“On the writing desk before we closed. I thought I was ready to send it.”"
          ],
          [
            "Who could enter after closing?",
            "“Clara has a key, but I locked the front door myself. The back window is old and difficult to latch.”"
          ],
          [
            "Why the lavender ribbon?",
            "“Elena always loved lavender. I kept a ribbon aside for her, years ago.”"
          ]
        ]
      },
      {
        "name": "Clara",
        "role": "Florist assistant",
        "initial": "C",
        "intro": "Clara puts down a bundle of stems and listens carefully.",
        "options": [
          [
            "Did you mail the letter?",
            "“No. Mrs. Bellamy asked me to wait. I left it on the desk.”"
          ],
          [
            "Where were you after six?",
            "“I checked the greenhouse stock and signed the ledger at 6:20. That is all the ledger can prove.”"
          ],
          [
            "Did you notice anything unusual?",
            "“Miso was playing with something brass under the register.”"
          ]
        ]
      }
    ],
    [
      {
        "name": "Mr. Finch",
        "role": "Gardener",
        "initial": "F",
        "intro": "Mr. Finch brushes soil from his gloves beside the seedling trays.",
        "options": [
          [
            "Does this soil look familiar?",
            "“The same damp potting mix as these trays. But it is sold all over Willowmere.”"
          ],
          [
            "What does FIRST SPRING mean?",
            "“It is the oldest flower bed in the Memorial Garden. Lavender was planted there first.”"
          ],
          [
            "Did you see Clara at six twelve?",
            "“No. I was outside. Her ledger entry was later than that.”"
          ]
        ]
      },
      {
        "name": "Clara",
        "role": "Florist assistant",
        "initial": "C",
        "intro": "Clara looks up from the greenhouse ledger.",
        "options": [
          [
            "Why is the ledger dated 6:20?",
            "“That is when I finished the stock count, not when I arrived.”"
          ],
          [
            "Who remembers the garden?",
            "“Mr. Finch helped with the planting records. He might know.”"
          ]
        ]
      }
    ],
    [
      {
        "name": "Mrs. Bellamy",
        "role": "Florist and shop owner",
        "initial": "B",
        "intro": "She studies an old photograph, her expression softening.",
        "options": [
          [
            "Who is E. in the photograph?",
            "“Elena. We planted the first spring flowers together in 1986.”"
          ],
          [
            "Why keep the correspondence box?",
            "“Some words become harder to say the longer you wait.”"
          ],
          [
            "What might open the drawer?",
            "“I always used the year of our first garden. Only the last three digits.”"
          ]
        ]
      },
      {
        "name": "Clara",
        "role": "Florist assistant",
        "initial": "C",
        "intro": "Clara opens the office curtains to let in the afternoon light.",
        "options": [
          [
            "What does the photograph show?",
            "“The Memorial Garden, when it first opened in 1986.”"
          ],
          [
            "Where is the correspondence box?",
            "“In the locked drawer, if Mrs. Bellamy still has it.”"
          ]
        ]
      }
    ],
    [
      {
        "name": "Mr. Finch",
        "role": "Gardener",
        "initial": "F",
        "intro": "A breeze stirs the lavender beside the old stone bench.",
        "options": [
          [
            "Where was the first spring planting?",
            "“The lavender bed. Look for the stone with a recess.”"
          ],
          [
            "What is the brass token for?",
            "“I remember a token like that. It belonged to the old garden keepsake box.”"
          ]
        ]
      },
      {
        "name": "Mrs. Bellamy",
        "role": "Florist and shop owner",
        "initial": "B",
        "intro": "Mrs. Bellamy stands quietly by the memorial flowers.",
        "options": [
          [
            "What does this place mean to you?",
            "“It was where Elena and I promised we would never stop writing.”"
          ],
          [
            "Was the letter meant for Elena?",
            "“Yes. I thought the garden might help me find the courage.”"
          ]
        ]
      }
    ],
    [
      {
        "name": "Mrs. Bellamy",
        "role": "Florist and shop owner",
        "initial": "B",
        "intro": "Her eyes settle on the recovered envelope.",
        "options": [
          [
            "Why did you hide the letter?",
            "“I returned after closing. I could not bear to send it, but I could not destroy it either.”"
          ],
          [
            "What happens now?",
            "“Perhaps I can finally tell Elena the truth myself.”"
          ]
        ]
      },
      {
        "name": "Clara",
        "role": "Florist assistant",
        "initial": "C",
        "intro": "Clara smiles gently at the recovered letter.",
        "options": [
          [
            "Was anyone stealing from the shop?",
            "“No. The clues looked suspicious, but the truth is kinder.”"
          ]
        ]
      }
    ]
  ]
};