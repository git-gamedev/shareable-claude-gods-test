// id: [name, title, about, [strengths], fatal flaw, short tag used for the "secondary pull" blend]
const G={
he:["Hephaestus","God of the Forge","The one Olympian who works with his hands. Thrown from Olympus, he still built the gods' palaces, thrones, and weapons. You make real things out of stubbornness and skill.",["Craft and engineering","Patience with hard problems","Turning rough ideas into working objects"],"Perfectionism. You'd rebuild it a fifth time before showing anyone an unfinished version.","a maker's patience"],
at:["Athena","Goddess of Strategy","Wisdom with a spear. She wins by planning, not by brute force, and she's the patron of clever people who actually follow through.",["Strategy and foresight","Pattern recognition","Calm under pressure"],"Overthinking, and the belief that you can out-plan everything.","a strategist's eye"],
ap:["Apollo","God of Music, Prophecy and Healing","Light, art, and clear sight. He stands for beauty done with discipline, and people trust him to say where things are heading.",["Artistry and discipline","Insight into what's coming","A healing presence"],"Pride in your own brilliance, and a short fuse when it's questioned.","an artist's polish"],
hm:["Hermes","God of Messengers and Tricksters","Fast, clever, always between places. He found the loophole before he was a day old, and he guides travelers and thieves alike.",["Quick wit and adaptability","Connecting people and ideas","Finding the shortcut"],"Restlessness, and bending the truth to stay one step ahead.","a trickster's speed"],
hs:["Hestia","Goddess of the Hearth","The oldest Olympian, who gave up her throne to keep the peace. Every home's fire was hers. She holds things together without needing credit.",["Steadiness","Making people feel safe","Keeping peace under pressure"],"Avoiding conflict so long that problems grow quietly.","a hearth-keeper's warmth"],
nm:["Nemesis","Goddess of Balance and Retribution","She sees that good and evil get paid back in kind, and she particularly deals with arrogance. Fairness isn't a preference for you, it's a law.",["A sharp sense of justice","Seeing through pride","Holding the line when others look away"],"Grudges. You can keep a ledger open for years.","a sense of justice"],
mo:["Momus","God of Satire and Criticism","A child of Night who mocked even the gods, including Zeus's own creations. Sharp, funny, and usually right about the flaw in the design.",["Spotting the flaw nobody else will say","Humor as a tool","Zero fear of authority"],"A critique that costs you your seat at the table. Momus was exiled from Olympus for it.","a satirist's bite"],
hy:["Hypnos","God of Sleep","Twin of Death and son of Night. Even Zeus couldn't resist him. He gives the world its rest, and he does it softly.",["Calm that spreads to others","Knowing when to power down","Quiet influence"],"Checking out when things get hard. Rest is not always the answer.","a rest-giver's calm"],
mp:["Morpheus","God of Dreams","The shaper of the forms people see in sleep. He can appear as anyone, in any shape, and is believed to deliver messages in dreams.",["Imagination","Reading people deeply","Making the abstract vivid"],"Living in your head. The dream feels better than the day.","a dreamer's imagination"],
tn:["Thanatos","God of Peaceful Death","Not a villain. He is gentle, inevitable, and honest. He represents endings that come without cruelty, and he's comfortable with what others avoid.",["Calm about hard truths","Comfort with endings","Steady presence when things are heavy"],"Emotional distance. You can go cold to avoid being swallowed.","a calm about endings"],
ty:["Tyche","Goddess of Fortune","She steered the fate of cities and carried a cornucopia and a rudder. Chance follows her, and she thrives where plans fall short.",["Seizing the opening","Comfort with uncertainty","Resilience when luck turns"],"Trusting luck over effort, until it runs out.","a gambler's nerve"],
nr:["Nereus","The Old Man of the Sea","An ancient, honest sea god who could foretell the future and change shape. He told the truth, but only if you caught him and held on.",["Honesty with depth","Prophetic sense","Adapting to any situation"],"Slipping away the moment you're pressed.","a shapeshifter's depth"],
pn:["Pan","God of the Wild and Shepherds","Goat-legged, pipe-playing, and happiest outdoors. Gut instinct, music, and open hills. His sudden shout gave us the word panic.",["Instinct","Joy in the moment","Closeness to nature and music"],"Impulsiveness. You follow the wild thing before checking where it goes.","a wild streak"],
ir:["Iris","Goddess of Rainbows and Messages","She carried messages between gods and mortals on a rainbow bridge, especially for Hera. You're the connection between people who couldn't reach each other.",["Bridging people","Delivering hard messages kindly","Reliability"],"Living in the middle. You carry everyone's words and lose your own.","a bridge-builder's tact"],
nk:["Nike","Goddess of Victory","Winged, tireless, and usually at Athena's side. She turns effort into wins, and she gives the glory only to those who go all in.",["Drive","Finishing strong","Rallying others"],"Needing the win. Rest feels like losing.","a champion's drive"],
ac:["Asclepius","God of Medicine","Born of a god and a mortal, he learned healing so well he began to raise the dead, which got him struck down by Zeus. His staff is still the symbol of medicine.",["Healing and repair","Compassion with skill","Refusing to give up on people"],"Crossing a line to save someone. You'll break the rules for the people you can't let go.","a healer's compassion"],
er:["Eris","Goddess of Strife","Daughter of Night. One golden apple, thrown into a wedding feast, set off the Trojan War. Discord isn't always destruction; sometimes it's the push that gets things moving.",["Sparking change","Not scared of conflict","Creative disruption"],"Stirring the pot for the thrill of it, and then watching it boil over.","a disruptor's spark"],
ch:["Chronos","God of Time","The personification of time itself. He does not rush and he does not stop, and everything measures itself against him.",["Patience and long-term vision","Timing","Knowing what lasts"],"Anxiety about the clock. Every hour spent is an hour gone.","a sense of timing"],
ny:["Nyx","Goddess of Night","Primordial and feared even by Zeus. Mother of Sleep, Death, Dreams, Strife, and Nemesis. She is the dark where everything starts.",["Depth","Quiet authority","Mastery of what's unseen"],"Hiding in the dark. Mystery can become isolation.","a depth of shadow"],
ar:["Aristaeus","God of Beekeeping and Rural Crafts","He taught people to keep bees, make cheese, and grow olives. Practical, quiet, and generous with knowledge, but history forgot to thank him.",["Practical skill","Teaching others","Patience with slow, steady work"],"Resentment when the work goes unthanked.","a gardener's patience"]
};
// Broad questions: options mostly boost whole clusters (@mk makers, @so social, @wi wild, @ni night). Spec: "godId+points" or "@cluster+points".
const RAW_B=[
["Which setting feels most like home?",[["A workbench, garden, or study","@mk1"],["A crowded, lively room","@so1"],["Open land and weather","@wi1"],["A dark, quiet room at night","@ni1"],["A hearth with people around it","hs2 ac1 ar1"],["A stage or arena","nk2 ap1 er1"]]],
["How do you do your best under pressure?",[["Think it through","at2 ch1"],["Talk or joke my way through","@so1"],["Trust my instinct","@wi1"],["Go still and observe","@ni1"],["Fix what's broken","he2 ac1"],["Push harder","nk2 pn1"]]],
["People would describe you as:",[["Careful","@mk1"],["Charismatic","@so1"],["Free","@wi1"],["Mysterious","@ni1"],["Reliable","hs2 ar1"],["Intense","nm1 er1 nk1"]]],
["What drains you most?",[["Sloppy work","@mk1"],["Being alone","@so1"],["Being stuck indoors","@wi1"],["Noise and glare","@ni1"],["Conflict","hs2 ir1"],["Boredom","er1 hm1 ty1"]]],
["What drives you?",[["Mastery","@mk1"],["Connection","@so1"],["Freedom","@wi1"],["Truth","@ni1"],["Caring for others","hs1 ac2"],["Winning","nk2 ap1"]]],
["Which reward would you pick?",[["A finished masterpiece","@mk1"],["A crowd that cheers","@so1"],["A year of travel","@wi1"],["A week of perfect quiet","@ni1"],["A thriving garden","ar2 hs1"],["A trophy","nk2 ap1"]]],
["Your ideal free evening:",[["Working on a personal project","@mk1"],["A party","@so1"],["A fire outdoors","@wi1"],["Stargazing alone","@ni1"],["Cooking for friends","hs2 ar1"],["A game night","nk1 er1 ty1"]]]
];
// Mid questions: options point at 2-3 gods each.
const RAW_M=[
["A friend is stuck on a hard choice. You:",[["Make a pros-and-cons plan","at2 ch1"],["Tell them honestly what you see","mo2 nr1"],["Get them laughing first","hm2 mo1"],["Stay with them until they're ready","hs2 tn1"],["Ask what their gut says","pn1 ty1 nr1"],["Look for what's fair","nm2 at1"]]],
["Pick a hobby:",[["Gardening or beekeeping","ar2 hs1"],["Learning first aid and medicine","ac2 at1"],["Performing music","ap2 pn1"],["Sports or competition","nk2 er1"],["Journaling your dreams","mp2 hy1"],["Collecting old stories","ch2 hm1"]]],
["Someone trusts you with a secret. You:",[["Keep it forever","ny2 hs1"],["Keep it and quietly help","ac1 hs2"],["Share it only to prevent harm","nm2 ir1"],["Can't help spilling it","hm2 mo1"],["Tell no one but write it down","at2 ch1"],["Forget it by morning","hy2 pn1"]]],
["Luck turns against you. You:",[["Adapt","hm2 nr1"],["Double down","ty2 nk1"],["Learn from it","at2 ar1"],["Laugh","mo2 ty1"],["Rest","hy2 hs1"],["Plan for next time","ch2 at1"]]],
["Which would you rather be known for?",[["Carrying hard messages kindly","ir2 hm1"],["Telling hard truths","mo2 nr1"],["Delivering justice","nm2 nk1"],["Healing others","ac2 hs1"],["Winning against the odds","nk2 ty1"],["Teaching quiet craft","ar2 he1"]]],
["Time to you is:",[["A resource","ch2 at1"],["A river","nr2 ir1"],["A gift","hs1 ap2"],["A debt","nm1 tn2"],["A game","hm1 ty2"],["Irrelevant","pn2 hy1"]]],
["In dreams you are usually:",[["Flying","ap1 ir2"],["Making something","he2 ar1"],["Falling","hy1 mp2"],["Being chased","pn1 ny2"],["Searching","nr2 ch1"],["I don't dream","tn2 hy1"]]],
["Your hardest moral line:",[["Cruelty","nm2 ac1"],["Dishonesty","mo2 nr1"],["Broken promises","nm1 ir2"],["Carelessness","he2 at1"],["Neglect","hs2 ar1"],["Arrogance","nm2 nr1"]]],
["Your leadership style:",[["Lead by example","he1 nk2"],["Strategy first","at2 ch1"],["Inspire","ap2 nk1"],["Serve","hs2 ac1"],["Provoke","er2 mo1"],["Stay in the background","ny2 ir1"]]],
["At the edge of the sea you:",[["Look for patterns in the waves","nr2 ch1"],["Skip stones","pn2 hm1"],["Send a message in a bottle","ir2 hm1"],["Just listen","tn1 ny2"],["Test the tide","nk1 ty2"],["Build something","he1 ar2"]]],
["The best part of winning:",[["The feeling","nk2 ap1"],["The story afterward","hm2 ap1"],["Sharing it","ir1 hs2"],["The preparation","at2 ch1"],["The luck","ty2 pn1"],["The rematch","er2 nk1"]]],
["Quiet means:",[["Peace","hy2 hs1"],["Room to think","at2 mp1"],["Respect for endings","tn2 ch1"],["Unease","er2 pn1"],["Comfort in the dark","ny2 mp1"],["Time to craft","he2 ar1"]]]
];
// Free response: one prompt, one "perfect response" per god (stored as keyword-rich text, graded by hashed-token similarity).
const FRPROMPT="A landslide has blocked the only road home. In a few sentences, say exactly what you do and why.";
const FR={
he:"I study the wall, find the weak joint, and build a lever and a ramp with my own hands until it is shaped and strong",
at:"I plan carefully, study the pattern of the rubble, choose the strategy with the best odds, and lead everyone through step by step",
ap:"I sing to steady the group, read the signs of what comes next, heal anyone hurt, and clear a beautiful path",
hm:"I find a clever shortcut, talk fast, trade favors, carry word to others, and slip around the blockage before anyone notices",
hs:"I stay calm, light a fire, feed everyone, keep the group together and safe, and wait patiently until help comes",
nm:"I weigh what is fair, make sure whoever caused this pays the price, and hold everyone to what they owe",
mo:"I laugh at the absurd design of the road, point out exactly who built it badly, and say the blunt truth",
hy:"I rest, close my eyes, let everyone sleep soundly until morning, and trust the problem will look different tomorrow",
mp:"I imagine the landslide as a dream, shape it into something else, and picture the road home until it appears",
tn:"I accept that this is an ending, stay quiet and peaceful, and calmly face what cannot be changed",
ty:"I trust my luck, flip a coin, take the chance that seems most fortunate, and bet on a lucky break",
nr:"I read the tide and the signs, tell the honest truth about the odds, and change my shape to fit the situation",
pn:"I follow my instincts into the wild hills, play a tune, climb over and run free through the trees",
ir:"I send word to friends on both sides, build a bridge of messages, and connect the people who can help",
nk:"I charge at the rocks with determination, never give up, push through to victory, and win the race home",
ac:"I tend the injured first, bandage wounds, find remedies and healing herbs, and refuse to leave anyone behind",
er:"I stir up the crowd, start an argument about who is at fault, and let the chaos break the blockage open",
ch:"I wait and measure the hours, patient because time wears down every wall, and move at exactly the right moment",
ny:"I wait for dark, move unseen through the shadows, and slip past in silence while no one is watching",
ar:"I gather what the land offers, share bread and honey, work slowly and practically with simple tools to clear the road"
};
// --- v4 additions ---
RAW_M.push(
["Your ideal weekend project:",[["Restoring something broken","he2 ac1"],["Planning a route nobody's taken","at1 hm2"],["Hosting a feast","hs2 ir1"],["A long hike with no map","pn2 nr1"],["Writing a story","mp2 ap1"],["Training for a race","nk2 ch1"]]],
["A rival beats you fairly. You:",[["Study what they did","at2 nk1"],["Congratulate them, then plot","nk1 er2"],["Shrug, luck happens","ty2 hy1"],["Note it and wait","nm1 ch2"],["Roast yourself publicly","mo2 hm1"],["Practice until it's different","he1 nk2"]]],
["A stranger asks for directions. You:",[["Walk them there","ir2 hs1"],["Give a shortcut that may be shady","hm2 er1"],["Draw a map","he1 at2"],["Admit you're lost too","nr2 mo1"],["Wave vaguely at the horizon","pn2 hy1"],["Ask where they truly want to go","ap1 mp2"]]],
["In a group project you are the one who:",[["Does the hard part quietly","ar2 he1"],["Keeps everyone calm","hs2 hy1"],["Spots the flaw","mo2 at1"],["Rallies the deadline push","nk2 ap1"],["Brings the odd idea","mp2 er1"],["Chases late people politely","ir2 nm1"]]],
["What would you hate to lose?",[["My tools","he2 ar1"],["My name","ap2 nk1"],["My routine","ch2 hs1"],["My freedom","pn2 ty1"],["My memories","mp1 tn2"],["My good sleep","hy2 ny1"]]],
["A rumor spreads about you. You:",[["Correct it with facts","nm1 at2"],["Make a joke of it","mo2 hm1"],["Let it die on its own","hy2 ch1"],["Trace who started it","nm2 ny1"],["Make it bigger","er2 hm1"],["Stay calm and carry on","tn2 hs1"]]],
["Pick a season:",[["Autumn harvest","ar2 ch1"],["Spring thaw","ac1 pn2"],["Summer festival","ap1 nk2"],["Deep winter","tn1 ny2"],["Storm season","er2 ty1"],["The turn between seasons","ch2 ir1"]]],
["Choose a tool:",[["Hammer","he2 nk1"],["Compass","nr1 at2"],["Lantern","ny1 ac2"],["Lyre","ap2 pn1"],["Dice","ty2 hm1"],["Quill","ir1 mo2"]]],
["Someone is crying near you. You:",[["Sit beside them","hs2 tn1"],["Bring tea and bandages","ac2 ar1"],["Say something unexpectedly funny","hm1 mo2"],["Wait until they're ready to talk","tn2 ny1"],["Tell them it will pass","ch1 hy2"],["Get them walking it off","nk2 pn1"]]],
["Your relationship with rules:",[["I rebuild them to work better","he1 at2"],["I follow them to the letter","nm2 ch1"],["I bend them","hm2 ty1"],["I test them to breaking","er2 mo1"],["I ignore them kindly","pn2 hy1"],["I keep them for others' sake","ir2 hs1"]]],
["A strange door appears in your house. You:",[["Study the lock","he1 at2"],["Open it immediately","pn1 ty2"],["Knock and wait","nr1 tn2"],["Imagine what's behind it","mp2 ny1"],["Ask someone else first","ir2 hs1"],["Take notes and measure","ch2 ar1"]]],
["How do you apologize?",[["Fix the thing I broke","he2 ac1"],["Pay in full","nm2 nk1"],["Say it plainly","nr2 mo1"],["Slip in a gift and a smile","hm2 ap1"],["Cook for them","hs2 ar1"],["Wait until the sting passes","hy1 ch2"]]],
["Which sound do you love?",[["A forge hammering","he2 nk1"],["Waves at night","nr1 ny2"],["Wind in the pipes","pn2 ap1"],["A crackling fire","hs2 tn1"],["A crowd roaring","nk2 er1"],["Rain on the roof","hy2 mp1"]]],
["A deal seems too good. You:",[["Read the fine print","at2 nm1"],["Take it, why not","ty2 pn1"],["Haggle harder","hm2 er1"],["Ask who loses","nm2 ac1"],["Wait a month","ch2 hy1"],["Pass, it feels wrong","tn1 ny2"]]],
["What do you want to leave behind?",[["Something built","he2 ar1"],["A student","ar1 ap2"],["A healed person","ac2 hs1"],["A joke people retell","mo2 hm1"],["An unsettling question","er1 nr2"],["A quiet place","hy1 tn2"]]]
);
// Paraphrased first-person trait statements for the narrow tier (3 strengths + 1 flaw per god), so no god's literal text is shown.
const NP={
he:["I'd rather build it than talk about it","I can stay with a stubborn problem for days","Rough sketches become working things in my hands","I keep redoing it until it's right, even after it's good enough"],
at:["I see the shape of a situation before others do","I notice the pattern under the noise","I stay level when everyone else rattles","I trust my plan too much and it eats my time"],
ap:["I do beautiful things with discipline","People ask me where things are heading","My presence tends to steady and mend people","I bristle when my brilliance is doubted"],
hm:["I adapt faster than the situation changes","I'm the one who introduces people to each other","I can always find the shortcut","I can't sit still and I shade the truth to keep moving"],
hs:["People relax when I'm in the room","I make a place feel safe","I keep the peace when it's tense","I avoid conflict until it grows on its own"],
nm:["I can't ignore it when something is unfair","I see through anyone puffed up with pride","I hold the line when others look away","I keep old scores open much too long"],
mo:["I say the flaw out loud when no one else will","Humor is how I make my point","Authority doesn't scare me","My candor has cost me a place at the table"],
hy:["My calm is contagious","I know when it's time to power down","I influence people without raising my voice","When things get hard I go quiet and check out"],
mp:["My imagination is vivid and strange","I read people very deeply","I can make an abstract idea feel real","I'd often rather be in my head than in the day"],
tn:["I can say hard truths without flinching","I'm at ease with things ending","People lean on me when everything feels heavy","I go cold to keep from being overwhelmed"],
ty:["I jump when an opening appears","Uncertainty doesn't bother me","I bounce back when things go wrong","I count on things working out until they don't"],
nr:["I'm honest in a way that goes deep","I often sense what's coming","I fit myself to any circumstance","I slip away the moment someone presses me"],
pn:["I trust my gut first","I find real joy in the passing moment","I feel most myself in open country with music","I chase the wild thing before looking where it goes"],
ir:["I'm the link between people who can't reach each other","I can deliver bad news gently","People rely on me to show up","I carry everyone's words and misplace my own"],
nk:["I'm relentless once I commit","I finish things strongly","I get a team believing it can win","I can't enjoy rest while a win is still out there"],
ac:["I'm drawn to repair what's damaged","I pair kindness with real skill","I don't give up on people others have written off","I'll break the rules for someone I can't let go of"],
er:["I'm the spark that gets stagnant things moving","Conflict doesn't scare me","I disrupt things creatively","I stir things up for the thrill and then watch it spill"],
ch:["I'm patient on a long horizon","My timing is usually right","I can tell what will last","I feel every wasted hour"],
ny:["I have a depth people sense right away","I have a quiet authority","I'm comfortable with what's unseen","I retreat into the dark and call it mystery"],
ar:["I'm good with practical, useful skills","I love teaching what I know","I can keep at slow, steady work","I quietly resent it when the work goes unthanked"]
};
// Second free-response prompt, one reference per god. Graders take the best score across references.
const FRPROMPT2="Someone you trusted lied to you, and it cost you something real. In a few sentences, say what you do next and why.";
const FR2={
he:"I fix the damage with my own hands, rebuild what was broken, and put it back sturdier than before",
at:"I work out why they lied, plan my next move carefully, and make sure it cannot happen again",
ap:"I tell them plainly what I see, forgive when they heal, and move on with my head high and my pride intact",
hm:"I use a clever trick to turn the lie around, talk my way out, and get the loss back with a smile",
hs:"I keep the peace, forgive quietly, and keep the home warm so everyone can stay together",
nm:"I keep a careful account of what I am owed, and make sure they pay back exactly what they cost me",
mo:"I mock them openly, laugh at the lie, and say out loud how transparent and ridiculous it was",
hy:"I sleep on it, let it fade, and let tomorrow's rest soften the anger until it does not matter",
mp:"I replay it in my mind like a dream, picture their reasons, and imagine another way it could have gone",
tn:"I accept that trust has ended, stay quiet and calm, and let the friendship die peacefully without cruelty",
ty:"I shrug it off as bad luck, take a chance on someone new, and bet that fortune turns",
nr:"I ask for the honest truth, hold them until they answer, and then adapt to what I learn",
pn:"I walk out into the wild hills, play music, shout it out, and let the anger run free",
ir:"I carry my message to both of us, talk it through kindly, and rebuild the bridge between us",
nk:"I refuse to be beaten, pour the hurt into effort, and win back more than I lost",
ac:"I tend my own wound, care for the others hurt, and forgive because I will not give up on people",
er:"I stir up trouble, call them out publicly, and watch the argument break everything open",
ch:"I wait patiently, let time reveal the truth, and act only at exactly the right moment",
ny:"I withdraw into the dark, say nothing, and quietly decide in silence what comes next",
ar:"I go back to my work, keep helping others anyway, and resent that nobody thanked me"
};
// Extra references (v5): alternate phrasings in plain voice, merged into FR / FR2 as arrays.
const XR1={he:"I look at the rubble like a problem to build my way out of, and start making tools",at:"First I think, then I choose the smartest plan and direct the others",ap:"I stay clear-headed, sing to keep spirits up, and see what to do next",hm:"I find a way around fast, talk to whoever I need, and keep moving",hs:"I make everyone comfortable and calm, and we wait together until it is safe",nm:"Somebody is responsible and it is only fair they make it right",mo:"The road was badly made and I will say so, loudly and with a joke",hy:"I lie down and sleep, because tired people choose badly",mp:"I close my eyes and imagine another road, and the way opens in my mind",tn:"Some things end, and I sit with that calmly instead of fighting it",ty:"I trust luck and take the first lucky opening that shows up",nr:"I tell everyone the honest truth about the odds and adapt as it changes",pn:"I go by feel, wander off into the hills, and enjoy the walk",ir:"I get word to the people on the other side and connect everyone",nk:"I will not quit, I push until we have won",ac:"I check who is hurt first and care for them before anything else",er:"I shake things up with a fight and see what breaks loose",ch:"I am patient, because the rocks will wear down in time",ny:"I wait for night and slip by in the dark without being seen",ar:"I work with simple tools, share food, and take it slow and steady"};
const XR2={he:"I do not argue, I repair what I can, and rebuild trust and things by hand",at:"I think through the lie and plan the best response before acting",ap:"I speak plainly and clearly, then heal and move forward with grace",hm:"I turn it around, get the truth out of them, and use what I learned",hs:"I keep peace, forgive quietly, and hold things together at home",nm:"They owe me and I will make sure it is repaid, it is only fair",mo:"I call it out, mock the excuse, and say the blunt truth out loud",hy:"I sleep on it and let the anger fade",mp:"I replay it in my head and imagine how it could have gone",tn:"I accept that this trust is over, calmly and without drama",ty:"I shrug, take the chance on someone new, and trust fortune",nr:"I confront them honestly and say what I see, then change course",pn:"I go out walking in the wild, play music, and shake it off",ir:"I carry the message to everyone it concerns and reconnect people",nk:"I get back up, throw myself into work, and win anyway",ac:"I help those hurt by it, including myself, and mend what I can",er:"I make a scene, stir the whole crowd up, and make them squirm",ch:"I wait, and let time show what is true",ny:"I withdraw into the quiet dark and say nothing, but I do not forget",ar:"I go back to my work, teach others what I learned, and carry on steadily"};
for(const g in XR1){FR[g]=[].concat(FR[g],XR1[g]);FR2[g]=[].concat(FR2[g],XR2[g])}
