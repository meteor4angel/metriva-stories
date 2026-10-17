window.MIDNIGHT={
  "id": "midnight-train",
  "title": "The Midnight Train",
  "chapters": [
    {
      "title": "Carriage Four",
      "subtitle": "A passenger disappears. Her belongings do not.",
      "intro": "At 12:02 AM, the Nightingale Express jolts to a stop in the mountains. When it moves again, the woman in carriage four is gone. Conductor Elias Ward insists nobody occupied her compartment. You remember speaking to her beside the dining-car door.",
      "spots": [
        {
          "id": "ticket",
          "label": "Nora’s ticket",
          "icon": "▤",
          "x": 39,
          "y": 64,
          "text": "A valid ticket for the 11:30 departure reads: NORA BELL · CARRIAGE 4 · SEAT 4C. The conductor’s copy has a punched crescent at the top.",
          "clue": "Ticket · seat 4C"
        },
        {
          "id": "tag",
          "label": "Suitcase tag",
          "icon": "▣",
          "x": 58,
          "y": 90,
          "text": "A blue suitcase on the seat is tagged N. BELL / 4C. Its handle is still warm from being carried.",
          "clue": "Suitcase tag · 4C"
        },
        {
          "id": "chart",
          "label": "Compartment chart",
          "icon": "⌗",
          "x": 22,
          "y": 19,
          "text": "The carriage chart lists 4A: June P., 4B: Vacant, 4C: Nora Bell, 4D: Reserved for staff. Someone has crossed out 4C in pencil.",
          "clue": "Seat chart · 4C"
        },
        {
          "id": "coat",
          "label": "Abandoned coat",
          "icon": "♧",
          "x": 40,
          "y": 54,
          "text": "A damp coat hangs near seat 4C. In its pocket: a note, “Find the junction before 12:10. Do not trust the printed route.”",
          "clue": "Junction warning"
        },
        {
          "id": "ward",
          "label": "Talk to Ward",
          "icon": "☏",
          "x": 7,
          "y": 45,
          "text": "“I checked the manifest at departure,” Ward says. His eyes linger on the crossed-out name. “I cannot discuss the passenger’s assignment.”",
          "clue": "Ward’s guarded response"
        }
      ],
      "puzzle": "seat",
      "hint": [
        "Compare the passenger ticket, luggage tag, and seat chart.",
        "All three documents point to the same carriage and seat.",
        "Choose seat 4C."
      ],
      "success": "The documents agree: Nora Bell boarded and occupied 4C. Ward’s denial is deliberate, but why would he protect a missing passenger?",
      "required": [
        "ticket",
        "tag",
        "chart",
        "coat",
        "ward"
      ]
    },
    {
      "title": "The Dining Car",
      "subtitle": "The last ordinary minutes before midnight.",
      "intro": "June, the dining-car attendant, remembers Nora ordering tea. Her service records trace Nora’s movements in the minutes before the unscheduled stop.",
      "spots": [
        {
          "id": "tea",
          "label": "Tea receipt",
          "icon": "▤",
          "x": 36,
          "y": 81,
          "text": "11:42 PM — Nora orders peppermint tea. June remembers the blue coat and a folded map.",
          "clue": "Tea · 11:42"
        },
        {
          "id": "watch",
          "label": "Pocket watch",
          "icon": "◷",
          "x": 54,
          "y": 76,
          "text": "11:49 PM — Nora checks her gold pocket watch and leaves the dining car. June records the time beside Nora’s unfinished tea.",
          "clue": "Nora leaves · 11:49"
        },
        {
          "id": "water",
          "label": "Water receipt",
          "icon": "◈",
          "x": 53,
          "y": 87,
          "text": "11:54 PM — June delivers water to the engineer. She sees Nora walk toward carriage four afterward.",
          "clue": "Water · 11:54"
        },
        {
          "id": "journal",
          "label": "Service journal",
          "icon": "▤",
          "x": 12,
          "y": 84,
          "text": "The dining log has three lines: tea 11:42, watch 11:49, water 11:54. The kitchen timer was reset at 11:55.",
          "clue": "Dining service log"
        },
        {
          "id": "june",
          "label": "Talk to June",
          "icon": "☏",
          "x": 24,
          "y": 35,
          "text": "“She wasn’t frightened,” June says. “She asked whether Blackthorn Junction was still on the old line. I told her the express never stops there.”",
          "clue": "June’s testimony"
        }
      ],
      "puzzle": "timeline",
      "hint": [
        "Read the timestamps on all three dining-car records.",
        "The tea came first, then the watch, then the water.",
        "Order: tea 11:42 → watch 11:49 → water 11:54."
      ],
      "success": "Nora was seen at 11:54, only minutes before the stop. June’s testimony contradicts the official manifest and places Nora near carriage four.",
      "required": [
        "tea",
        "watch",
        "water",
        "journal",
        "june"
      ]
    },
    {
      "title": "The Unscheduled Stop",
      "subtitle": "One route. Two timetables. A station erased from the map.",
      "intro": "In the observation carriage, a route display flickers between the printed timetable and the train’s actual movement log. The mountain outside is dark except for one abandoned signal tower.",
      "spots": [
        {
          "id": "printed",
          "label": "Printed route map",
          "icon": "⌗",
          "x": 56,
          "y": 82,
          "text": "The advertised route goes Northbridge → Ash Vale → Briarford. No intermediate stop is listed.",
          "clue": "Published route"
        },
        {
          "id": "log",
          "label": "Engine movement log",
          "icon": "▤",
          "x": 88,
          "y": 83,
          "text": "The engine log reads: Northbridge 23:30; Ash Vale 23:48; BLK JCT 00:02; Briarford 00:41.",
          "clue": "Actual route log"
        },
        {
          "id": "mile",
          "label": "Route display",
          "icon": "⌁",
          "x": 75,
          "y": 14,
          "text": "The route display names Northbridge, Ash Vale, and Briarford. Its mileage scale puts Ash Vale at 18, an unnamed point at 26, and Briarford at 44. The engine log’s BLK JCT falls at that missing point.",
          "clue": "Junction mileposts"
        },
        {
          "id": "signal",
          "label": "Signal report",
          "icon": "◉",
          "x": 68,
          "y": 39,
          "text": "The signal record reports a red aspect at Blackthorn Junction at 00:02, lasting four minutes.",
          "clue": "Red signal · 00:02"
        },
        {
          "id": "tomas",
          "label": "Talk to Tomas",
          "icon": "☏",
          "x": 84,
          "y": 34,
          "text": "Engineer Tomas says, “Dispatch told me the signal was faulty. I stopped at the old junction because a red aspect is a red aspect.”",
          "clue": "Engineer’s account"
        }
      ],
      "puzzle": "station",
      "hint": [
        "The movement log abbreviates the missing stop.",
        "Match BLK JCT to the milepost chart.",
        "Choose Blackthorn Junction at 00:02."
      ],
      "success": "The express stopped at Blackthorn Junction at 12:02 AM. Nora had warned you to find that very junction.",
      "required": [
        "printed",
        "log",
        "mile",
        "signal",
        "tomas"
      ]
    },
    {
      "title": "The Baggage Car",
      "subtitle": "A freight transfer at the wrong hour.",
      "intro": "A loose crate knocks against the baggage-car wall. Its inspection files have been disguised as tools. Owen Hale, the traveler with an old railway key, knows who moved the missing case.",
      "spots": [
        {
          "id": "freight",
          "label": "Freight transfer slip",
          "icon": "▤",
          "x": 34,
          "y": 66,
          "text": "TRANSFER · BLACKTHORN JUNCTION · 00:07. Two sealed document cases were loaded onto a maintenance trolley.",
          "clue": "Transfer · 00:07"
        },
        {
          "id": "pocket",
          "label": "Damaged pocket watch",
          "icon": "◷",
          "x": 85,
          "y": 86,
          "text": "The traveler’s watch stopped at 00:07 after striking a metal rail. Its glass is cracked at the seven-minute mark.",
          "clue": "Watch stopped · 00:07"
        },
        {
          "id": "crate",
          "label": "Freight crate",
          "icon": "▣",
          "x": 63,
          "y": 49,
          "text": "A stencil reads BRIDGE INSPECTION FILES — RETURN TO DISPATCH. One document case is missing.",
          "clue": "Bridge inspection files"
        },
        {
          "id": "manifest",
          "label": "Cargo manifest",
          "icon": "▤",
          "x": 8,
          "y": 68,
          "text": "The manifest was altered from “Inspection records” to “Tools.” The overwritten ink has not dried fully.",
          "clue": "Altered cargo manifest"
        },
        {
          "id": "traveler",
          "label": "Talk to Owen",
          "icon": "☏",
          "x": 37,
          "y": 40,
          "text": "“My father inspected the Blackthorn bridge,” Owen says. “He kept copies because someone changed the safety report. Nora asked me for the signal-tower key.”",
          "clue": "Traveler’s testimony"
        }
      ],
      "puzzle": "time",
      "hint": [
        "Compare the transfer slip with the damaged watch.",
        "Both records show the same time after midnight.",
        "Choose 00:07 AM."
      ],
      "success": "The missing case left the baggage car at 12:07 AM. Owen gave Nora the tower key so she could protect his father’s original report.",
      "required": [
        "freight",
        "pocket",
        "crate",
        "manifest",
        "traveler"
      ]
    },
    {
      "title": "The Last Platform",
      "subtitle": "The truth waits behind an abandoned signal.",
      "intro": "The express reverses onto the junction siding. Inside the signal tower, Nora is trapped behind a jammed steel door. An approaching freight train is scheduled to cross the bridge in minutes.",
      "spots": [
        {
          "id": "diagram",
          "label": "Signal diagram",
          "icon": "⌗",
          "x": 72,
          "y": 30,
          "text": "The tower diagram marks three levers: 1 = siding points, 2 = bridge warning, 3 = main-line stop. The emergency instruction reads: STOP MAIN LINE, WARN BRIDGE, THEN ALIGN SIDING.",
          "clue": "Emergency signal instructions"
        },
        {
          "id": "lever",
          "label": "Lever cabinet",
          "icon": "▣",
          "x": 31,
          "y": 59,
          "text": "The brass levers are numbered 1, 2, 3. Their labels are legible: 1 SIDING, 2 BRIDGE WARNING, 3 MAIN-LINE STOP.",
          "clue": "Numbered signal levers"
        },
        {
          "id": "report",
          "label": "Inspection report",
          "icon": "▤",
          "x": 79,
          "y": 68,
          "text": "Behind a loose wall panel is the original inspection report: BRIDGE UNSAFE — CLOSE PENDING REPAIR. The public report was altered to “serviceable.”",
          "clue": "Original safety report"
        },
        {
          "id": "nora",
          "label": "Talk to Nora",
          "icon": "☏",
          "x": 93,
          "y": 43,
          "text": "Through the door Nora calls: “I came to recover the report. Ward knew I was undercover, but he didn’t know I’d left the train. Please stop the freight first!”",
          "clue": "Nora’s explanation"
        },
        {
          "id": "schedule",
          "label": "Freight timetable",
          "icon": "◷",
          "x": 17,
          "y": 85,
          "text": "A freight train is due to cross at 00:22. The emergency signals must be set before it reaches the bridge.",
          "clue": "Freight due · 00:22"
        }
      ],
      "puzzle": "signals",
      "hint": [
        "The emergency instruction states the safe order in words.",
        "Stop the main line first, warn the bridge second, align the siding last.",
        "Pull lever 3 → lever 2 → lever 1."
      ],
      "success": "The main line locks at danger. The freight train brakes before the bridge. Nora is freed, and the original safety report is delivered to railway investigators.",
      "required": [
        "diagram",
        "lever",
        "report",
        "nora",
        "schedule"
      ]
    }
  ]
};
