/* =====================================================================
   Plotter — Story templates

   Every template on the Templates page (homepage.html) has a playable
   starter story here. A template becomes:

     1. Opening      — narrator + characters set the scene
     2. Decision     — a branching choice (two paths)
     3. Path A / B   — a reply for each path, both lead on
     4. Checkpoint   — a graded quiz question (10 pts) with feedback
     5. Ending       — closing line + ending title

   PlotterTemplates.toBuilder(tpl) → story for the blank workspace editor
                                     (same model as story-builder.js)
   PlotterTemplates.toPlay(tpl)    → steps for play.html (Preview)

   Needs images/characters/characters.js loaded first (CHARACTER_LIBRARY).

   Template spec:
     cast:  [name, name]            names from CHARACTER_LIBRARY
     bg:    [file, file, file]      images/backgrounds/<file> for scenes 1, 2–3, 4–5
     intro: [[who, text], …]        who = 'n' (narrator) or 0 / 1 (cast slot)
     choice:[prompt, [optionA, replyA], [optionB, replyB]]   replies spoken by cast[0]
     quiz:  [question, [opt, opt, opt], correctIndex, rightFeedback, wrongFeedback]
     end:   [who, text, endingTitle]
   ===================================================================== */
(function(){
  const STAGE_W = 640, STAGE_H = 400;
  const SPRITE_BASE_HEIGHT = 320;           // must match blank_workspace.html
  const BOX_W = 460;                        // .p-dialogue .placed-shell width
  const UI = { bg:'#ffffff', text:'#03114c', chip:'#03114c', chipText:'#ffffff', style:'classic' };

  const T = {};
  const add = (title, spec) => { T[slug(title)] = { title, ...spec }; };

  add("Journey Through the Solar System", {
    cast:['Radwer', 'Suzy'], bg:['sky.png', 'classroom_blue.png', 'rooftop.png'],
    intro:[['n', "Tonight the rooftop telescope is open — and Mr. Radwer has a mission for you."],
           [0, "We're charting a voyage from Mercury all the way out to Neptune."],
           [1, "Can we start with the planet that has rings?"]],
    choice:["Where should the voyage begin?",
      ["Start close to the Sun, at Mercury", "Good thinking — Mercury is the closest planet, so it's the natural first stop."],
      ["Jump straight to Saturn", "Saturn is stunning, but we'd skip four planets. Let's go in order so we can compare them."]],
    quiz:["Which planet is closest to the Sun?", ["Venus", "Mercury", "Mars"], 1,
      "Mercury orbits closest — a year there lasts just 88 Earth days.",
      "Mercury is closest. Venus is second, Earth third, then Mars."],
    end:[0, "From scorching Mercury to icy Neptune — eight worlds, one solar system.", "Mission Complete"],
  });
  add("The DNA Detectives", {
    cast:['Radwer', 'Justin'], bg:['clubroom.png', 'classroom.png', 'hallway.png'],
    intro:[['n', "A strange case lands on the science club's desk: two brown-eyed parents have a blue-eyed child."],
           [0, "Detectives, this mystery is written in DNA."],
           [1, "So how can that even happen?"]],
    choice:["How should the team investigate?",
      ["Draw a Punnett square for the parents", "Exactly. A Punnett square shows every allele combination the child could inherit."],
      ["Assume it's a mix-up", "A good detective tests the evidence first. Let's draw a Punnett square before jumping to conclusions."]],
    quiz:["Both parents carry one recessive blue-eye allele (Bb). What's the chance of a blue-eyed child?", ["0%", "25%", "50%"], 1,
      "bb appears in one of the four boxes — a 25% chance.",
      "Cross Bb × Bb: BB, Bb, Bb, bb. Only bb shows blue eyes — 1 in 4, or 25%."],
    end:[0, "Case closed. Recessive traits can hide for a generation and reappear.", "Case Closed"],
  });
  add("Ecosystem Explorer", {
    cast:['Radwer', 'Suzy'], bg:['campus_plaza.png', 'art_room_afternoon.png', 'bleachers.png'],
    intro:[['n', "Field-trip day. The class is mapping the food web around the school garden."],
           [0, "Every living thing here depends on something else."],
           [1, "Even the tiny bugs?"]],
    choice:["What do you observe first?",
      ["The plants and what eats them", "Smart start — plants are producers. Everything else in the web depends on them."],
      ["The hawk circling overhead", "The hawk is a top predator. To understand it, we trace its food back down to the plants."]],
    quiz:["What do we call organisms that make their own food from sunlight?", ["Consumers", "Decomposers", "Producers"], 2,
      "Producers like plants turn sunlight into energy for the whole ecosystem.",
      "Plants are producers — they make food from sunlight. Consumers eat other organisms; decomposers break down dead matter."],
    end:[0, "Remove one link and the whole web feels it. That's why ecosystems need balance.", "Web of Life"],
  });
  add("Ancient Egypt: The Pharaoh's Court", {
    cast:['Radwer', 'Miek'], bg:['throneroom.jpg', 'entrance.png', 'gate.jpg'],
    intro:[['n', "Thebes, 1350 BCE. You've just been named advisor to a young pharaoh."],
           [0, "The Nile floods soon. The pharaoh needs your counsel."],
           [1, "Advisor! The court is waiting."]],
    choice:["The flood is coming. What do you advise?",
      ["Prepare the fields to use the floodwater", "Wise. The flood leaves rich black silt — the gift that feeds all of Egypt."],
      ["Build walls to keep the water out", "Walls would block the silt that makes our soil fertile. Egypt depends on the flood."]],
    quiz:["Why was the yearly Nile flood important to ancient Egyptians?", ["It left fertile soil for farming", "It protected cities from invaders", "It cooled the desert"], 0,
      "The flood deposited silt that made farming possible along the river.",
      "The flood mattered because it left rich, fertile silt — the basis of Egyptian farming."],
    end:[0, "The harvest is plentiful, and the pharaoh trusts your counsel.", "Trusted Advisor"],
  });
  add("Pythagoras and the Lost Temple", {
    cast:['Radwer', 'Hugh'], bg:['stairs.png', 'hallway.png', 'rooftop.png'],
    intro:[['n', "Behind a locked door in the old wing, a puzzle is carved into the stone."],
           [0, "To open it, you'll need the work of Pythagoras."],
           [1, "Triangles? On a door?"]],
    choice:["The door shows a right triangle with legs 3 and 4. What do you do?",
      ["Use a² + b² = c² to find the long side", "Right approach. The long side is the hypotenuse, and the theorem lets us find it."],
      ["Guess the missing side", "Guessing won't open a temple door. The Pythagorean theorem gives an exact answer."]],
    quiz:["A right triangle has legs of 3 and 4. How long is the hypotenuse?", ["5", "6", "7"], 0,
      "3² + 4² = 9 + 16 = 25, and √25 = 5.",
      "Square the legs and add: 9 + 16 = 25. The square root of 25 is 5."],
    end:[0, "The stone slides open. Geometry was the key all along.", "The Temple Opens"],
  });
  add("The Underground Railroad", {
    cast:['Radwer', 'Suzy'], bg:['library_outside.png', 'classroom.png', 'desk_night.png'],
    intro:[['n', "In history class, Mr. Radwer opens a journal kept by a conductor on the Underground Railroad."],
           [0, "These pages describe people who risked everything for freedom."],
           [1, "How did they know which way to go?"]],
    choice:["What do you want to learn about first?",
      ["How freedom seekers navigated at night", "Many followed the North Star, using the Big Dipper to find it."],
      ["Who helped them along the way", "Conductors and station masters — free Black people, formerly enslaved people, and allies — offered shelter and guidance."]],
    quiz:["What did many freedom seekers use to find their way north at night?", ["The North Star", "The Moon's phases", "Church bells"], 0,
      "The North Star, found using the Big Dipper, pointed the way north.",
      "Many followed the North Star — the “drinking gourd” (Big Dipper) helped them find it."],
    end:[0, "Courage, community, and resistance carried people to freedom. Their stories matter.", "Remembering the Journey"],
  });
  add("The Fraction Kingdom", {
    cast:['Hugh', 'Miek'], bg:['throneroom.jpg', 'gate.jpg', 'entrance.png'],
    intro:[['n', "The Fraction Kingdom is in chaos — the royal bakery split the bread unfairly."],
           [1, "Halt! No one enters until the bread is shared fairly."],
           [0, "Then let's figure out what fair looks like."]],
    choice:["There are 2 loaves for 4 villagers. What's your plan?",
      ["Cut each loaf in half", "Each villager gets one half — fair and simple."],
      ["Give each villager a whole loaf", "We only have 2 loaves. We need to split them into equal parts."]],
    quiz:["Which fraction is equal to 2/4?", ["1/3", "1/2", "3/4"], 1,
      "2/4 simplifies to 1/2 — divide the top and bottom by 2.",
      "Divide the top and bottom of 2/4 by 2 to get 1/2."],
    end:[1, "The kingdom is fair again! You may pass.", "Order Restored"],
  });
  add("Probability Island", {
    cast:['Justin', 'Suzy'], bg:['sky.png', 'campus_plaza.png', 'bleachers.png'],
    intro:[['n', "Your class sailing trip went off course. You've washed up on a strange island."],
           [0, "Two paths, and a bag of colored stones. Everything here runs on chance."],
           [1, "Then let's make our chances count."]],
    choice:["A sign says: draw a stone — blue means the safe path. The bag holds 3 blue and 1 red.",
      ["Draw — the odds are good", "3 out of 4 stones are blue. That's a 75% chance — good odds."],
      ["Don't draw, wait for rescue", "Waiting has no guaranteed outcome. With 3 blue out of 4, drawing is a smart risk."]],
    quiz:["A bag has 3 blue stones and 1 red stone. What is the probability of drawing blue?", ["1/4", "1/2", "3/4"], 2,
      "3 blue out of 4 total stones = 3/4.",
      "Probability = favorable ÷ total: 3 blue ÷ 4 stones = 3/4."],
    end:[0, "Smart choices, one probability at a time. Rescue boat ahead!", "Rescued"],
  });
  add("The Poet's Notebook", {
    cast:['Suzy', 'Hugh'], bg:['art_room_afternoon.png', 'library_outside.png', 'rooftop.png'],
    intro:[['n', "You find a traveling poet's notebook on a bench. Half its pages are blank."],
           [0, "There's a note: “Finish my poems, and you'll finish my journey.”"],
           [1, "Let's read the first one."]],
    choice:["The first poem is about the sea. How should the next line feel?",
      ["Use imagery — describe sights and sounds", "Yes — “waves whisper silver songs” lets the reader see and hear the sea."],
      ["Just say the sea is nice", "That tells us, but doesn't show us. Poets use imagery so readers feel the scene."]],
    quiz:["Which line uses a simile?", ["The wind howled all night.", "Her voice was like warm honey.", "The sun rose slowly."], 1,
      "“Like warm honey” compares two things using “like” — that's a simile.",
      "A simile compares two things using “like” or “as” — “like warm honey.”"],
    end:[0, "The notebook is full. The poet's journey — and yours — is complete.", "Final Verse"],
  });
  add("Chapters of Change", {
    cast:['Justin', 'Radwer'], bg:['hallway.png', 'classroom_outside.png', 'stairs.png'],
    intro:[['n', "You step inside a coming-of-age novel. The main character, Sam, faces a hard choice."],
           [0, "Sam's best friend wants to skip the big exam to go to the fair."],
           [1, "What Sam decides will shape who Sam becomes."]],
    choice:["What should Sam do?",
      ["Stay and take the exam", "Sam stays. It's harder, but Sam starts to take responsibility."],
      ["Go to the fair", "Sam goes — and later faces the consequences. Growth often comes from mistakes."]],
    quiz:["A character who changes significantly over a story is called a:", ["Static character", "Dynamic character", "Flat character"], 1,
      "A dynamic character grows or changes through the story.",
      "Characters who grow or change are dynamic. Static characters stay the same."],
    end:[1, "Every choice was a chapter. Sam — and you — have grown.", "A New Chapter"],
  });
  add("Mystery on Baker Street", {
    cast:['Justin', 'Hugh'], bg:['desk_night.png', 'hallway.png', 'library_outside.png'],
    intro:[['n', "London, 1890. A rare manuscript has vanished from a locked study."],
           [0, "No broken window, no forced lock. Curious."],
           [1, "Then the thief must have had a key."]],
    choice:["Which clue do you examine first?",
      ["The muddy footprints by the door", "Fresh red clay — the same clay found only by the gardener's shed."],
      ["The empty bookshelf", "Dusty, except for one clean gap — the book was taken recently. But the floor holds better clues."]],
    quiz:["What do we call using clues and reasoning to reach a likely conclusion?", ["Inference", "Opinion", "Summary"], 0,
      "Inference: combining evidence with reasoning to reach a conclusion.",
      "Detectives use inference — combining clues with reasoning to reach a conclusion."],
    end:[0, "The clay led us to the culprit. Clues, carefully read, never lie.", "Case Solved"],
  });
  add("On the Silk Road", {
    cast:['Radwer', 'Suzy'], bg:['entrance.png', 'campus_plaza.png', 'student_center.png'],
    intro:[['n', "Chang'an, 700 CE. You join a merchant caravan heading west along the Silk Road."],
           [0, "Our camels carry silk. What we bring back depends on how we trade."],
           [1, "And on what we learn along the way!"]],
    choice:["At a busy market in Samarkand, what do you do?",
      ["Trade silk for spices and glassware", "A fine trade. Goods moved both ways — and so did ideas."],
      ["Keep all the silk for later", "Merchants traded at every stop. Hoarding goods misses the exchange that made the route valuable."]],
    quiz:["Besides goods, what else spread along the Silk Road?", ["Ideas, religions, and technologies", "Only gold", "Nothing else"], 0,
      "Paper-making, religions, and ideas traveled the route alongside silk.",
      "The Silk Road spread ideas, religions, and inventions like paper — not just goods."],
    end:[0, "Our caravan returns richer in goods and in knowledge.", "Journey's End"],
  });
  add("Bonjour, Paris!", {
    cast:['Suzy', 'Hugh'], bg:['campus_plaza.png', 'student_center.png', 'entrance.png'],
    intro:[['n', "Your exchange trip has arrived in Paris. First stop: a little café."],
           [0, "Bonjour ! Everything on the menu is in French."],
           [1, "Time to practice."]],
    choice:["The waiter arrives. How do you greet them?",
      ["« Bonjour, monsieur ! »", "Parfait ! Greeting with “Bonjour” is polite and expected in France."],
      ["« Salut ! »", "“Salut” is for friends. With a waiter, “Bonjour, monsieur” is more polite."]],
    quiz:["How do you politely ask for a croissant?", ["Je veux croissant.", "Un croissant, s'il vous plaît.", "Croissant, merci."], 1,
      "“S'il vous plaît” means please — very polite.",
      "Say “Un croissant, s'il vous plaît” — “s'il vous plaît” means please."],
    end:[0, "Merci et au revoir ! Your French is off to a great start.", "Au revoir, Paris !"],
  });
  add("Tokyo Transit", {
    cast:['Justin', 'Suzy'], bg:['entrance.png', 'campus_plaza.png', 'stairs.png'],
    intro:[['n', "You've just landed in Tokyo and need to reach Shibuya Station."],
           [0, "The signs are in Japanese. Let's ask someone for help."],
           [1, "Remember to be polite!"]],
    choice:["How do you start talking to a stranger?",
      ["“Sumimasen” (Excuse me)", "Perfect. “Sumimasen” is the polite way to get someone's attention."],
      ["Just point at the map", "Pointing works, but starting with “Sumimasen” is much more polite."]],
    quiz:["What does “Arigatou gozaimasu” mean?", ["Good morning", "Thank you very much", "Where is the station?"], 1,
      "Arigatou gozaimasu = thank you very much.",
      "“Arigatou gozaimasu” means “thank you very much.”"],
    end:[0, "We made it to Shibuya! Arigatou gozaimasu for the help.", "Arrived in Shibuya"],
  });
  add("Global Citizen", {
    cast:['Suzy', 'Radwer'], bg:['student_center.png', 'ssc_office.png', 'campus_plaza.png'],
    intro:[['n', "The student council is hosting an international exchange week."],
           [0, "Our visitors come from five countries. How do we make everyone feel welcome?"],
           [1, "Start by learning about each other."]],
    choice:["A visitor's customs are different from yours. What do you do?",
      ["Ask respectful questions to understand", "Curiosity and respect build connection — that's what global citizens do."],
      ["Expect them to follow your customs", "Expecting others to change shuts out connection. Asking questions helps us understand each other."]],
    quiz:["Which action best shows global citizenship?", ["Ignoring news from other countries", "Learning about other cultures and global issues", "Only buying local goods"], 1,
      "Global citizens stay informed and respect other cultures.",
      "Global citizenship means learning about other cultures and caring about global issues."],
    end:[1, "A week of learning — and new friends across five countries.", "Connected World"],
  });
  add("The Vote That Mattered", {
    cast:['Hugh', 'Radwer'], bg:['ssc_office.png', 'student_center.png', 'dept_building.png'],
    intro:[['n', "It's election day in your town. A vote on a new library is too close to call."],
           [0, "Do I really need to vote? It's just one vote."],
           [1, "Every vote counts — especially in a close race."]],
    choice:["Before voting, what do you do?",
      ["Research both sides of the issue", "Informed voters weigh the facts. It's one of a citizen's most important duties."],
      ["Vote however my friends vote", "Friends' opinions matter, but your vote should reflect your own informed choice."]],
    quiz:["Why is voting important in a democracy?", ["It lets citizens choose leaders and decide issues", "It's required for school", "It only matters in big elections"], 0,
      "Voting gives citizens a voice in who leads and what gets decided.",
      "In a democracy, voting lets citizens choose leaders and shape decisions — in every election."],
    end:[1, "The library passed by 12 votes. Your voice made a difference.", "Your Voice Counted"],
  });
  add("The Impressionist's Eye", {
    cast:['Suzy', 'Hugh'], bg:['art_room.png', 'art_room_afternoon.png', 'campus_plaza.png'],
    intro:[['n', "Paris, 1874. You step into a painter's studio, sunlight pouring in."],
           [0, "These paintings look blurry up close — but beautiful from far away."],
           [1, "That's the point. They're painting light, not lines."]],
    choice:["You're handed a brush. How do you paint the river?",
      ["Quick, visible brushstrokes to catch the light", "Exactly what the Impressionists did — capturing a moment of light and color."],
      ["Careful, smooth detail", "That's how academic painters worked. Impressionists used loose, quick strokes to capture light."]],
    quiz:["What were Impressionist painters most interested in capturing?", ["Light and atmosphere", "Perfect realistic detail", "Religious stories"], 0,
      "Impressionists focused on changing light and fleeting moments.",
      "Impressionists cared most about light and atmosphere, often painting outdoors."],
    end:[0, "Your painting glows like a morning on the river. Bravo!", "First Exhibition"],
  });
  add("Sound & Story", {
    cast:['Justin', 'Hugh'], bg:['clubroom.png', 'classroom_blue.png', 'bleachers.png'],
    intro:[['n', "Band practice. The concert is next week, and the song isn't working yet."],
           [0, "Something's off with the rhythm."],
           [1, "Let's count it out together."]],
    choice:["The song is in 4/4 time. How do you fix the rhythm?",
      ["Count four beats per measure", "That's it — 4/4 means four quarter-note beats in every measure."],
      ["Play faster and hope it works", "Speed won't fix timing. Counting the beats keeps everyone together."]],
    quiz:["In 4/4 time, how many quarter-note beats are in each measure?", ["2", "3", "4"], 2,
      "4/4: four beats per measure, and the quarter note gets one beat.",
      "The top number tells you beats per measure — in 4/4, that's four."],
    end:[0, "The band locks in. Next week's concert is going to sound great.", "Encore!"],
  });
  add("Mind Matters", {
    cast:['Suzy', 'Radwer'], bg:['classroom.png', 'rooftop.png', 'art_room_afternoon.png'],
    intro:[['n', "It's the week before finals. Suzy has barely slept."],
           [0, "I have so much to study. I feel like I can't breathe."],
           [1, "That sounds really stressful. Let's talk about it."]],
    choice:["What could help Suzy right now?",
      ["Take a few slow, deep breaths", "Okay… that actually helps a little. My heart's slowing down."],
      ["Keep studying all night", "I tried that last night… I just felt worse. Maybe rest matters too."]],
    quiz:["Which is a healthy way to cope with stress?", ["Talking to someone you trust", "Skipping meals to study more", "Keeping your feelings to yourself"], 0,
      "Sharing how you feel with someone you trust is a powerful coping strategy.",
      "Talking with someone you trust helps. Skipping meals or bottling up feelings tends to make stress worse."],
    end:[1, "Asking for help is a strength. The counselor's door is always open.", "Taking Care"],
  });
  add("The Nutrition Lab", {
    cast:['Radwer', 'Hugh'], bg:['student_center.png', 'classroom.png', 'campus_plaza.png'],
    intro:[['n', "You've been put in charge of the school cafeteria for a week."],
           [0, "Your job: plan lunches that are tasty and balanced."],
           [1, "Pizza every day?"]],
    choice:["What's on Monday's menu?",
      ["Grilled chicken, rice, vegetables, and fruit", "A balanced plate — protein, grains, vegetables, and fruit."],
      ["Fries and soda", "Tasty, but low in nutrients. A balanced lunch needs protein, grains, fruits, and vegetables."]],
    quiz:["Which food group is the body's main source of quick energy?", ["Carbohydrates (grains)", "Fats", "Vitamins"], 0,
      "Grains like rice and bread provide carbohydrates — fast energy.",
      "Carbohydrates from grains are the body's main quick-energy source."],
    end:[0, "Students are energized — and they asked for seconds at the salad bar!", "Head Chef"],
  });

  /* ------------------------------------------------------------------ helpers */
  function slug(title){ return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  const uid = p => (p || 's') + Math.random().toString(36).slice(2, 8);
  const lib = () => Array.isArray(window.CHARACTER_LIBRARY) ? window.CHARACTER_LIBRARY : [];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* A character placed on the canvas, drawn the same way as setSpritePose() in blank_workspace.html. */
  function spriteEl(charIndex, slot){
    const c = lib()[charIndex]; if(!c) return null;
    const pose = c.defaultPose || 0, p = c.poses[pose] || c.poses[0], k = c.crop;
    const h = SPRITE_BASE_HEIGHT * k.h / k.imgH, w = h * k.w / k.h;
    const left = slot === 0 ? 50 : STAGE_W - 50 - w;
    const top = STAGE_H - h * 0.92;                       // feet just below the frame
    const img = `width:${k.imgW / k.w * 100}%; left:${-k.x / k.w * 100}%; top:${-k.y / k.h * 100}%;`;
    return {
      cls:'placed p-sprite has-img', left: Math.round(left), top: Math.round(top),
      data:{ type:'sprite', charIndex: String(charIndex), pose: String(pose), label: c.name, color:'#3c65a7', cFill:'#3c65a7' },
      shell:`<div class="placed-shell"><div class="char-frame" style="width: ${w}px; height: ${h}px;"><img alt="${esc(c.name)} – ${esc(p.label)}" style="${img}" src="${p.src}"></div></div>`,
    };
  }
  function boxEl(){
    return {
      cls:'placed p-dialogue', left:(STAGE_W - BOX_W) / 2, top: STAGE_H - 140,
      data:{ type:'dialogue', label:'Speaker', color:'#3c65a7' },
      shell:'<div class="placed-shell"><span class="sp-chip" contenteditable="false" spellcheck="false">Speaker</span><div class="txt" contenteditable="false" spellcheck="false"></div></div>',
    };
  }
  function pillEl(choice, k){
    return {
      cls:'placed p-choice', left:160, top:30 + k * 46,
      data:{ type:'choice', choiceId: choice.id, color:'#3c65a7' },
      shell:`<div class="placed-shell" contenteditable="false" spellcheck="false">${esc(choice.text)}</div>`,
    };
  }

  /* ------------------------------------------------------------------ template → editor story */
  function toBuilder(tpl){
    const L = lib();
    const castIdx = tpl.cast.map(n => L.findIndex(c => c.name === n));
    const who = w => w === 'n' ? 'n' : (castIdx[w] >= 0 ? castIdx[w] : 'n');
    const bgPath = f => 'images/backgrounds/' + f;
    const sprites = () => castIdx.map((ci, slot) => ci >= 0 ? spriteEl(ci, slot) : null).filter(Boolean);
    const scene = (name, bg, extra) => ({
      id: uid(), name, lines: [], prompt:'', choices: [], quiz:{ on:false, points:10, correctId:null },
      next:null, ending:false, endingTitle:'',
      layout:{ color:'#f7f8fa', image: bgPath(bg), els: [...sprites(), boxEl()] },
      ...extra,
    });

    const [prompt, [aText, aReply], [bText, bReply]] = tpl.choice;
    const [question, opts, correct, right, wrong] = tpl.quiz;
    const [endWho, endText, endTitle] = tpl.end;

    const s1 = scene('Opening', tpl.bg[0], { lines: tpl.intro.map(([w, text]) => ({ who: who(w), text })) });
    const s2 = scene('Decision', tpl.bg[1], { prompt });
    const s3a = scene('Path: ' + shorten(aText), tpl.bg[1], { lines:[{ who: who(0), text: aReply }] });
    const s3b = scene('Path: ' + shorten(bText), tpl.bg[1], { lines:[{ who: who(0), text: bReply }] });
    const s4 = scene('Checkpoint quiz', tpl.bg[2], { lines:[{ who: who(0), text:"Quick check before we go on." }], prompt: question });
    const s5 = scene('Ending', tpl.bg[2], { lines:[{ who: who(endWho), text: endText }], ending:true, endingTitle: endTitle });

    s1.next = s2.id; s3a.next = s4.id; s3b.next = s4.id;
    s2.choices = [{ id:uid('c'), text:aText, to:s3a.id, fb:'' }, { id:uid('c'), text:bText, to:s3b.id, fb:'' }];
    s4.choices = opts.map((text, k) => ({ id:uid('c'), text, to:s5.id, fb: k === correct ? right : wrong }));
    s4.quiz = { on:true, points:10, correctId: s4.choices[correct].id };
    [s2, s4].forEach(s => s.layout.els.push(...s.choices.map(pillEl)));

    return { title: tpl.title, template: slug(tpl.title), scenes:[s1, s2, s3a, s3b, s4, s5] };
  }
  function shorten(t){ t = t.replace(/[«»“”"]/g, '').trim(); return t.length > 28 ? t.slice(0, 26).trim() + '…' : t; }

  /* ------------------------------------------------------------------ template → play.html steps
     Mirrors compile() in story-builder.js. */
  function toPlay(tpl){
    const story = toBuilder(tpl), L = lib();
    const steps = [];
    story.scenes.forEach(s => {
      const els = s.layout.els.filter(e => !/\bp-(dialogue|choice)\b/.test(e.cls))
        .map(e => ({ cls:e.cls, left:e.left, top:e.top, key: e.data.charIndex !== undefined ? 'c' + e.data.charIndex : null, shell:e.shell }));
      const head = { id:s.id, layout:{ w:STAGE_W, h:STAGE_H, color:s.layout.color, image:s.layout.image, els }, ui:{ ...UI } };
      const sc = s.lines.map(l => ({ type:'line', who: l.who === 'n' ? 'Narrator' : 'c' + l.who, name: l.who === 'n' ? '' : (L[l.who] || {}).name || '', text:l.text }));
      if(s.choices.length){
        const opt = c => ({ text:c.text, next:c.to });
        sc.push(s.quiz.on
          ? { type:'quiz', question:s.prompt, points:s.quiz.points, right:'Correct!', wrong:'Not quite.',
              options: s.choices.map(c => ({ ...opt(c), correct: c.id === s.quiz.correctId, fb:c.fb })) }
          : { type:'choice', prompt:s.prompt, options: s.choices.map(opt) });
      } else if(s.ending) sc.push({ type:'end', title:s.endingTitle });
      else if(s.next){ if(sc.length) sc[sc.length - 1].next = s.next; else sc.push({ type:'goto', next:s.next }); }
      Object.assign(sc[0], head);
      steps.push(...sc);
    });
    steps.push({ id:'__end', type:'end', title:'The End' });
    return { title: tpl.title, subtitle:`Template preview · ${story.scenes.length} scenes`, steps };
  }

  window.PlotterTemplates = {
    slug,
    get: key => T[key] || T[slug(key)] || null,
    all: () => Object.values(T),
    toBuilder, toPlay,
  };
})();
