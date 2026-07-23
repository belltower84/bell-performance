"use strict";

/*
  Bell Performance contextual quote cache.
  Quotes rotate by calendar day and are matched to the athlete's active
  Strength and Engine modalities. Scripture text uses the KJV.
*/
const BellQuoteCache = (() => {
  const scripture = [
    { text:"I can do all things through Christ which strengtheneth me.", source:"Philippians 4:13 (KJV)", tags:["faith"] },
    { text:"Let us run with patience the race that is set before us.", source:"Hebrews 12:1 (KJV)", tags:["faith","engine"] },
    { text:"They that wait upon the Lord shall renew their strength.", source:"Isaiah 40:31 (KJV)", tags:["faith","strength","engine"] },
    { text:"Whatsoever ye do, do it heartily, as to the Lord.", source:"Colossians 3:23 (KJV)", tags:["faith"] },
    { text:"Let us not be weary in well doing.", source:"Galatians 6:9 (KJV)", tags:["faith","engine"] },
    { text:"Know ye not that they which run in a race run all, but one receiveth the prize? So run, that ye may obtain.", source:"1 Corinthians 9:24 (KJV)", tags:["faith","engine"] },
    { text:"The glory of young men is their strength.", source:"Proverbs 20:29 (KJV)", tags:["faith","strength"] },
    { text:"A man's heart deviseth his way: but the Lord directeth his steps.", source:"Proverbs 16:9 (KJV)", tags:["faith","engine"] }
  ];

  const strength = {
    default: [
      { text:"Strength does not come from winning. Your struggles develop your strengths.", source:"Arnold Schwarzenegger" },
      { text:"The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.", source:"Arnold Schwarzenegger" },
      { text:"Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.", source:"Ronnie Coleman" },
      { text:"There is no reason to be alive if you cannot do deadlift.", source:"Jón Páll Sigmarsson" },
      { text:"The iron never lies to you.", source:"Henry Rollins" },
      { text:"Success is usually the culmination of controlling failure.", source:"Sylvester Stallone" }
    ],
    powerlifting: [
      { text:"There is no point in being alive if you cannot do the deadlift.", source:"Jón Páll Sigmarsson" },
      { text:"The barbell is loaded.", source:"Powerlifting tradition" },
      { text:"You do not get strong by thinking about lifting heavy. You get strong by lifting heavy with discipline.", source:"Bell Performance Coach" },
      { text:"Technique first. Tension second. Load follows.", source:"Bell Performance Coach" }
    ],
    bodybuilding: [
      { text:"The last three or four reps is what makes the muscle grow.", source:"Arnold Schwarzenegger" },
      { text:"Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.", source:"Ronnie Coleman" },
      { text:"Ain't nothin' but a peanut.", source:"Ronnie Coleman" },
      { text:"The pain you feel today will be the strength you feel tomorrow.", source:"Arnold Schwarzenegger" }
    ],
    "olympic lifting": [
      { text:"The snatch is about speed, the clean is about strength, and the jerk is about courage.", source:"Weightlifting maxim" },
      { text:"Make every repetition look like the one you want on the platform.", source:"Bell Performance Coach" },
      { text:"Speed under the bar is built by precision over time.", source:"Bell Performance Coach" }
    ],
    athlete: [
      { text:"Hard work beats talent when talent does not work hard.", source:"Tim Notke" },
      { text:"The will to win is important, but the will to prepare is vital.", source:"Joe Paterno" },
      { text:"You do not rise to the occasion. You fall to the level of your preparation.", source:"Training maxim" }
    ],
    hybrid: [
      { text:"You do not have to choose between strong and conditioned. You have to train both intelligently.", source:"Bell Performance Coach" },
      { text:"Capacity is the ability to keep producing when fatigue asks you to stop.", source:"Bell Performance Coach" },
      { text:"Build strength that lasts and endurance that does not steal it.", source:"Bell Performance Coach" }
    ]
  };

  const engine = {
    default: [
      { text:"Do not stop when you are tired. Stop when you are done.", source:"David Goggins" },
      { text:"The pain that you are willing to endure is measured by how bad you want it.", source:"David Goggins" },
      { text:"Pain is temporary. Quitting lasts forever.", source:"Lance Armstrong" },
      { text:"It never gets easier; you just go faster.", source:"Greg LeMond" },
      { text:"To give anything less than your best is to sacrifice the gift.", source:"Steve Prefontaine" },
      { text:"The miracle is not that I finished. The miracle is that I had the courage to start.", source:"John Bingham" }
    ],
    running: [
      { text:"To give anything less than your best is to sacrifice the gift.", source:"Steve Prefontaine" },
      { text:"The will to win means nothing without the will to prepare.", source:"Juma Ikangaa" },
      { text:"Run when you can, walk if you have to, crawl if you must; just never give up.", source:"Dean Karnazes" },
      { text:"Do not stop when you are tired. Stop when you are done.", source:"David Goggins" }
    ],
    cycling: [
      { text:"It never gets easier; you just go faster.", source:"Greg LeMond" },
      { text:"Pain is temporary. Quitting lasts forever.", source:"Lance Armstrong" },
      { text:"Ride as much or as little, or as long or as short as you feel. But ride.", source:"Eddy Merckx" }
    ],
    rowing: [
      { text:"The body achieves what the mind believes.", source:"Training maxim" },
      { text:"Rhythm, patience, pressure. Win the next stroke.", source:"Bell Performance Coach" },
      { text:"Smooth is efficient. Efficient becomes fast.", source:"Bell Performance Coach" }
    ],
    "hiking / rucking": [
      { text:"The summit is earned one step at a time.", source:"Bell Performance Coach" },
      { text:"Carry the load. Control the pace. Keep moving.", source:"Bell Performance Coach" },
      { text:"The mountains are calling and I must go.", source:"John Muir" }
    ],
    "sprint / field": [
      { text:"The will to win is important, but the will to prepare is vital.", source:"Joe Paterno" },
      { text:"Speed is a skill. Practice it fresh and practice it well.", source:"Bell Performance Coach" },
      { text:"Every rep should look explosive before it feels exhausting.", source:"Bell Performance Coach" }
    ],
    swimming: [
      { text:"You cannot put a limit on anything. The more you dream, the farther you get.", source:"Michael Phelps" },
      { text:"The water does not care how you feel. Find your rhythm and keep moving.", source:"Bell Performance Coach" },
      { text:"Technique saves energy. Patience builds distance.", source:"Bell Performance Coach" }
    ],
    "general conditioning": [
      { text:"The work does not have to be glamorous. It has to be completed.", source:"Bell Performance Coach" },
      { text:"Your engine is built in the ordinary sessions you refuse to skip.", source:"Bell Performance Coach" },
      { text:"Consistency turns effort into capacity.", source:"Bell Performance Coach" }
    ]
  };

  const stoic = [
    { text:"You have power over your mind—not outside events. Realize this, and you will find strength.", source:"Marcus Aurelius" },
    { text:"First say to yourself what you would be; and then do what you have to do.", source:"Epictetus" },
    { text:"We suffer more often in imagination than in reality.", source:"Seneca" },
    { text:"The impediment to action advances action. What stands in the way becomes the way.", source:"Marcus Aurelius" }
  ];

  function dayNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - start) / 86400000);
  }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pick(list, seed) {
    return list[hash(seed) % list.length];
  }

  function activeGoals() {
    const dual = data?.trainingBlock?.dualGoals || {};
    return {
      strength: String(dual.strengthGoal || data?.trainingBlock?.goalType || "Hybrid").toLowerCase(),
      engine: String(dual.engineMode || data?.settings?.cardioType || "Running").toLowerCase()
    };
  }

  function faithDay(pref, day) {
    if (pref.style === "Faith-Based") return true;
    if (pref.style !== "Mixed") return false;
    if (pref.scriptureFrequency === "Daily") return true;
    if (pref.scriptureFrequency === "Several") return [1, 3, 5].includes(day % 7);
    return day % 7 === 0;
  }

  function selected() {
    const pref = data?.settings?.coachMessages || {};
    if (pref.style === "Off") return null;
    const day = dayNumber();
    const goals = activeGoals();

    if (faithDay(pref, day)) {
      const item = pick(scripture, `${day}|faith|${goals.strength}|${goals.engine}`);
      return [item.text, item.source];
    }

    if (pref.style === "Stoic") {
      const item = pick(stoic, `${day}|stoic`);
      return [item.text, item.source];
    }

    // Alternate Strength and Engine emphasis so both active missions are represented.
    const useStrength = day % 2 === 0;
    const category = useStrength ? "Strength" : "Engine";
    const modality = useStrength ? goals.strength : goals.engine;
    const library = useStrength ? strength : engine;
    const pool = [...(library[modality] || []), ...library.default];
    const item = pick(pool, `${day}|${category}|${modality}`);
    return [item.text, `${item.source} • ${category}`];
  }

  return { selected };
})();
