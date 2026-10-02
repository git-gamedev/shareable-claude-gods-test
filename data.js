/* ==========================================================================
   data.js (format 2): ALL content, text and tuning. engine.js, telemetry.js and app.js
   hold no gods, traits, questions, paths, stage lengths, UI strings, stopwords or weights.
   Load order: data.js, telemetry.js, engine.js, app.js. Must define: const DATA = {...} (plain JSON).
   On load the app runs validateData(DATA) and shows errors on screen (warnings go to the console).

   TOP LEVEL KEYS: format, ui, traits, paths, gods, questions, flow, split, config.

   traits: [{id, name, desc}]   >= 2 entries. id: short unique code (e.g. "O"). Used by god profiles,
     option weights, sliders, paths and behavior maps. Add one: list it here, add it to EVERY god's
     profile, then use it in option weights. Delete one: remove it from everywhere (the validator flags leftovers).

   paths: [{id, name, traits:[idA,idB], frPrompt}]   0 or more. After flow stage split.afterStage the path with
     the highest (normalized idA + idB) wins. name shows in the UI, frPrompt is that path's free-response question.
     No paths: set split:null, use no "@path" pools, and give every path-less run a prompt in ui.frFallback.

   gods: [{id, name, title, about, strengths:[text], flaw, tag, profile:{traitId:0..1}, statements:[text], refs:[text]}]
     >= 2 gods. profile needs a number for EVERY trait (only differences between gods matter; spread them out).
     statements: first-person lines for duels, strengths only, similar desirability (3+ recommended).
     refs: sample free-response answers in the god's voice (2+ per god; more = better matching).
     tag: noun phrase used as "You also carry <tag>".

   questions: [{id, pool, type, text, ...}]   ids unique. pool: "foundation", a path id, or any custom tag that
     a flow stage names. Questions are NEVER required to exist for any particular stage; the engine falls
     back to any unused question if a pool runs dry. Add/delete/rewrite freely; keep >= total flow count.
     type "choice": options:[{text, w:{traitId:signedNumber}}]
        - 6 to 25 options. The engine shows config.shown (aimed ones plus random ones), so a bigger pool = more variety.
        - w: usually integers -3..3; negatives allowed. Omitted trait = 0. Keep totals comparable across options.
        - Bad: one option, identical weights on all options, unknown trait ids (validator flags these).
        Example: {"id":"q_rain","pool":"foundation","type":"choice","text":"It starts to rain on your walk.",
                  "options":[{"text":"Keep walking, rain is fine","w":{"W":2,"R":1}},{"text":"Find shelter and read","w":{"D":2,"R":1}}, ...]}
     type "slider": slider:{left, right, leftTrait, rightTrait}. Position x in 0..1 adds 2*(1-x) to leftTrait and 2*x to rightTrait.
        Example: {"id":"s_alone","pool":"foundation","type":"slider","text":"Where do you recharge?",
                  "slider":{"left":"With people","right":"Alone","leftTrait":"S","rightTrait":"D"}}

   flow: ordered stages; quiz length = sum of counts.
     question stage: {name, pool, count, pick}
        pool: a tag | "@path" (the chosen path id) | "*" (any unused).  pick: "order" (file order) | "info" (the unused
        question that best separates the current top 3 gods, plus a bonus for under-measured traits).
        name may contain {path}.
     duel stage: {kind:"duel", name, count, gods, prompt}: forced choice among one statement from each of the top <gods> gods.
   split: {afterStage: flow index, method:"pathTraitPair"} or null.

   ui: every user-facing string. Templates use {name} placeholders (listed per key). Keys:
     title, subtitle, intro{traits,afterQ,paths,total}, begin, splitTitle, splitTraits, splitRoad, splitWhy{a,b}, walk,
     qLabel{n,total}, choose, confirmChoice, confirmSlider, frLabel{path}, frPlaceholder, submit, skip,
     strengths, flaw, secondaryHead, secondary{name,title,tag,god}, mapHead, mapHint, traitsHead{path},
     howHead, how{med,cert,changes,s1,afk,s2,mod}, copy, copied, copyFail, retake, fp{fp}, hint (keyboard hint).

   config (numbers unless noted):
     shown, aimed          options displayed / of those aimed at the current top 3 gods
     K                     softmax sharpness for trait-to-god matching
     duelWeight, frWeight  logit weight per duel vote / of free response
     coverageRange         a trait counts as fully measured once its (hi-lo) range reaches this
     noiseTiebreak         tiny random tiebreak
     behaviorWeight        scale of behavior->trait effect (keep << question weights of 1-3)
     behavior              [{feature, map:{traitId:coef}}]; feature: speed | hesitation | spread | certainty (each -1..1)
     consistency           {passes, minAnswers, topGods, strength, tolerance, floor}: answers that disagree with the leading gods more than
                           <tolerance> robust SDs (vs the other options of their question) get influence down to <floor>; passes:0 disables
     fr                    free-response grader: {stop:[words dropped], buckets (hash size), wCos, wSim, minTokens}
     telemetry (ms unless noted):
       idleCapMs, afkGapMs, afkRawMs   clamp per input gap / a gap this long flags AFK / wall clock past this flags AFK
       hoverCapMs                      max credit for one uninterrupted hover
       baseMs, msPerChar               expected reading time = baseMs + msPerChar * characters shown
       changeDebounceMs, changeCapLog  ignore re-selections faster than this (key repeat / double taps); cap on changes shown in the summary per answer
       confirmBaseMs                   expected time between choosing and pressing Confirm
       minMs, minHist, madFloor, priorSd   floor before logs; answers needed before using the user's own stats; scale floor and prior (log units)
       zClip, afkZ                     winsor limit of robust z; |z| above afkZ = outlier (neutral certainty, excluded from stats)
       minHoverMs                      hover needed to trust hover features (never on touch)
       b0,bSpeed,bConf,bHover,bEnt,bChange   logistic weights: slow answers, slow confirm, hover on chosen, scattered hover, changes
       cMin,cMax                       probability range given to the chosen option (always above all others)
       floor,prevBoost                 how leftover probability is spread (hover share + abandoned options get more)
       sliderBase                      fraction of a slider move kept at zero certainty
   Telemetry record given to answer(): {ms, rawMs, afk, hover:[ms per shown option], changes, prev:[abandoned option idx],
     modality:"mouse"|"touch"|"pen"|"keyboard", confirmMs, firstMs, moves}.
   HOW CERTAINTY WORKS: after every answer, ALL answers are re-scored from the user's current median/MAD (two-pass outlier
   rejection, winsorized z). The chosen option gets probability c; the others share 1-c by hover share and abandonment.
   ========================================================================== */
