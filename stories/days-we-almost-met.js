window.DAYS_STORY = {
  "id": "days-we-almost-met",
  "title": "The Days We Almost Met",
  "chapters": [
    {
      "title": "A Chance Encounter",
      "subtitle": "Some meetings feel like they were always meant to happen.",
      "intro": "At Fleur & Livre, a neighborhood café and bookshop, Mira accidentally drops her paperback. A stranger named Theo helps gather the pages. Neither tries to turn the moment into a grand romance; they simply share a laugh.",
      "spots": [
        {
          "id": "book",
          "label": "Dropped paperback",
          "x": 27,
          "y": 67,
          "text": "Inside the cover is a note in blue ink: “The best places are the ones you return to.” Mira wrote it years ago in a community reading group.",
          "clue": "Book inscription · blue ink",
          "icon": "▤"
        },
        {
          "id": "receipt",
          "label": "Café receipt",
          "x": 54,
          "y": 76,
          "text": "Today’s café receipt reads APR 12 · 10:42. Theo’s bookmark lists his neighborhood reading shift at 11:00.",
          "clue": "Receipt · Apr 12 · 10:42",
          "icon": "▣"
        },
        {
          "id": "lilac",
          "label": "Pressed lilac",
          "x": 13,
          "y": 52,
          "text": "A pressed lilac slips from the book. Mira collected it from the riverside garden last spring; it is not a secret message.",
          "clue": "Pressed lilac · riverside garden",
          "icon": "✿"
        },
        {
          "id": "photo",
          "label": "Neighborhood photograph",
          "x": 81,
          "y": 73,
          "text": "The postcard shows Fleur & Livre beside the riverside garden and the old public library. The route is walkable.",
          "clue": "Postcard · café, garden, library",
          "icon": "▧"
        },
        {
          "id": "chalk",
          "label": "Café chalkboard",
          "x": 67,
          "y": 36,
          "text": "The chalkboard says: “Open reading table — Sundays at 11:00. Everyone welcome.” Theo mentions that he volunteers there.",
          "clue": "Reading table · 11:00",
          "icon": "☷"
        }
      ],
      "required": [
        "book",
        "receipt",
        "lilac",
        "photo",
        "chalk"
      ],
      "puzzle": "cafe",
      "hint": [
        "The receipt and chalkboard establish a timeline.",
        "Mira arrives at 10:42; the reading table begins at 11:00.",
        "Choose the event that naturally follows the café meeting: the 11:00 reading table."
      ],
      "success": "Theo invites Mira to join the public reading table, without pressure. She decides to stay for one chapter. Their conversation begins over books, not fate."
    },
    {
      "title": "Shared Pages",
      "subtitle": "A second meeting, and an invitation without expectations.",
      "intro": "The following Sunday, Mira returns to the reading room because she enjoyed the books. Theo is shelving donated novels. They remember each other, but this time they have room for an actual conversation.",
      "spots": [
        {
          "id": "ledger",
          "label": "Volunteer sign-in sheet",
          "x": 24,
          "y": 72,
          "text": "The sign-in sheet shows Theo volunteered on Apr 12 and Apr 19. Mira attended on Apr 19. No one arranged a secret meeting.",
          "clue": "Volunteer sheet · Apr 12 and 19",
          "icon": "▤"
        },
        {
          "id": "margin",
          "label": "Annotated novel",
          "x": 48,
          "y": 55,
          "text": "In the margin, Theo has written: “A good ending lets both people choose.” He says he likes stories about ordinary kindness.",
          "clue": "Margin note · choosing freely",
          "icon": "✎"
        },
        {
          "id": "shelf",
          "label": "Return shelf",
          "x": 77,
          "y": 41,
          "text": "Three books are marked for return: Poems 100, Travel 400, Gardens 600. The shelf labels run from lowest to highest number.",
          "clue": "Shelf labels · 100, 400, 600",
          "icon": "▥"
        },
        {
          "id": "tea",
          "label": "Two cups of tea",
          "x": 71,
          "y": 79,
          "text": "Mira ordered mint tea. Theo drinks black coffee. The librarian offered them a shared table; neither assumed the other would stay.",
          "clue": "Shared table · no pressure",
          "icon": "♨"
        },
        {
          "id": "flyer",
          "label": "Neighborhood flyer",
          "x": 14,
          "y": 37,
          "text": "A flyer advertises a Saturday community garden cleanup. Mira says she has already signed up; Theo says he might come.",
          "clue": "Garden cleanup · Saturday",
          "icon": "✿"
        }
      ],
      "required": [
        "ledger",
        "margin",
        "shelf",
        "tea",
        "flyer"
      ],
      "puzzle": "books",
      "hint": [
        "Read the numbers printed on the return shelf.",
        "The shelf sorts from the smallest category number to the largest.",
        "Poems 100 → Travel 400 → Gardens 600."
      ],
      "success": "Mira and Theo finish shelving the books together. They exchange first names and favorite authors, then part with an easy “See you around.”"
    },
    {
      "title": "A Rainy Detour",
      "subtitle": "When plans change, a different route reveals something new.",
      "intro": "A week later, a shower sends neighbors beneath the awnings of Lantern Lane. Mira and Theo happen to shelter at the same bakery. The garden path is flooded, so they work out how to reach the community cleanup.",
      "spots": [
        {
          "id": "map",
          "label": "Neighborhood map",
          "x": 25,
          "y": 66,
          "text": "The map shows three routes to the garden: Canal Walk (closed), Market Street (open), and Bridge Road (open but much longer).",
          "clue": "Map · Market Street open",
          "icon": "▧"
        },
        {
          "id": "notice",
          "label": "Flood notice",
          "x": 59,
          "y": 37,
          "text": "The council notice says “CANAL WALK CLOSED UNTIL MONDAY.” No shortcuts through the garden wall.",
          "clue": "Closure · Canal Walk",
          "icon": "▤"
        },
        {
          "id": "umbrella",
          "label": "Umbrella stand",
          "x": 80,
          "y": 68,
          "text": "Theo offers Mira a spare umbrella. She thanks him but says she already has one. He accepts the answer with a smile.",
          "clue": "An offer kindly declined",
          "icon": "☂"
        },
        {
          "id": "bakery",
          "label": "Bakery clock",
          "x": 44,
          "y": 78,
          "text": "The bakery clock reads 2:15. Cleanup starts at 3:00. Market Street takes about fifteen minutes.",
          "clue": "Clock · 2:15; cleanup 3:00",
          "icon": "◷"
        },
        {
          "id": "poster",
          "label": "Garden volunteer poster",
          "x": 12,
          "y": 35,
          "text": "“Please use Market Street entrance during repairs.” The note is signed by the garden coordinator.",
          "clue": "Entrance · Market Street",
          "icon": "✿"
        }
      ],
      "required": [
        "map",
        "notice",
        "umbrella",
        "bakery",
        "poster"
      ],
      "puzzle": "route",
      "hint": [
        "Look for the closure notice and the entrance named on the poster.",
        "Canal Walk is closed; the garden asks volunteers to use Market Street.",
        "Choose Market Street, not the canal shortcut."
      ],
      "success": "They walk to the cleanup along Market Street, talking about small ambitions: a home full of plants, a book they might write, a city they want to keep kind."
    },
    {
      "title": "A Familiar Song",
      "subtitle": "A melody from the past brings hidden feelings to light.",
      "intro": "At the garden fundraiser, Theo plays a short tune on the old upright piano. Mira recognizes it from the community center where she learned to play as a child. The familiarity is shared history, not a secret family twist.",
      "spots": [
        {
          "id": "sheet",
          "label": "Sheet music",
          "x": 30,
          "y": 66,
          "text": "The first four notes are clearly written on the page: C · E · G · E. A penciled annotation says “repeat the last note softly.”",
          "clue": "Melody · C E G E",
          "icon": "♫"
        },
        {
          "id": "piano",
          "label": "Piano keys",
          "x": 65,
          "y": 75,
          "text": "The ivory keys are labeled for the fundraiser’s beginner activity. C, D, E, F, G are visible.",
          "clue": "Keyboard · C D E F G",
          "icon": "♬"
        },
        {
          "id": "program",
          "label": "Fundraiser program",
          "x": 79,
          "y": 35,
          "text": "The song is called “Sunday Window.” It was taught at the community center to anyone who wanted to learn.",
          "clue": "Program · Sunday Window",
          "icon": "▤"
        },
        {
          "id": "flower",
          "label": "Garden bouquet",
          "x": 12,
          "y": 55,
          "text": "Mira arranged wildflowers for the fundraiser. Theo thanks her for making the room feel welcoming.",
          "clue": "Flowers · Mira’s contribution",
          "icon": "✿"
        },
        {
          "id": "memory",
          "label": "Community photograph",
          "x": 46,
          "y": 36,
          "text": "An old photograph shows the community center’s open music class. Mira and Theo were both there at different times, years apart.",
          "clue": "Music class · shared place",
          "icon": "▧"
        }
      ],
      "required": [
        "sheet",
        "piano",
        "program",
        "flower",
        "memory"
      ],
      "puzzle": "melody",
      "hint": [
        "The sheet music tells you the notes.",
        "Follow the first four notes left to right; you can read them on the page.",
        "Play C → E → G → E."
      ],
      "success": "The familiar melody opens a conversation about the people who helped them grow up. Later, Theo asks whether Mira would like to meet for coffee—this time, on purpose."
    },
    {
      "title": "The Right Time",
      "subtitle": "A final choice changes everything.",
      "intro": "At sunset, they meet at the riverside terrace. No missing letter or coincidence needs explaining. They have spent time together, learned to listen, and can decide whether to see where this might go.",
      "spots": [
        {
          "id": "message",
          "label": "Theo’s message",
          "x": 23,
          "y": 68,
          "text": "“I enjoyed today. Would you like to meet again next weekend? No worries if you’re busy.” The invitation is clear and considerate.",
          "clue": "Invitation · next weekend",
          "icon": "✉"
        },
        {
          "id": "calendar",
          "label": "Mira’s calendar",
          "x": 49,
          "y": 75,
          "text": "Mira is free next Saturday after 4 PM. She also wants Sunday to herself. She can make a plan that respects both.",
          "clue": "Calendar · Saturday after 4",
          "icon": "▤"
        },
        {
          "id": "terrace",
          "label": "Riverside terrace",
          "x": 75,
          "y": 41,
          "text": "The terrace café closes at 7 PM on Saturdays. A 4:30 PM visit would leave time for a relaxed conversation.",
          "clue": "Terrace · closes 7 PM",
          "icon": "☕"
        },
        {
          "id": "lilacs",
          "label": "Garden lilacs",
          "x": 12,
          "y": 42,
          "text": "The lilacs are blooming again. Mira thinks about the pressed flower from the first day, and how much has changed since.",
          "clue": "Lilacs · a new season",
          "icon": "✿"
        },
        {
          "id": "note",
          "label": "Mira’s journal",
          "x": 68,
          "y": 68,
          "text": "“I like that he asks instead of assuming. I like that I can say what I want.” The next step belongs to both of them.",
          "clue": "Journal · mutual choice",
          "icon": "✎"
        }
      ],
      "required": [
        "message",
        "calendar",
        "terrace",
        "lilacs",
        "note"
      ],
      "puzzle": "final",
      "hint": [
        "This is a choice about how they move forward, not a test.",
        "Both options respect their wishes and lead to complete endings.",
        "Choose the ending you prefer; neither is wrong."
      ],
      "success": "Mira and Theo choose a future that begins with an honest conversation rather than an invented coincidence."
    }
  ]
};
