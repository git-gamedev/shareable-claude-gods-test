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
   "id": "q0",
   "pool": "foundation",
   "type": "choice",
   "text": "Which setting feels most like home?",
   "options": [
    {
     "text": "A workbench or study",
     "w": {
      "O": 3
     }
    },
    {
     "text": "A crowded, lively room",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Open land and weather",
     "w": {
      "W": 3
     }
    },
    {
     "text": "A dark quiet room at night",
     "w": {
      "D": 2,
      "R": 1
     }
    },
    {
     "text": "A hearth with people around it",
     "w": {
      "C": 2,
      "S": 1
     }
    },
    {
     "text": "A stage or arena",
     "w": {
      "V": 3,
      "S": 1
     }
    },
    {
     "text": "A library at midnight",
     "w": {
      "D": 3,
      "O": 1
     }
    },
    {
     "text": "A hammock in the sun",
     "w": {
      "R": 3,
      "W": 1
     }
    }
   ]
  },
  {
   "id": "q1",
   "pool": "foundation",
   "type": "choice",
   "text": "Under pressure you usually:",
   "options": [
    {
     "text": "Make a checklist",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Talk it through aloud",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Trust my instinct",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Go still and observe",
     "w": {
      "D": 2,
      "R": 1
     }
    },
    {
     "text": "Push harder",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Check on everyone",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Name what is unfair",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Breathe and wait",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "q2",
   "pool": "foundation",
   "type": "choice",
   "text": "What drains you fastest?",
   "options": [
    {
     "text": "Sloppy work",
     "w": {
      "O": 2,
      "J": 1
     }
    },
    {
     "text": "Being alone",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Being indoors",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Noise and glare",
     "w": {
      "D": 2,
      "R": 1
     }
    },
    {
     "text": "Conflict",
     "w": {
      "C": 2,
      "R": 1
     }
    },
    {
     "text": "Boredom",
     "w": {
      "W": 1,
      "V": 1,
      "S": 1
     }
    },
    {
     "text": "Losing",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Hypocrisy",
     "w": {
      "J": 3
     }
    }
   ]
  },
  {
   "id": "q3",
   "pool": "foundation",
   "type": "choice",
   "text": "What would you rather be given?",
   "options": [
    {
     "text": "A finished masterpiece",
     "w": {
      "O": 3
     }
    },
    {
     "text": "A roaring crowd",
     "w": {
      "S": 3
     }
    },
    {
     "text": "A year of travel",
     "w": {
      "W": 3
     }
    },
    {
     "text": "A week of silence",
     "w": {
      "R": 2,
      "D": 2
     }
    },
    {
     "text": "A thriving garden",
     "w": {
      "C": 2,
      "O": 1
     }
    },
    {
     "text": "A trophy",
     "w": {
      "V": 3
     }
    },
    {
     "text": "An apology you are owed",
     "w": {
      "J": 3
     }
    },
    {
     "text": "The key to a locked diary",
     "w": {
      "D": 3
     }
    }
   ]
  },
  {
   "id": "q4",
   "pool": "foundation",
   "type": "choice",
   "text": "Pick a hobby:",
   "options": [
    {
     "text": "Woodworking",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Hosting dinners",
     "w": {
      "S": 2,
      "C": 1
     }
    },
    {
     "text": "Wild swimming",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Journaling dreams",
     "w": {
      "D": 3
     }
    },
    {
     "text": "Competitive sport",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Volunteering",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Debate club",
     "w": {
      "J": 2,
      "S": 1
     }
    },
    {
     "text": "Napping outdoors",
     "w": {
      "R": 3,
      "W": 1
     }
    }
   ]
  },
  {
   "id": "q5",
   "pool": "foundation",
   "type": "choice",
   "text": "A friend betrays you. You:",
   "options": [
    {
     "text": "Rebuild trust slowly",
     "w": {
      "C": 2,
      "O": 1
     }
    },
    {
     "text": "Crack a joke",
     "w": {
      "S": 2,
      "J": 1
     }
    },
    {
     "text": "Walk it off",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Replay it alone",
     "w": {
      "D": 3
     }
    },
    {
     "text": "Plan revenge",
     "w": {
      "V": 1,
      "J": 3
     }
    },
    {
     "text": "Forgive quietly",
     "w": {
      "C": 2,
      "R": 2
     }
    },
    {
     "text": "Demand repayment",
     "w": {
      "J": 3,
      "V": 1
     }
    },
    {
     "text": "Sleep on it",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "q6",
   "pool": "foundation",
   "type": "slider",
   "text": "Plans or wandering?",
   "slider": {
    "left": "Plan everything",
    "right": "Follow my feet",
    "leftTrait": "O",
    "rightTrait": "W"
   }
  },
  {
   "id": "q7",
   "pool": "foundation",
   "type": "slider",
   "text": "Alone or in a crowd?",
   "slider": {
    "left": "Alone with my thoughts",
    "right": "In the crowd",
    "leftTrait": "D",
    "rightTrait": "S"
   }
  },
  {
   "id": "f0",
   "pool": "F",
   "type": "choice",
   "text": "A rival's invention beats yours. You:",
   "options": [
    {
     "text": "Study the design",
     "w": {
      "O": 2,
      "D": 1
     }
    },
    {
     "text": "Improve it overnight",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Praise it publicly",
     "w": {
      "C": 1,
      "J": 2
     }
    },
    {
     "text": "Accuse them of copying",
     "w": {
      "J": 3,
      "V": 1
     }
    },
    {
     "text": "Laugh and try something wild",
     "w": {
      "W": 3,
      "S": 1
     }
    },
    {
     "text": "Go quiet and rethink",
     "w": {
      "D": 2,
      "R": 1
     }
    },
    {
     "text": "Team up with them",
     "w": {
      "S": 2,
      "C": 2
     }
    },
    {
     "text": "Take a break",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "f1",
   "pool": "F",
   "type": "choice",
   "text": "Pick a tool:",
   "options": [
    {
     "text": "Chisel",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Whistle",
     "w": {
      "S": 2,
      "W": 1
     }
    },
    {
     "text": "Stopwatch",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Lantern",
     "w": {
      "D": 3
     }
    },
    {
     "text": "First-aid kit",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Plumb line",
     "w": {
      "J": 2,
      "O": 2
     }
    },
    {
     "text": "Hammock",
     "w": {
      "R": 3
     }
    },
    {
     "text": "Compass",
     "w": {
      "W": 3
     }
    }
   ]
  },
  {
   "id": "f2",
   "pool": "F",
   "type": "slider",
   "text": "Perfect it or ship it?",
   "slider": {
    "left": "Perfect it",
    "right": "Ship it",
    "leftTrait": "O",
    "rightTrait": "V"
   }
  },
  {
   "id": "f3",
   "pool": "F",
   "type": "choice",
   "text": "Your workshop is:",
   "options": [
    {
     "text": "Immaculate",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Busy with visitors",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Open to the sky",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Windowless and quiet",
     "w": {
      "D": 3,
      "R": 1
     }
    },
    {
     "text": "Stocked with medicine",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Full of trophies",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Labeled with rules",
     "w": {
      "J": 3,
      "O": 1
     }
    },
    {
     "text": "A mess I love",
     "w": {
      "W": 2,
      "R": 1
     }
    }
   ]
  },
  {
   "id": "f4",
   "pool": "F",
   "type": "choice",
   "text": "A client wants corners cut. You:",
   "options": [
    {
     "text": "Refuse and explain",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Do it right anyway",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Negotiate",
     "w": {
      "S": 2,
      "V": 1
     }
    },
    {
     "text": "Vanish for a while",
     "w": {
      "W": 2,
      "D": 1
     }
    },
    {
     "text": "Sleep on it",
     "w": {
      "R": 3
     }
    },
    {
     "text": "Worry about them first",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Race the deadline",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Improvise",
     "w": {
      "W": 3
     }
    }
   ]
  },
  {
   "id": "f5",
   "pool": "F",
   "type": "slider",
   "text": "Master the craft or win the contest?",
   "slider": {
    "left": "Master the craft",
    "right": "Win the contest",
    "leftTrait": "O",
    "rightTrait": "V"
   }
  },
  {
   "id": "f6",
   "pool": "F",
   "type": "choice",
   "text": "The best compliment on your work:",
   "options": [
    {
     "text": "Built to last",
     "w": {
      "O": 3,
      "R": 1
     }
    },
    {
     "text": "People gathered around it",
     "w": {
      "S": 3
     }
    },
    {
     "text": "It felt alive",
     "w": {
      "W": 3
     }
    },
    {
     "text": "It was deep",
     "w": {
      "D": 3
     }
    },
    {
     "text": "It healed someone",
     "w": {
      "C": 3
     }
    },
    {
     "text": "It won",
     "w": {
      "V": 3
     }
    },
    {
     "text": "It was fair",
     "w": {
      "J": 3
     }
    },
    {
     "text": "It looked effortless",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "h0",
   "pool": "H",
   "type": "choice",
   "text": "A houseguest overstays. You:",
   "options": [
    {
     "text": "Feed them more",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Make a schedule",
     "w": {
      "O": 2
     }
    },
    {
     "text": "Throw a party",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Say so plainly",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Retreat to your room",
     "w": {
      "D": 2,
      "R": 1
     }
    },
    {
     "text": "Take them hiking",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Challenge them to a game",
     "w": {
      "V": 2,
      "S": 1
     }
    },
    {
     "text": "Take a nap",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "h1",
   "pool": "H",
   "type": "choice",
   "text": "Your role at a gathering:",
   "options": [
    {
     "text": "The cook",
     "w": {
      "C": 2,
      "O": 1
     }
    },
    {
     "text": "The host",
     "w": {
      "S": 3
     }
    },
    {
     "text": "The instigator",
     "w": {
      "W": 2,
      "J": 1
     }
    },
    {
     "text": "The observer",
     "w": {
      "D": 3
     }
    },
    {
     "text": "The peacemaker",
     "w": {
      "C": 2,
      "R": 2
     }
    },
    {
     "text": "The scorekeeper",
     "w": {
      "V": 2,
      "O": 1
     }
    },
    {
     "text": "The truth-teller",
     "w": {
      "J": 3
     }
    },
    {
     "text": "The one asleep on the couch",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "h2",
   "pool": "H",
   "type": "slider",
   "text": "Give everything or keep my peace?",
   "slider": {
    "left": "Give everything",
    "right": "Keep my peace",
    "leftTrait": "C",
    "rightTrait": "R"
   }
  },
  {
   "id": "h3",
   "pool": "H",
   "type": "choice",
   "text": "A neighbor's roof collapses. You:",
   "options": [
    {
     "text": "Organize repairs",
     "w": {
      "O": 3,
      "C": 1
     }
    },
    {
     "text": "Bring soup",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Gather the street",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Run to help",
     "w": {
      "W": 2,
      "V": 1,
      "C": 1
     }
    },
    {
     "text": "Assign the blame",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Sit with them",
     "w": {
      "R": 2,
      "C": 2
     }
    },
    {
     "text": "Race to finish first",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Mourn quietly",
     "w": {
      "D": 3
     }
    }
   ]
  },
  {
   "id": "h4",
   "pool": "H",
   "type": "choice",
   "text": "Family argument at dinner. You:",
   "options": [
    {
     "text": "Change the subject",
     "w": {
      "S": 2,
      "R": 1
     }
    },
    {
     "text": "Mediate",
     "w": {
      "C": 3,
      "R": 1
     }
    },
    {
     "text": "Take a side",
     "w": {
      "J": 3,
      "V": 1
     }
    },
    {
     "text": "Leave the table",
     "w": {
      "W": 2,
      "D": 1
     }
    },
    {
     "text": "Stay calm",
     "w": {
      "R": 3
     }
    },
    {
     "text": "Fan the flames",
     "w": {
      "W": 3,
      "J": 1
     }
    },
    {
     "text": "Clear the plates",
     "w": {
      "O": 2,
      "C": 1
     }
    },
    {
     "text": "Remember it forever",
     "w": {
      "D": 3,
      "J": 1
     }
    }
   ]
  },
  {
   "id": "h5",
   "pool": "H",
   "type": "choice",
   "text": "What makes a home?",
   "options": [
    {
     "text": "Routines",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Noise",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Open windows",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Quiet corners",
     "w": {
      "D": 3
     }
    },
    {
     "text": "People fed",
     "w": {
      "C": 3
     }
    },
    {
     "text": "A shelf of victories",
     "w": {
      "V": 2
     }
    },
    {
     "text": "Rules everyone keeps",
     "w": {
      "J": 3,
      "O": 1
     }
    },
    {
     "text": "Rest",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "h6",
   "pool": "H",
   "type": "slider",
   "text": "A few deep bonds or many acquaintances?",
   "slider": {
    "left": "A few deep bonds",
    "right": "Many acquaintances",
    "leftTrait": "D",
    "rightTrait": "S"
   }
  },
  {
   "id": "w0",
   "pool": "W",
   "type": "choice",
   "text": "A storm cancels your trip. You:",
   "options": [
    {
     "text": "Re-plan the route",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Call everyone over",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Go out in it",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Read by candlelight",
     "w": {
      "D": 3,
      "R": 1
     }
    },
    {
     "text": "Fight for the refund",
     "w": {
      "J": 3,
      "V": 1
     }
    },
    {
     "text": "Check on the neighbors",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Make it a contest",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Sleep",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "w1",
   "pool": "W",
   "type": "choice",
   "text": "Rules you dislike are posted. You:",
   "options": [
    {
     "text": "Ignore them",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Follow them",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Mock them",
     "w": {
      "J": 2,
      "S": 1,
      "W": 1
     }
    },
    {
     "text": "Study why they exist",
     "w": {
      "D": 2
     }
    },
    {
     "text": "Rally others against them",
     "w": {
      "J": 2,
      "S": 2,
      "V": 1
     }
    },
    {
     "text": "Break them to win",
     "w": {
      "V": 3,
      "W": 1
     }
    },
    {
     "text": "Ask who they protect",
     "w": {
      "C": 2,
      "J": 1
     }
    },
    {
     "text": "Wait it out",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "w2",
   "pool": "W",
   "type": "slider",
   "text": "Rule of law or wild freedom?",
   "slider": {
    "left": "Rule of law",
    "right": "Wild freedom",
    "leftTrait": "J",
    "rightTrait": "W"
   }
  },
  {
   "id": "w3",
   "pool": "W",
   "type": "choice",
   "text": "An old trail splits. You:",
   "options": [
    {
     "text": "Mark the map",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Ask a passerby",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Take the unmarked one",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Sit and listen",
     "w": {
      "D": 2,
      "R": 2
     }
    },
    {
     "text": "Sprint the harder one",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Leave supplies for others",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Pick the fair-share path",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Take the shaded one",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "w4",
   "pool": "W",
   "type": "choice",
   "text": "Someone cheats at a game. You:",
   "options": [
    {
     "text": "Call it out",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Adjust the rules",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Laugh",
     "w": {
      "S": 2,
      "W": 1
     }
    },
    {
     "text": "Watch silently",
     "w": {
      "D": 2
     }
    },
    {
     "text": "Out-play them",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Cover for them",
     "w": {
      "C": 2
     }
    },
    {
     "text": "Pull a bigger prank",
     "w": {
      "W": 3,
      "J": 1
     }
    },
    {
     "text": "Walk away",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "w5",
   "pool": "W",
   "type": "choice",
   "text": "Freedom looks like:",
   "options": [
    {
     "text": "A perfect schedule",
     "w": {
      "O": 2,
      "R": 1
     }
    },
    {
     "text": "A party that never ends",
     "w": {
      "S": 3
     }
    },
    {
     "text": "No map",
     "w": {
      "W": 3
     }
    },
    {
     "text": "A hidden cabin",
     "w": {
      "D": 3,
      "R": 1
     }
    },
    {
     "text": "An unbeaten record",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Nobody hungry",
     "w": {
      "C": 3
     }
    },
    {
     "text": "No tyrants",
     "w": {
      "J": 3
     }
    },
    {
     "text": "No alarm clock",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "w6",
   "pool": "W",
   "type": "slider",
   "text": "Rest or chase?",
   "slider": {
    "left": "Rest",
    "right": "Chase",
    "leftTrait": "R",
    "rightTrait": "V"
   }
  },
  {
   "id": "n0",
   "pool": "N",
   "type": "choice",
   "text": "At 3 a.m. you wake and:",
   "options": [
    {
     "text": "Write it down",
     "w": {
      "O": 2,
      "D": 1
     }
    },
    {
     "text": "Text a friend",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Step outside",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Stare at the ceiling thinking",
     "w": {
      "D": 3
     }
    },
    {
     "text": "Train",
     "w": {
      "V": 2
     }
    },
    {
     "text": "Check on whoever is sleeping nearby",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Remember an old wrong",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Drift back off",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "n1",
   "pool": "N",
   "type": "choice",
   "text": "A dream keeps recurring. You:",
   "options": [
    {
     "text": "Log it",
     "w": {
      "O": 3,
      "D": 1
     }
    },
    {
     "text": "Tell everyone",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Chase it",
     "w": {
      "W": 2,
      "D": 1
     }
    },
    {
     "text": "Sit with it",
     "w": {
      "D": 3
     }
    },
    {
     "text": "Beat it",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Comfort the dreamer",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Ask what is owed",
     "w": {
      "J": 2,
      "D": 1
     }
    },
    {
     "text": "Let it pass",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "n2",
   "pool": "N",
   "type": "slider",
   "text": "Question everything or accept what comes?",
   "slider": {
    "left": "Question everything",
    "right": "Accept what comes",
    "leftTrait": "D",
    "rightTrait": "R"
   }
  },
  {
   "id": "n3",
   "pool": "N",
   "type": "choice",
   "text": "Silence is:",
   "options": [
    {
     "text": "Workspace",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Awkward",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Boring",
     "w": {
      "W": 3
     }
    },
    {
     "text": "Fertile",
     "w": {
      "D": 3
     }
    },
    {
     "text": "Wasted",
     "w": {
      "V": 2
     }
    },
    {
     "text": "Shared",
     "w": {
      "C": 2,
      "R": 1
     }
    },
    {
     "text": "Honest",
     "w": {
      "J": 2,
      "D": 1
     }
    },
    {
     "text": "Bliss",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "n4",
   "pool": "N",
   "type": "choice",
   "text": "Which hidden thing intrigues you most?",
   "options": [
    {
     "text": "A mechanism",
     "w": {
      "O": 3
     }
    },
    {
     "text": "Gossip",
     "w": {
      "S": 3
     }
    },
    {
     "text": "Unmapped places",
     "w": {
      "W": 3
     }
    },
    {
     "text": "The self",
     "w": {
      "D": 3
     }
    },
    {
     "text": "Limits",
     "w": {
      "V": 3
     }
    },
    {
     "text": "Others' pain",
     "w": {
      "C": 3
     }
    },
    {
     "text": "Secrets",
     "w": {
      "J": 2,
      "D": 1
     }
    },
    {
     "text": "Sleep",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "n5",
   "pool": "N",
   "type": "choice",
   "text": "A hard truth must be told. You:",
   "options": [
    {
     "text": "Prepare notes",
     "w": {
      "O": 2,
      "J": 1
     }
    },
    {
     "text": "Say it with a joke",
     "w": {
      "S": 2,
      "J": 1
     }
    },
    {
     "text": "Blurt it out",
     "w": {
      "W": 2,
      "J": 2
     }
    },
    {
     "text": "Speak low and slow",
     "w": {
      "D": 2,
      "J": 1,
      "R": 1
     }
    },
    {
     "text": "Hit hard",
     "w": {
      "V": 2,
      "J": 2
     }
    },
    {
     "text": "Soften it",
     "w": {
      "C": 3
     }
    },
    {
     "text": "State it flatly",
     "w": {
      "J": 3
     }
    },
    {
     "text": "Wait for morning",
     "w": {
      "R": 3
     }
    }
   ]
  },
  {
   "id": "n6",
   "pool": "N",
   "type": "slider",
   "text": "Surface and bright or deep and dark?",
   "slider": {
    "left": "Surface and bright",
    "right": "Deep and dark",
    "leftTrait": "S",
    "rightTrait": "D"
   }
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
  "aimed": 3,
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