const DATA={
 "format": 2,
 "ui": {"title":"Which God Are You?","subtitle":"Deep Cuts Edition","intro":"Every answer moves {traits} personality traits. After {afterQ} questions your traits choose one of {paths} roads, and the rest follows that road: {total} questions, then a free response. The quiz also notices how you answer (time, hover, hesitation, changed answers), re-judges how sure each answer was as it learns your rhythm, and uses that lightly. Nothing leaves your device.","begin":"Begin","splitTitle":"The Road Splits","splitTraits":"Your traits so far:","splitRoad":"Your road","splitWhy":"Chosen by your {a} and {b} scores, not by any single answer.","walk":"Walk on","qLabel":"Question {n} of {total}","choose":"Choose an answer","confirmChoice":"Confirm answer","confirmSlider":"Confirm","frLabel":"Final question · {path} (free response)","frPlaceholder":"Write a few sentences...","submit":"Submit","skip":"Skip","strengths":"Divine Strengths","flaw":"Fatal Flaw","secondaryHead":"Your Secondary Pull","secondary":"<b>{name}</b>, {title}. You also carry {tag}, which is why you aren't a pure {god}.","mapHead":"Your Final Map","mapHint":"(hover or tap a god)","traitsHead":"Your Traits · {path}","howHead":"How You Answered","how":"Median {med}s per answer, average certainty {cert}, {changes} changed answer(s), {afk} idle answer(s) ignored, input: {mod}.","copy":"Copy session data (JSON)","copied":"Copied","copyFail":"Copy failed","retake":"Retake","fp":"Free-response fingerprint: {fp}","hint":"Keys: 1-9 pick an option, Enter confirms."},
 "traits": [
  {
   "id": "O",
   "name": "Order",
   "desc": "Craft, structure, finishing things properly"
  },
  {
   "id": "S",
   "name": "Social",
   "desc": "Energy from people and company"
  },
  {
   "id": "W",
   "name": "Wild",
   "desc": "Spontaneity, instinct, open air"
  },
  {
   "id": "D",
   "name": "Depth",
   "desc": "Inner life, introspection, mystery"
  },
  {
   "id": "V",
   "name": "Drive",
   "desc": "Competition, ambition, persistence"
  },
  {
   "id": "C",
   "name": "Care",
   "desc": "Tending to others, warmth"
  },
  {
   "id": "J",
   "name": "Justice",
   "desc": "Candor, fairness, calling things out"
  },
  {
   "id": "R",
   "name": "Calm",
   "desc": "Rest, steadiness, low urgency"
  }
 ],
 "paths": [
  {
   "id": "F",
   "name": "The Forge Road",
   "traits": [
    "O",
    "V"
   ],
   "frPrompt": "A bridge you built is failing and the whole town is watching. In a few sentences, say exactly what you do and why."
  },
  {
   "id": "H",
   "name": "The Hearth Road",
   "traits": [
    "C",
    "S"
   ],
   "frPrompt": "A stranger knocks at your door at night, lost and frightened. In a few sentences, say exactly what you do and why."
  },
  {
   "id": "W",
   "name": "The Wild Road",
   "traits": [
    "W",
    "J"
   ],
   "frPrompt": "An unfair rule threatens your village and you could break it. In a few sentences, say exactly what you do and why."
  },
  {
   "id": "N",
   "name": "The Night Road",
   "traits": [
    "D",
    "R"
   ],
   "frPrompt": "You wake at midnight to a knock, and no one is there. In a few sentences, say exactly what you do and why."
  }
 ],
 "gods": [
  {
   "id": "he",
   "name": "Hephaestus",
   "title": "God of the Forge",
   "about": "The one Olympian who works with his hands. Thrown from Olympus, he still built the gods' palaces, thrones, and weapons. You make real things out of stubbornness and skill.",
   "strengths": [
    "Craft and engineering",
    "Patience with hard problems",
    "Turning rough ideas into working objects"
   ],
   "flaw": "Perfectionism. You'd rebuild it a fifth time before showing anyone an unfinished version.",
   "tag": "a maker's patience",
   "profile": {
    "O": 1,
    "S": 0.2222222222222222,
    "W": 0.3333333333333333,
    "D": 0.5555555555555556,
    "V": 0.6666666666666666,
    "C": 0.4444444444444444,
    "J": 0.2222222222222222,
    "R": 0.3333333333333333
   },
   "statements": [
    "I'd rather build it than talk about it",
    "I can stay with a stubborn problem for days",
    "Rough sketches become working things in my hands"
   ],
   "refs": [
    "I study the wall, find the weak joint, and build a lever and a ramp with my own hands until it is shaped and strong",
    "I look at the rubble like a problem to build my way out of, and start making tools",
    "I fix the damage with my own hands, rebuild what was broken, and put it back sturdier than before",
    "I do not argue, I repair what I can, and rebuild trust and things by hand"
   ]
  },
  {
   "id": "at",
   "name": "Athena",
   "title": "Goddess of Strategy",
   "about": "Wisdom with a spear. She wins by planning, not by brute force, and she's the patron of clever people who actually follow through.",
   "strengths": [
    "Strategy and foresight",
    "Pattern recognition",
    "Calm under pressure"
   ],
   "flaw": "Overthinking, and the belief that you can out-plan everything.",
   "tag": "a strategist's eye",
   "profile": {
    "O": 0.8888888888888888,
    "S": 0.5555555555555556,
    "W": 0.1111111111111111,
    "D": 0.7777777777777778,
    "V": 0.6666666666666666,
    "C": 0.3333333333333333,
    "J": 0.5555555555555556,
    "R": 0.5555555555555556
   },
   "statements": [
    "I see the shape of a situation before others do",
    "I notice the pattern under the noise",
    "I stay level when everyone else rattles"
   ],
   "refs": [
    "I plan carefully, study the pattern of the rubble, choose the strategy with the best odds, and lead everyone through step by step",
    "First I think, then I choose the smartest plan and direct the others",
    "I work out why they lied, plan my next move carefully, and make sure it cannot happen again",
    "I think through the lie and plan the best response before acting"
   ]
  },
  {
   "id": "ap",
   "name": "Apollo",
   "title": "God of Music, Prophecy and Healing",
   "about": "Light, art, and clear sight. He stands for beauty done with discipline, and people trust him to say where things are heading.",
   "strengths": [
    "Artistry and discipline",
    "Insight into what's coming",
    "A healing presence"
   ],
   "flaw": "Pride in your own brilliance, and a short fuse when it's questioned.",
   "tag": "an artist's polish",
   "profile": {
    "O": 0.6666666666666666,
    "S": 0.7777777777777778,
    "W": 0.4444444444444444,
    "D": 0.6666666666666666,
    "V": 0.4444444444444444,
    "C": 0.6666666666666666,
    "J": 0.3333333333333333,
    "R": 0.4444444444444444
   },
   "statements": [
    "I do beautiful things with discipline",
    "People ask me where things are heading",
    "My presence tends to steady and mend people"
   ],
   "refs": [
    "I sing to steady the group, read the signs of what comes next, heal anyone hurt, and clear a beautiful path",
    "I stay clear-headed, sing to keep spirits up, and see what to do next",
    "I tell them plainly what I see, forgive when they heal, and move on with my head high and my pride intact",
    "I speak plainly and clearly, then heal and move forward with grace"
   ]
  },
  {
   "id": "hm",
   "name": "Hermes",
   "title": "God of Messengers and Tricksters",
   "about": "Fast, clever, always between places. He found the loophole before he was a day old, and he guides travelers and thieves alike.",
   "strengths": [
    "Quick wit and adaptability",
    "Connecting people and ideas",
    "Finding the shortcut"
   ],
   "flaw": "Restlessness, and bending the truth to stay one step ahead.",
   "tag": "a trickster's speed",
   "profile": {
    "O": 0.2222222222222222,
    "S": 1,
    "W": 0.8888888888888888,
    "D": 0.1111111111111111,
    "V": 0.6666666666666666,
    "C": 0.2222222222222222,
    "J": 0.2222222222222222,
    "R": 0.1111111111111111
   },
   "statements": [
    "I adapt faster than the situation changes",
    "I'm the one who introduces people to each other",
    "I can always find the shortcut"
   ],
   "refs": [
    "I find a clever shortcut, talk fast, trade favors, carry word to others, and slip around the blockage before anyone notices",
    "I find a way around fast, talk to whoever I need, and keep moving",
    "I use a clever trick to turn the lie around, talk my way out, and get the loss back with a smile",
    "I turn it around, get the truth out of them, and use what I learned"
   ]
  },
  {
   "id": "hs",
   "name": "Hestia",
   "title": "Goddess of the Hearth",
   "about": "The oldest Olympian, who gave up her throne to keep the peace. Every home's fire was hers. She holds things together without needing credit.",
   "strengths": [
    "Steadiness",
    "Making people feel safe",
    "Keeping peace under pressure"
   ],
   "flaw": "Avoiding conflict so long that problems grow quietly.",
   "tag": "a hearth-keeper's warmth",
   "profile": {
    "O": 0.6666666666666666,
    "S": 0.5555555555555556,
    "W": 0.1111111111111111,
    "D": 0.4444444444444444,
    "V": 0.1111111111111111,
    "C": 1,
    "J": 0.2222222222222222,
    "R": 0.8888888888888888
   },
   "statements": [
    "People relax when I'm in the room",
    "I make a place feel safe",
    "I keep the peace when it's tense"
   ],
   "refs": [
    "I stay calm, light a fire, feed everyone, keep the group together and safe, and wait patiently until help comes",
    "I make everyone comfortable and calm, and we wait together until it is safe",
    "I keep the peace, forgive quietly, and keep the home warm so everyone can stay together",
    "I keep peace, forgive quietly, and hold things together at home"
   ]
  },
  {
   "id": "nm",
   "name": "Nemesis",
   "title": "Goddess of Balance and Retribution",
   "about": "She sees that good and evil get paid back in kind, and she particularly deals with arrogance. Fairness isn't a preference for you, it's a law.",
   "strengths": [
    "A sharp sense of justice",
    "Seeing through pride",
    "Holding the line when others look away"
   ],
   "flaw": "Grudges. You can keep a ledger open for years.",
   "tag": "a sense of justice",
   "profile": {
    "O": 0.7777777777777778,
    "S": 0.1111111111111111,
    "W": 0.1111111111111111,
    "D": 0.6666666666666666,
    "V": 0.5555555555555556,
    "C": 0.3333333333333333,
    "J": 1,
    "R": 0.3333333333333333
   },
   "statements": [
    "I can't ignore it when something is unfair",
    "I see through anyone puffed up with pride",
    "I hold the line when others look away"
   ],
   "refs": [
    "I weigh what is fair, make sure whoever caused this pays the price, and hold everyone to what they owe",
    "Somebody is responsible and it is only fair they make it right",
    "I keep a careful account of what I am owed, and make sure they pay back exactly what they cost me",
    "They owe me and I will make sure it is repaid, it is only fair"
   ]
  },
  {
   "id": "mo",
   "name": "Momus",
   "title": "God of Satire and Criticism",
   "about": "A child of Night who mocked even the gods, including Zeus's own creations. Sharp, funny, and usually right about the flaw in the design.",
   "strengths": [
    "Spotting the flaw nobody else will say",
    "Humor as a tool",
    "Zero fear of authority"
   ],
   "flaw": "A critique that costs you your seat at the table. Momus was exiled from Olympus for it.",
   "tag": "a satirist's bite",
   "profile": {
    "O": 0.2222222222222222,
    "S": 0.8888888888888888,
    "W": 0.6666666666666666,
    "D": 0.3333333333333333,
    "V": 0.4444444444444444,
    "C": 0.1111111111111111,
    "J": 1,
    "R": 0.1111111111111111
   },
   "statements": [
    "I say the flaw out loud when no one else will",
    "Humor is how I make my point",
    "Authority doesn't scare me"
   ],
   "refs": [
    "I laugh at the absurd design of the road, point out exactly who built it badly, and say the blunt truth",
    "The road was badly made and I will say so, loudly and with a joke",
    "I mock them openly, laugh at the lie, and say out loud how transparent and ridiculous it was",
    "I call it out, mock the excuse, and say the blunt truth out loud"
   ]
  },
  {
   "id": "hy",
   "name": "Hypnos",
   "title": "God of Sleep",
   "about": "Twin of Death and son of Night. Even Zeus couldn't resist him. He gives the world its rest, and he does it softly.",
   "strengths": [
    "Calm that spreads to others",
    "Knowing when to power down",
    "Quiet influence"
   ],
   "flaw": "Checking out when things get hard. Rest is not always the answer.",
   "tag": "a rest-giver's calm",
   "profile": {
    "O": 0.2222222222222222,
    "S": 0.3333333333333333,
    "W": 0.2222222222222222,
    "D": 0.4444444444444444,
    "V": 0.1111111111111111,
    "C": 0.5555555555555556,
    "J": 0.1111111111111111,
    "R": 1
   },
   "statements": [
    "My calm is contagious",
    "I know when it's time to power down",
    "I influence people without raising my voice"
   ],
   "refs": [
    "I rest, close my eyes, let everyone sleep soundly until morning, and trust the problem will look different tomorrow",
    "I lie down and sleep, because tired people choose badly",
    "I sleep on it, let it fade, and let tomorrow's rest soften the anger until it does not matter",
    "I sleep on it and let the anger fade"
   ]
  },
  {
   "id": "mp",
   "name": "Morpheus",
   "title": "God of Dreams",
   "about": "The shaper of the forms people see in sleep. He can appear as anyone, in any shape, and is believed to deliver messages in dreams.",
   "strengths": [
    "Imagination",
    "Reading people deeply",
    "Making the abstract vivid"
   ],
   "flaw": "Living in your head. The dream feels better than the day.",
   "tag": "a dreamer's imagination",
   "profile": {
    "O": 0.1111111111111111,
    "S": 0.4444444444444444,
    "W": 0.6666666666666666,
    "D": 0.8888888888888888,
    "V": 0.1111111111111111,
    "C": 0.5555555555555556,
    "J": 0.1111111111111111,
    "R": 0.7777777777777778
   },
   "statements": [
    "My imagination is vivid and strange",
    "I read people very deeply",
    "I can make an abstract idea feel real"
   ],
   "refs": [
    "I imagine the landslide as a dream, shape it into something else, and picture the road home until it appears",
    "I close my eyes and imagine another road, and the way opens in my mind",
    "I replay it in my mind like a dream, picture their reasons, and imagine another way it could have gone",
    "I replay it in my head and imagine how it could have gone"
   ]
  },
  {
   "id": "tn",
   "name": "Thanatos",
   "title": "God of Peaceful Death",
   "about": "Not a villain. He is gentle, inevitable, and honest. He represents endings that come without cruelty, and he's comfortable with what others avoid.",
   "strengths": [
    "Calm about hard truths",
    "Comfort with endings",
    "Steady presence when things are heavy"
   ],
   "flaw": "Emotional distance. You can go cold to avoid being swallowed.",
   "tag": "a calm about endings",
   "profile": {
    "O": 0.6666666666666666,
    "S": 0.1111111111111111,
    "W": 0.1111111111111111,
    "D": 0.8888888888888888,
    "V": 0.2222222222222222,
    "C": 0.4444444444444444,
    "J": 0.6666666666666666,
    "R": 0.5555555555555556
   },
   "statements": [
    "I can say hard truths without flinching",
    "I'm at ease with things ending",
    "People lean on me when everything feels heavy"
   ],
   "refs": [
    "I accept that this is an ending, stay quiet and peaceful, and calmly face what cannot be changed",
    "Some things end, and I sit with that calmly instead of fighting it",
    "I accept that trust has ended, stay quiet and calm, and let the friendship die peacefully without cruelty",
    "I accept that this trust is over, calmly and without drama"
   ]
  },
  {
   "id": "ty",
   "name": "Tyche",
   "title": "Goddess of Fortune",
   "about": "She steered the fate of cities and carried a cornucopia and a rudder. Chance follows her, and she thrives where plans fall short.",
   "strengths": [
    "Seizing the opening",
    "Comfort with uncertainty",
    "Resilience when luck turns"
   ],
   "flaw": "Trusting luck over effort, until it runs out.",
   "tag": "a gambler's nerve",
   "profile": {
    "O": 0.1111111111111111,
    "S": 0.8888888888888888,
    "W": 0.6666666666666666,
    "D": 0.1111111111111111,
    "V": 0.7777777777777778,
    "C": 0.2222222222222222,
    "J": 0.1111111111111111,
    "R": 0.3333333333333333
   },
   "statements": [
    "I jump when an opening appears",
    "Uncertainty doesn't bother me",
    "I bounce back when things go wrong"
   ],
   "refs": [
    "I trust my luck, flip a coin, take the chance that seems most fortunate, and bet on a lucky break",
    "I trust luck and take the first lucky opening that shows up",
    "I shrug it off as bad luck, take a chance on someone new, and bet that fortune turns",
    "I shrug, take the chance on someone new, and trust fortune"
   ]
  },
  {
   "id": "nr",
   "name": "Nereus",
   "title": "The Old Man of the Sea",
   "about": "An ancient, honest sea god who could foretell the future and change shape. He told the truth, but only if you caught him and held on.",
   "strengths": [
    "Honesty with depth",
    "Prophetic sense",
    "Adapting to any situation"
   ],
   "flaw": "Slipping away the moment you're pressed.",
   "tag": "a shapeshifter's depth",
   "profile": {
    "O": 0.4444444444444444,
    "S": 0.5555555555555556,
    "W": 0.7777777777777778,
    "D": 0.6666666666666666,
    "V": 0.3333333333333333,
    "C": 0.4444444444444444,
    "J": 0.8888888888888888,
    "R": 0.4444444444444444
   },
   "statements": [
    "I'm honest in a way that goes deep",
    "I often sense what's coming",
    "I fit myself to any circumstance"
   ],
   "refs": [
    "I read the tide and the signs, tell the honest truth about the odds, and change my shape to fit the situation",
    "I tell everyone the honest truth about the odds and adapt as it changes",
    "I ask for the honest truth, hold them until they answer, and then adapt to what I learn",
    "I confront them honestly and say what I see, then change course"
   ]
  },
  {
   "id": "pn",
   "name": "Pan",
   "title": "God of the Wild and Shepherds",
   "about": "Goat-legged, pipe-playing, and happiest outdoors. Gut instinct, music, and open hills. His sudden shout gave us the word panic.",
   "strengths": [
    "Instinct",
    "Joy in the moment",
    "Closeness to nature and music"
   ],
   "flaw": "Impulsiveness. You follow the wild thing before checking where it goes.",
   "tag": "a wild streak",
   "profile": {
    "O": 0.1111111111111111,
    "S": 0.4444444444444444,
    "W": 1,
    "D": 0.3333333333333333,
    "V": 0.3333333333333333,
    "C": 0.5555555555555556,
    "J": 0.1111111111111111,
    "R": 0.6666666666666666
   },
   "statements": [
    "I trust my gut first",
    "I find real joy in the passing moment",
    "I feel most myself in open country with music"
   ],
   "refs": [
    "I follow my instincts into the wild hills, play a tune, climb over and run free through the trees",
    "I go by feel, wander off into the hills, and enjoy the walk",
    "I walk out into the wild hills, play music, shout it out, and let the anger run free",
    "I go out walking in the wild, play music, and shake it off"
   ]
  },
  {
   "id": "ir",
   "name": "Iris",
   "title": "Goddess of Rainbows and Messages",
   "about": "She carried messages between gods and mortals on a rainbow bridge, especially for Hera. You're the connection between people who couldn't reach each other.",
   "strengths": [
    "Bridging people",
    "Delivering hard messages kindly",
    "Reliability"
   ],
   "flaw": "Living in the middle. You carry everyone's words and lose your own.",
   "tag": "a bridge-builder's tact",
   "profile": {
    "O": 0.6666666666666666,
    "S": 0.8888888888888888,
    "W": 0.2222222222222222,
    "D": 0.3333333333333333,
    "V": 0.2222222222222222,
    "C": 1,
    "J": 0.3333333333333333,
    "R": 0.5555555555555556
   },
   "statements": [
    "I'm the link between people who can't reach each other",
    "I can deliver bad news gently",
    "People rely on me to show up"
   ],
   "refs": [
    "I send word to friends on both sides, build a bridge of messages, and connect the people who can help",
    "I get word to the people on the other side and connect everyone",
    "I carry my message to both of us, talk it through kindly, and rebuild the bridge between us",
    "I carry the message to everyone it concerns and reconnect people"
   ]
  },
  {
   "id": "nk",
   "name": "Nike",
   "title": "Goddess of Victory",
   "about": "Winged, tireless, and usually at Athena's side. She turns effort into wins, and she gives the glory only to those who go all in.",
   "strengths": [
    "Drive",
    "Finishing strong",
    "Rallying others"
   ],
   "flaw": "Needing the win. Rest feels like losing.",
   "tag": "a champion's drive",
   "profile": {
    "O": 0.6666666666666666,
    "S": 0.6666666666666666,
    "W": 0.4444444444444444,
    "D": 0.2222222222222222,
    "V": 1,
    "C": 0.3333333333333333,
    "J": 0.2222222222222222,
    "R": 0.1111111111111111
   },
   "statements": [
    "I'm relentless once I commit",
    "I finish things strongly",
    "I get a team believing it can win"
   ],
   "refs": [
    "I charge at the rocks with determination, never give up, push through to victory, and win the race home",
    "I will not quit, I push until we have won",
    "I refuse to be beaten, pour the hurt into effort, and win back more than I lost",
    "I get back up, throw myself into work, and win anyway"
   ]
  },
  {
   "id": "ac",
   "name": "Asclepius",
   "title": "God of Medicine",
   "about": "Born of a god and a mortal, he learned healing so well he began to raise the dead, which got him struck down by Zeus. His staff is still the symbol of medicine.",
   "strengths": [
    "Healing and repair",
    "Compassion with skill",
    "Refusing to give up on people"
   ],
   "flaw": "Crossing a line to save someone. You'll break the rules for the people you can't let go.",
   "tag": "a healer's compassion",
   "profile": {
    "O": 0.6666666666666666,
    "S": 0.5555555555555556,
    "W": 0.2222222222222222,
    "D": 0.4444444444444444,
    "V": 0.5555555555555556,
    "C": 1,
    "J": 0.5555555555555556,
    "R": 0.2222222222222222
   },
   "statements": [
    "I'm drawn to repair what's damaged",
    "I pair kindness with real skill",
    "I don't give up on people others have written off"
   ],
   "refs": [
    "I tend the injured first, bandage wounds, find remedies and healing herbs, and refuse to leave anyone behind",
    "I check who is hurt first and care for them before anything else",
    "I tend my own wound, care for the others hurt, and forgive because I will not give up on people",
    "I help those hurt by it, including myself, and mend what I can"
   ]
  },
  {
   "id": "er",
   "name": "Eris",
   "title": "Goddess of Strife",
   "about": "Daughter of Night. One golden apple, thrown into a wedding feast, set off the Trojan War. Discord isn't always destruction; sometimes it's the push that gets things moving.",
   "strengths": [
    "Sparking change",
    "Not scared of conflict",
    "Creative disruption"
   ],
   "flaw": "Stirring the pot for the thrill of it, and then watching it boil over.",
   "tag": "a disruptor's spark",
   "profile": {
    "O": 0.1111111111111111,
    "S": 0.7777777777777778,
    "W": 0.7777777777777778,
    "D": 0.2222222222222222,
    "V": 0.7777777777777778,
    "C": 0.1111111111111111,
    "J": 0.7777777777777778,
    "R": 0
   },
   "statements": [
    "I'm the spark that gets stagnant things moving",
    "Conflict doesn't scare me",
    "I disrupt things creatively"
   ],
   "refs": [
    "I stir up the crowd, start an argument about who is at fault, and let the chaos break the blockage open",
    "I shake things up with a fight and see what breaks loose",
    "I stir up trouble, call them out publicly, and watch the argument break everything open",
    "I make a scene, stir the whole crowd up, and make them squirm"
   ]
  },
  {
   "id": "ch",
   "name": "Chronos",
   "title": "God of Time",
   "about": "The personification of time itself. He does not rush and he does not stop, and everything measures itself against him.",
   "strengths": [
    "Patience and long-term vision",
    "Timing",
    "Knowing what lasts"
   ],
   "flaw": "Anxiety about the clock. Every hour spent is an hour gone.",
   "tag": "a sense of timing",
   "profile": {
    "O": 0.8888888888888888,
    "S": 0.2222222222222222,
    "W": 0.2222222222222222,
    "D": 0.8888888888888888,
    "V": 0.3333333333333333,
    "C": 0.3333333333333333,
    "J": 0.4444444444444444,
    "R": 0.7777777777777778
   },
   "statements": [
    "I'm patient on a long horizon",
    "My timing is usually right",
    "I can tell what will last"
   ],
   "refs": [
    "I wait and measure the hours, patient because time wears down every wall, and move at exactly the right moment",
    "I am patient, because the rocks will wear down in time",
    "I wait patiently, let time reveal the truth, and act only at exactly the right moment",
    "I wait, and let time show what is true"
   ]
  },
  {
   "id": "ny",
   "name": "Nyx",
   "title": "Goddess of Night",
   "about": "Primordial and feared even by Zeus. Mother of Sleep, Death, Dreams, Strife, and Nemesis. She is the dark where everything starts.",
   "strengths": [
    "Depth",
    "Quiet authority",
    "Mastery of what's unseen"
   ],
   "flaw": "Hiding in the dark. Mystery can become isolation.",
   "tag": "a depth of shadow",
   "profile": {
    "O": 0.5555555555555556,
    "S": 0.1111111111111111,
    "W": 0.2222222222222222,
    "D": 1,
    "V": 0.5555555555555556,
    "C": 0.1111111111111111,
    "J": 0.4444444444444444,
    "R": 0.7777777777777778
   },
   "statements": [
    "I have a depth people sense right away",
    "I have a quiet authority",
    "I'm comfortable with what's unseen"
   ],
   "refs": [
    "I wait for dark, move unseen through the shadows, and slip past in silence while no one is watching",
    "I wait for night and slip by in the dark without being seen",
    "I withdraw into the dark, say nothing, and quietly decide in silence what comes next",
    "I withdraw into the quiet dark and say nothing, but I do not forget"
   ]
  },
  {
   "id": "ar",
   "name": "Aristaeus",
   "title": "God of Beekeeping and Rural Crafts",
   "about": "He taught people to keep bees, make cheese, and grow olives. Practical, quiet, and generous with knowledge, but history forgot to thank him.",
   "strengths": [
    "Practical skill",
    "Teaching others",
    "Patience with slow, steady work"
   ],
   "flaw": "Resentment when the work goes unthanked.",
   "tag": "a gardener's patience",
   "profile": {
    "O": 0.8888888888888888,
    "S": 0.4444444444444444,
    "W": 0.3333333333333333,
    "D": 0.3333333333333333,
    "V": 0.2222222222222222,
    "C": 0.6666666666666666,
    "J": 0.2222222222222222,
    "R": 0.8888888888888888
   },
   "statements": [
    "I'm good with practical, useful skills",
    "I love teaching what I know",
    "I can keep at slow, steady work"
   ],
   "refs": [
    "I gather what the land offers, share bread and honey, work slowly and practically with simple tools to clear the road",
    "I work with simple tools, share food, and take it slow and steady",
    "I go back to my work, keep helping others anyway, and resent that nobody thanked me",
    "I go back to my work, teach others what I learned, and carry on steadily"
   ]
  }
 ],
 "questions": [
  {
   "id": "f1",
   "pool": "foundation",
   "type": "choice",
   "text": "You arrive somewhere new with a free afternoon.",
   "options": [
    {
     "text": "Walk until something interesting finds me",
     "w": {
      "W": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Find the oldest building and read every plaque",
     "w": {
      "D": 1.9,
      "O": 1.1
     }
    },
    {
     "text": "Ask a local where they eat and tag along",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Plan a route, then follow it exactly",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Sit in a quiet cafe and watch people",
     "w": {
      "D": 0.9,
      "R": 1.7
     }
    },
    {
     "text": "Race someone up the nearest hill",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "Check on anyone who looks lost",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Notice what is unfair about how the place is run",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    }
   ]
  },
  {
   "id": "f2",
   "pool": "foundation",
   "type": "choice",
   "text": "A friend shows you a project they are proud of, and you spot a flaw.",
   "options": [
    {
     "text": "Tell them plainly, kindly, right now",
     "w": {
      "J": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Praise the effort first, flaw later if asked",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Quietly work out how I would fix it, and say nothing",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Ask questions until they find it themselves",
     "w": {
      "D": 1.9,
      "J": 1.0
     }
    },
    {
     "text": "Say it is great and go find snacks",
     "w": {
      "S": 1.0,
      "R": 1.7
     }
    },
    {
     "text": "Challenge them to make the next one even better",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    },
    {
     "text": "Offer to rebuild that part together this weekend",
     "w": {
      "O": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Point it out loudly so everyone benefits",
     "w": {
      "J": 2.0,
      "W": 1.0
     }
    }
   ]
  },
  {
   "id": "f3",
   "pool": "foundation",
   "type": "choice",
   "text": "Your plans for the evening fall through.",
   "options": [
    {
     "text": "Call everyone, I will host something",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Good. A whole evening with no schedule",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Go outside and see what the evening offers",
     "w": {
      "W": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Start the project I keep putting off",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Practice something until I am better at it",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    },
    {
     "text": "Cook for whoever shows up",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Journal or stare at the ceiling and think",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "Dig into a matter I think someone got away with",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    }
   ]
  },
  {
   "id": "f4",
   "pool": "foundation",
   "type": "choice",
   "text": "Which problem would you most want to be handed?",
   "options": [
    {
     "text": "A broken machine nobody can fix",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "A feud between two people I love",
     "w": {
      "C": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "A trail with no map",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "A mystery with half the pieces missing",
     "w": {
      "D": 1.9,
      "O": 1.1
     }
    },
    {
     "text": "A race against the best in the field",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    },
    {
     "text": "A crowd that needs rallying",
     "w": {
      "S": 2.0,
      "V": 1.1
     }
    },
    {
     "text": "A rule that harms the people it claims to protect",
     "w": {
      "J": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "A tense day that needs someone steady",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    }
   ]
  },
  {
   "id": "f5",
   "pool": "foundation",
   "type": "choice",
   "text": "Someone cuts in line ahead of you.",
   "options": [
    {
     "text": "Speak up, calmly but clearly",
     "w": {
      "J": 2.0,
      "R": 0.9
     }
    },
    {
     "text": "Let it go, it is not worth the energy",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Make a joke so everyone relaxes",
     "w": {
      "S": 2.0,
      "R": 0.9
     }
    },
    {
     "text": "Use the wait to think things through",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "Check whether they have a good reason to hurry",
     "w": {
      "C": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "Note it, and make sure I am first again",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    },
    {
     "text": "Chat with the person behind me about it",
     "w": {
      "S": 2.0,
      "J": 1.0
     }
    },
    {
     "text": "Step out and take another route",
     "w": {
      "W": 2.1,
      "R": 0.9
     }
    }
   ]
  },
  {
   "id": "f6",
   "pool": "foundation",
   "type": "choice",
   "text": "What does a good day end with?",
   "options": [
    {
     "text": "Something finished, labeled, and put away",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "A full table and loud laughter",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Dirt on my boots and no idea where I have been",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "A personal best",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    },
    {
     "text": "A quiet hour under the stars",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "Knowing someone slept easier because of me",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Having said the true thing out loud",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "Nothing at all left to do",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    }
   ]
  },
  {
   "id": "sl1",
   "pool": "foundation",
   "type": "slider",
   "text": "How do you handle a plan?",
   "slider": {
    "left": "Detail it first",
    "right": "Improvise it",
    "leftTrait": "O",
    "rightTrait": "W"
   }
  },
  {
   "id": "sl2",
   "pool": "foundation",
   "type": "slider",
   "text": "When you disagree with a group...",
   "slider": {
    "left": "Speak up now",
    "right": "Keep the peace",
    "leftTrait": "J",
    "rightTrait": "R"
   }
  },
  {
   "id": "F1",
   "pool": "F",
   "type": "choice",
   "text": "Your workshop is a mess and a deadline is close.",
   "options": [
    {
     "text": "Clear the bench first; I work clean",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Work through the mess; I know where everything is",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "Ask a friend to help sort it out",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Put on a playlist and let the work find its shape",
     "w": {
      "W": 1.0,
      "D": 1.9
     }
    },
    {
     "text": "Cut what does not matter and ship the rest",
     "w": {
      "O": 1.1,
      "V": 2.2
     }
    },
    {
     "text": "Take a breath and do one thing at once",
     "w": {
      "R": 1.7,
      "O": 1.1
     }
    },
    {
     "text": "Warn the client the date is unrealistic",
     "w": {
      "J": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Turn the mess itself into the design",
     "w": {
      "D": 0.9,
      "W": 2.1
     }
    }
   ]
  },
  {
   "id": "F2",
   "pool": "F",
   "type": "choice",
   "text": "Your rival just beat your record.",
   "options": [
    {
     "text": "Study exactly how they did it",
     "w": {
      "D": 1.9,
      "V": 1.1
     }
    },
    {
     "text": "Congratulate them, then train harder",
     "w": {
      "S": 1.0,
      "V": 2.2
     }
    },
    {
     "text": "Shrug; records come and go",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "Check that it was done fairly",
     "w": {
      "J": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "Ask them to train with me",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Rebuild my method piece by piece",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Challenge them to a rematch on rougher ground",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Make sure my team celebrates anyway",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    }
   ]
  },
  {
   "id": "F3",
   "pool": "F",
   "type": "choice",
   "text": "You inherit someone else's unfinished project.",
   "options": [
    {
     "text": "Read every line before touching it",
     "w": {
      "D": 1.9,
      "O": 1.1
     }
    },
    {
     "text": "Fix the worst part first",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    },
    {
     "text": "Call the person who left it",
     "w": {
      "S": 2.0,
      "J": 1.0
     }
    },
    {
     "text": "Throw out the shaky half and rebuild",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "Document it so the next person is not lost",
     "w": {
      "O": 2.1,
      "C": 1.1
     }
    },
    {
     "text": "Treat it gently; they did their best",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Note what went wrong and who should answer for it",
     "w": {
      "J": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "Let it sit a day until I see its shape",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    }
   ]
  },
  {
   "id": "F4",
   "pool": "F",
   "type": "choice",
   "text": "How do you want to be remembered as a maker?",
   "options": [
    {
     "text": "Flawless, down to the last detail",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Fast and fearless",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "Generous with teaching",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Strange and original",
     "w": {
      "D": 1.9,
      "W": 1.0
     }
    },
    {
     "text": "Honest about what works",
     "w": {
      "J": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "Calm in every crunch",
     "w": {
      "R": 1.7,
      "V": 1.1
     }
    },
    {
     "text": "The one everyone wanted on the team",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Impossible to copy, even with the plans",
     "w": {
      "V": 1.1,
      "D": 1.9
     }
    }
   ]
  },
  {
   "id": "F5",
   "pool": "F",
   "type": "choice",
   "text": "A tool you built fails during a demo.",
   "options": [
    {
     "text": "Stay level, restore it, move on",
     "w": {
      "R": 1.7,
      "O": 1.1
     }
    },
    {
     "text": "Say so openly and explain the cause",
     "w": {
      "J": 2.0,
      "R": 0.9
     }
    },
    {
     "text": "Make the audience laugh while I patch it",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Fix it live; I like pressure",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "Apologize and make sure no one is harmed",
     "w": {
      "C": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "Switch to the backup I already prepared",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Use the failure to show something deeper",
     "w": {
      "D": 1.9,
      "S": 1.0
     }
    },
    {
     "text": "Pack up and rebuild this evening",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    }
   ]
  },
  {
   "id": "F6",
   "pool": "F",
   "type": "choice",
   "text": "Where do you put your effort when time is short?",
   "options": [
    {
     "text": "The foundation that everything rests on",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "The hardest part",
     "w": {
      "V": 2.2,
      "D": 0.9
     }
    },
    {
     "text": "The part people will actually use",
     "w": {
      "C": 2.1,
      "O": 1.1
     }
    },
    {
     "text": "The part no one else would try",
     "w": {
      "W": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "The part that must be correct",
     "w": {
      "J": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "The people on my team",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "The parts I enjoy, then see what happens",
     "w": {
      "W": 1.0,
      "R": 1.7
     }
    },
    {
     "text": "Thinking, then one decisive move",
     "w": {
      "D": 1.9,
      "V": 1.1
     }
    }
   ]
  },
  {
   "id": "F7",
   "pool": "F",
   "type": "choice",
   "text": "A teammate cuts a corner you would not.",
   "options": [
    {
     "text": "Redo it properly and say nothing",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Raise it with them directly",
     "w": {
      "J": 2.0,
      "S": 1.0
     }
    },
    {
     "text": "Ask what pressure they were under",
     "w": {
      "C": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Show them my result and let it speak",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    },
    {
     "text": "Let the team decide together",
     "w": {
      "S": 2.0,
      "J": 1.0
     }
    },
    {
     "text": "Accept it; not every corner matters",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "Wonder what it says about the plan",
     "w": {
      "D": 1.9,
      "O": 1.1
     }
    },
    {
     "text": "Test it; maybe the corner did not matter",
     "w": {
      "W": 1.0,
      "D": 0.9,
      "J": 1.0
     }
    }
   ]
  },
  {
   "id": "H1",
   "pool": "H",
   "type": "choice",
   "text": "Guests arrive an hour early.",
   "options": [
    {
     "text": "Welcome them and pour something warm",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Put them to work in the kitchen",
     "w": {
      "S": 2.0,
      "V": 1.1
     }
    },
    {
     "text": "Take them outside while I finish",
     "w": {
      "W": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Tell them honestly about the timing",
     "w": {
      "J": 2.0,
      "R": 0.9
     }
    },
    {
     "text": "I am ready; I was always ready",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Let them sit; I need a quiet minute",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Ask how their day was, and really mean it",
     "w": {
      "C": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Turn it into a race to finish dinner",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    }
   ]
  },
  {
   "id": "H2",
   "pool": "H",
   "type": "choice",
   "text": "A friend is quietly struggling.",
   "options": [
    {
     "text": "Sit beside them without needing words",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Plan something to lift their mood",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Ask direct questions until it comes out",
     "w": {
      "J": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Take them outside, away from it",
     "w": {
      "W": 2.1,
      "C": 1.1
     }
    },
    {
     "text": "List what could help, and start doing it",
     "w": {
      "O": 2.1,
      "C": 1.1
     }
    },
    {
     "text": "Write them a thoughtful letter",
     "w": {
      "D": 1.9,
      "C": 1.1
     }
    },
    {
     "text": "Help them set one goal this week",
     "w": {
      "V": 2.2,
      "C": 1.1
     }
    },
    {
     "text": "Give them space and check in later",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    }
   ]
  },
  {
   "id": "H3",
   "pool": "H",
   "type": "choice",
   "text": "Dinner conversation turns into an argument.",
   "options": [
    {
     "text": "Steer toward a topic everyone enjoys",
     "w": {
      "S": 2.0,
      "R": 0.9
     }
    },
    {
     "text": "Name what is actually being argued",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "Refill drinks and soothe",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Let it burn out on its own",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "Set ground rules, politely",
     "w": {
      "O": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "Take a side with gusto",
     "w": {
      "V": 2.2,
      "J": 1.0
     }
    },
    {
     "text": "Walk the angriest person around the block",
     "w": {
      "W": 2.1,
      "C": 1.1
     }
    },
    {
     "text": "Quietly ask each person what they want",
     "w": {
      "D": 1.9,
      "C": 1.1
     }
    }
   ]
  },
  {
   "id": "H4",
   "pool": "H",
   "type": "choice",
   "text": "How do you host a gathering?",
   "options": [
    {
     "text": "Everything labeled, scheduled, lovely",
     "w": {
      "O": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Wide open, come and go",
     "w": {
      "W": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "A table with room for strangers",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Games with real stakes and bragging rights",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    },
    {
     "text": "Candlelight and low talk",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "Honest toasts only",
     "w": {
      "J": 2.0,
      "S": 1.0
     }
    },
    {
     "text": "No agenda, plenty of chairs",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    },
    {
     "text": "A shared project everyone pitches in on",
     "w": {
      "S": 2.0,
      "V": 1.1
     }
    }
   ]
  },
  {
   "id": "H5",
   "pool": "H",
   "type": "choice",
   "text": "A neighbor needs help moving on your day off.",
   "options": [
    {
     "text": "Show up with snacks and a truck",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Organize a crew",
     "w": {
      "S": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "Ask what they need first",
     "w": {
      "D": 0.9,
      "C": 2.1
     }
    },
    {
     "text": "Gladly, but with a cutoff",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Make it a game",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    },
    {
     "text": "Do it grumbling, because it is right",
     "w": {
      "J": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Offer something else; I am wiped",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Turn it into an outing",
     "w": {
      "W": 2.1,
      "S": 1.0
     }
    }
   ]
  },
  {
   "id": "H6",
   "pool": "H",
   "type": "choice",
   "text": "What do people come to you for?",
   "options": [
    {
     "text": "A patient listening ear",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "A clear plan to follow",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "A laugh when things get heavy",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "The honest truth, kindly told",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "A wider perspective",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "A push to finally start",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    },
    {
     "text": "A calm voice in a bad moment",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    },
    {
     "text": "A spontaneous weekend adventure",
     "w": {
      "W": 2.1,
      "S": 1.0
     }
    }
   ]
  },
  {
   "id": "H7",
   "pool": "H",
   "type": "choice",
   "text": "You could fix a tradition that is quietly unfair.",
   "options": [
    {
     "text": "Change it gently, with everyone's blessing",
     "w": {
      "C": 2.1,
      "O": 1.1
     }
    },
    {
     "text": "Call it out at the next gathering",
     "w": {
      "J": 2.0,
      "S": 1.0
     }
    },
    {
     "text": "Start a new one that includes everyone",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Study why it began",
     "w": {
      "D": 1.9,
      "J": 1.0
     }
    },
    {
     "text": "Let it fade by not feeding it",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "Insist on a better version",
     "w": {
      "V": 2.2,
      "J": 1.0
     }
    },
    {
     "text": "Rewrite the rules in writing",
     "w": {
      "O": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "Just do it differently and let others follow",
     "w": {
      "W": 2.1,
      "C": 1.1
     }
    }
   ]
  },
  {
   "id": "W1",
   "pool": "W",
   "type": "choice",
   "text": "You find a locked gate across a trail.",
   "options": [
    {
     "text": "Climb over and keep going",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Check whether there is a good reason it is locked",
     "w": {
      "J": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "Look for another route",
     "w": {
      "W": 2.1,
      "O": 1.1
     }
    },
    {
     "text": "Wait; someone will come",
     "w": {
      "R": 1.7,
      "S": 1.0
     }
    },
    {
     "text": "Find the owner and ask",
     "w": {
      "S": 2.0,
      "J": 1.0
     }
    },
    {
     "text": "Call it a bad rule, loudly",
     "w": {
      "J": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Turn back and enjoy the walk anyway",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "Race my companion to find the best bypass",
     "w": {
      "V": 2.2,
      "S": 1.0
     }
    }
   ]
  },
  {
   "id": "W2",
   "pool": "W",
   "type": "choice",
   "text": "A storm rolls in.",
   "options": [
    {
     "text": "Dig in and ride it out",
     "w": {
      "V": 2.2,
      "R": 0.9
     }
    },
    {
     "text": "Help whoever is exposed",
     "w": {
      "C": 2.1,
      "W": 1.0
     }
    },
    {
     "text": "Watch it with fascination",
     "w": {
      "D": 1.9,
      "W": 1.0
     }
    },
    {
     "text": "Get everyone under cover, organized",
     "w": {
      "O": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Sing loudly until spirits lift",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Stay calm; storms pass",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Say we should have left sooner",
     "w": {
      "J": 2.0,
      "O": 1.1
     }
    },
    {
     "text": "Run for higher ground",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    }
   ]
  },
  {
   "id": "W3",
   "pool": "W",
   "type": "choice",
   "text": "When would you break a rule?",
   "options": [
    {
     "text": "When it is cruel, and openly",
     "w": {
      "J": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Never; I would change the rule",
     "w": {
      "O": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "When no one is hurt and it is fun",
     "w": {
      "W": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Only after understanding it",
     "w": {
      "D": 1.9,
      "J": 1.0
     }
    },
    {
     "text": "Quietly, with no fuss",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "To protect someone",
     "w": {
      "C": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "To win, when the stakes are real",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "With friends, laughing",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    }
   ]
  },
  {
   "id": "W4",
   "pool": "W",
   "type": "choice",
   "text": "Your group is split on which way to go.",
   "options": [
    {
     "text": "Vote, and live with it",
     "w": {
      "S": 1.0,
      "J": 2.0
     }
    },
    {
     "text": "Go my own way and meet them later",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Argue the case until someone yields",
     "w": {
      "V": 2.2,
      "J": 1.0
     }
    },
    {
     "text": "Wait for the split to resolve",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Make sure no one is left behind",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Draw a map of the options",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Ask what each path means to people",
     "w": {
      "D": 1.9,
      "C": 1.1
     }
    },
    {
     "text": "Say which way I think is right",
     "w": {
      "J": 2.0,
      "V": 1.1
     }
    }
   ]
  },
  {
   "id": "W5",
   "pool": "W",
   "type": "choice",
   "text": "You see someone treated unfairly in public.",
   "options": [
    {
     "text": "Step in right away",
     "w": {
      "J": 2.0,
      "V": 1.1
     }
    },
    {
     "text": "Stand beside the person quietly",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Rally others to speak up",
     "w": {
      "S": 2.0,
      "J": 1.0
     }
    },
    {
     "text": "Record what happens for later",
     "w": {
      "O": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "Defuse it with humor",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Walk them out of there",
     "w": {
      "W": 2.1,
      "C": 1.1
     }
    },
    {
     "text": "Wonder what led to this",
     "w": {
      "D": 1.9,
      "J": 1.0
     }
    },
    {
     "text": "Wait, then follow up calmly",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    }
   ]
  },
  {
   "id": "W6",
   "pool": "W",
   "type": "choice",
   "text": "A free day, no one to answer to.",
   "options": [
    {
     "text": "A mountain with no trail",
     "w": {
      "W": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "A library with a quiet corner",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "A busy market full of voices",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "A town meeting, just to listen",
     "w": {
      "J": 2.0,
      "S": 1.0
     }
    },
    {
     "text": "A garden bench in the sun",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    },
    {
     "text": "A workshop and a half-built project",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "The open road, no destination",
     "w": {
      "W": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "A training ground and a stopwatch",
     "w": {
      "V": 2.2,
      "O": 1.1
     }
    }
   ]
  },
  {
   "id": "W7",
   "pool": "W",
   "type": "choice",
   "text": "What does freedom mean?",
   "options": [
    {
     "text": "Nobody telling me when",
     "w": {
      "W": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Being able to say what is true",
     "w": {
      "J": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Choosing my own challenges",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "A home to return to",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Room to think",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "Knowing the rules and picking which to keep",
     "w": {
      "O": 2.1,
      "W": 1.0
     }
    },
    {
     "text": "Good company on any road",
     "w": {
      "S": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "Stillness, and nothing owed",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    }
   ]
  },
  {
   "id": "N1",
   "pool": "N",
   "type": "choice",
   "text": "You wake at 3 a.m. and cannot sleep.",
   "options": [
    {
     "text": "Get up and write the thoughts down",
     "w": {
      "D": 1.9,
      "O": 1.1
     }
    },
    {
     "text": "Lie still; it will pass",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "Walk outside in the dark",
     "w": {
      "W": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Message a friend who is also awake",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Plan tomorrow in detail",
     "w": {
      "O": 2.1,
      "V": 1.1
     }
    },
    {
     "text": "Replay an unresolved argument",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "Make tea, and some for someone else",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "Decide to finally start that thing",
     "w": {
      "V": 2.2,
      "D": 0.9
     }
    }
   ]
  },
  {
   "id": "N2",
   "pool": "N",
   "type": "choice",
   "text": "A stranger tells you a secret.",
   "options": [
    {
     "text": "Hold it safely, forever",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    },
    {
     "text": "Think about what it says about them",
     "w": {
      "D": 1.9,
      "C": 1.1
     }
    },
    {
     "text": "Ask what they need, then do it",
     "w": {
      "C": 2.1,
      "S": 1.0
     }
    },
    {
     "text": "Tell them they should say it publicly",
     "w": {
      "J": 2.0,
      "W": 1.0
     }
    },
    {
     "text": "File it away for later",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Share one of mine in return",
     "w": {
      "S": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "Encourage them to act on it",
     "w": {
      "V": 2.2,
      "C": 1.1
     }
    },
    {
     "text": "Change the subject kindly",
     "w": {
      "R": 1.7,
      "S": 1.0
     }
    }
   ]
  },
  {
   "id": "N3",
   "pool": "N",
   "type": "choice",
   "text": "What do you do with a mystery?",
   "options": [
    {
     "text": "Chase it until it is solved",
     "w": {
      "V": 2.2,
      "D": 0.9
     }
    },
    {
     "text": "Keep it; some things stay unsolved",
     "w": {
      "R": 1.7,
      "D": 1.9
     }
    },
    {
     "text": "Map every clue methodically",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Demand an answer from whoever knows",
     "w": {
      "J": 2.0,
      "V": 1.1
     }
    },
    {
     "text": "Share it at a gathering",
     "w": {
      "S": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "Wander toward it",
     "w": {
      "W": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Make sure no one is hurt by it",
     "w": {
      "C": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "Sit with it quietly",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    }
   ]
  },
  {
   "id": "N4",
   "pool": "N",
   "type": "choice",
   "text": "A memory returns uninvited.",
   "options": [
    {
     "text": "Examine it for what it means",
     "w": {
      "D": 1.9,
      "J": 1.0
     }
    },
    {
     "text": "Let it float by without chasing it",
     "w": {
      "R": 1.7,
      "W": 1.0
     }
    },
    {
     "text": "Write it down and file it",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "Tell someone I trust",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Use it as fuel",
     "w": {
      "V": 2.2,
      "D": 0.9
     }
    },
    {
     "text": "Make peace with it",
     "w": {
      "R": 1.7,
      "C": 1.1
     }
    },
    {
     "text": "Ask whether I was fair",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "Go outside until it fades",
     "w": {
      "W": 2.1,
      "R": 0.9
     }
    }
   ]
  },
  {
   "id": "N5",
   "pool": "N",
   "type": "choice",
   "text": "How do you rest?",
   "options": [
    {
     "text": "In total quiet",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "With a good book and no one else",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "With one trusted person",
     "w": {
      "C": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "In motion, outside",
     "w": {
      "W": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "In an organized space",
     "w": {
      "O": 2.1,
      "R": 0.9
     }
    },
    {
     "text": "By winning something small",
     "w": {
      "V": 2.2,
      "R": 0.9
     }
    },
    {
     "text": "By clearing my conscience",
     "w": {
      "J": 2.0,
      "R": 0.9
     }
    },
    {
     "text": "In a crowd, anonymous",
     "w": {
      "S": 2.0,
      "R": 0.9
     }
    }
   ]
  },
  {
   "id": "N6",
   "pool": "N",
   "type": "choice",
   "text": "Someone asks what you really think.",
   "options": [
    {
     "text": "I tell them all of it",
     "w": {
      "J": 2.0,
      "D": 0.9
     }
    },
    {
     "text": "I tell them gently",
     "w": {
      "C": 2.1,
      "J": 1.0
     }
    },
    {
     "text": "I tell them as a story",
     "w": {
      "D": 1.9,
      "S": 1.0
     }
    },
    {
     "text": "I ask what they think first",
     "w": {
      "D": 1.9,
      "R": 0.9
     }
    },
    {
     "text": "I tell them on a long walk",
     "w": {
      "W": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "I give a considered, structured answer",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "I say I will answer when I am ready",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "I turn it into a challenge",
     "w": {
      "V": 2.2,
      "J": 1.0
     }
    }
   ]
  },
  {
   "id": "N7",
   "pool": "N",
   "type": "choice",
   "text": "What is the dark to you?",
   "options": [
    {
     "text": "A home I can settle into",
     "w": {
      "R": 1.7,
      "D": 0.9
     }
    },
    {
     "text": "A place to find truths",
     "w": {
      "D": 1.9,
      "J": 1.0
     }
    },
    {
     "text": "A place to be brave",
     "w": {
      "V": 2.2,
      "W": 1.0
     }
    },
    {
     "text": "Quiet company",
     "w": {
      "C": 1.1,
      "R": 1.7
     }
    },
    {
     "text": "Something to hold a light against",
     "w": {
      "C": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "A place to organize my thoughts",
     "w": {
      "O": 2.1,
      "D": 0.9
     }
    },
    {
     "text": "A reason to gather around a fire",
     "w": {
      "S": 2.0,
      "C": 1.1
     }
    },
    {
     "text": "Something to roam through",
     "w": {
      "W": 2.1,
      "D": 0.9
     }
    }
   ]
  }
 ],
 "flow": [
  {
   "name": "Foundations",
   "pool": "foundation",
   "count": 8,
   "pick": "order"
  },
  {
   "name": "{path}",
   "pool": "@path",
   "count": 7,
   "pick": "order"
  },
  {
   "name": "Convergence",
   "pool": "*",
   "count": 9,
   "pick": "info"
  },
  {
   "kind": "duel",
   "name": "Head to head",
   "count": 6,
   "gods": 4,
   "prompt": "Which of these sounds most like you?"
  }
 ],
 "split": {
  "afterStage": 0,
  "method": "pathTraitPair"
 },
 "config": {
  "shown": 5,
  "aimed": 2,
  "K": 10,
  "duelWeight": 0.6,
  "frWeight": 2.5,
  "consistency": {"passes":1,"minAnswers":10,"topGods":3,"strength":0.2,"tolerance":1.5,"floor":0.6},
  "fr": {"stop":"the a an uh uhh um umm er eh hm hmm oh ah well so just really very is are was were be been am to of in on at it its i me my that this then there here you your we our they their them as with for from by do does did have has had will would can could might maybe".split(" "),"buckets":4096,"wCos":0.8,"wSim":0.2,"minTokens":3},
  "coverageRange": 4,
  "noiseTiebreak": 0.01,
  "telemetry": {
   "idleCapMs": 6000,
   "afkGapMs": 30000,
   "afkRawMs": 180000,
   "hoverCapMs": 12000,
   "baseMs": 1800,
   "msPerChar": 30,
   "minMs": 300,
   "minHist": 4,
   "madFloor": 0.25,
   "priorSd": 0.7,
   "zClip": 3,
   "afkZ": 4,
   "minHoverMs": 400,
   "b0": 0,
   "bSpeed": 0.35,
   "bHover": 3,
   "bEnt": 0.8,
   "bChange": 0.7,
   "cMin": 0.6,
   "cMax": 0.95,
   "floor": 0.15,
   "prevBoost": 0.3,
   "sliderBase": 0.7,
   "confirmBaseMs": 900,
   "changeDebounceMs": 150,
   "changeCapLog": 5,
   "bConf": 0.25
  },
  "behaviorWeight": 0.4,
  "behavior": [
   {
    "feature": "speed",
    "map": {
     "V": 1,
     "W": 0.5,
     "D": -0.5
    }
   },
   {
    "feature": "hesitation",
    "map": {
     "R": -1,
     "O": -0.5
    }
   },
   {
    "feature": "spread",
    "map": {
     "D": 0.5,
     "O": 0.5
    }
   },
   {
    "feature": "certainty",
    "map": {
     "J": 1,
     "R": 0.5
    }
   }
  ]
 }
};
