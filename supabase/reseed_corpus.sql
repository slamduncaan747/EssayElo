-- Margin corpus seed (additive, safe to re-run).
-- Adds any missing anchor/seed essays; never touches rows already present,
-- so accreted ratings and referencing match history are preserved.

create unique index if not exists corpus_essays_label_key
  on public.corpus_essays (label);

insert into public.corpus_essays
  (content, source, locked, elo, match_count, prose_score, label)
values
  ('People always ask me how I manage to be good at so many things. Honestly, I don''t have a great answer. Some people are just built to lead, and I''ve known since middle school that I''m one of them.

Take my robotics team. Before I joined, they had never made it past regionals. The other members were content with mediocrity, showing up to meetings to socialize instead of work. I don''t operate that way. I took over the design process, redid the code myself because frankly it was faster than explaining it, and we made it to states. Some teammates complained that I didn''t "collaborate," but results speak for themselves. You can''t argue with a trophy.

School comes easily to me, which teachers sometimes resent. In AP History, I corrected Mr. Daniels so often that he stopped calling on me, which says more about him than about me. I''ve learned that excellence makes people uncomfortable. That''s their problem to solve, not mine.

What do I want from college? A place that can finally keep up. I want professors who challenge me instead of feeling threatened, and classmates who don''t need me to carry every group project — though if I''m being realistic, I''ll probably end up carrying some anyway. I''ve made my peace with that. It''s the tax you pay for being capable.

My guidance counselor told me to write this essay about a time I failed. I considered it, but the truth is my failures have all been other people''s failures that I couldn''t fully compensate for. The generator of my success is internal, and it hasn''t stopped running yet. Whichever college is lucky enough to get me will find that out quickly.', 'anchor', true, 1100, 999, 42, 'anchor-10-self-damaging'),
  ('The whistle blew and I went down hard. As I lay on the turf clutching my knee, I didn''t know it yet, but my life was about to change forever.

Tearing my ACL junior year was the hardest thing I have ever gone through. Soccer had been my life since I was five years old. I had dreamed of playing in college, and in one moment, that dream was taken away from me. At first, I was devastated. I didn''t want to talk to anyone. I felt like I had lost a part of myself.

But as the months of physical therapy went on, I began to realize something important. I had defined myself by one thing for so long that I had never explored who else I could be. I started spending more time on my schoolwork, and my grades improved. I joined the yearbook club and discovered I enjoyed photography. I even became a student athletic trainer, helping other athletes recover from their injuries the way my trainers had helped me.

Recovery taught me the true meaning of resilience. Every small step — walking without crutches, jogging for the first time, finally sprinting again — showed me that progress comes from showing up every day, even when it''s hard. I learned that setbacks are really setups for comebacks.

Now, as I prepare for college, I know that whatever challenges come my way, I can handle them. My injury didn''t end my story; it started a new chapter. I may never play competitive soccer again, but the lessons I learned from losing it will stay with me forever. I am stronger, more well-rounded, and more grateful than I was before. And for that, I have a torn ligament to thank.', 'anchor', true, 1250, 999, 40, 'anchor-25-competent-weak'),
  ('My grandmother''s kitchen smelled of cardamom and burnt sugar, and it is the first place I remember feeling entirely safe.

Every summer until I was fourteen, I spent July in her apartment in Queens, standing on a plastic stool at her counter while she cooked. She never used recipes. She measured rice in the cup of her palm and salt by the sound it made leaving the jar. When I asked how she knew, she would tap her temple and say, in Urdu, "The hands remember what the heart has practiced."

She came to this country in 1974 with two suitcases and a husband she had known for six weeks. She raised four children in three rooms. She learned English from soap operas and the labels of canned goods. None of this she told me as struggle — it came out in fragments while the onions softened, the way other people hum.

Last spring, she had a stroke. The hands that remembered everything now tremble too much to hold a knife. So on Sundays I cook for her. I stand in her kitchen, on the same side of the counter she once stood, and I try to measure rice in my palm. I get it wrong. She laughs at me from her chair, corrects me in two languages, and for an hour the apartment fills with cardamom and it is 2014 again.

I used to think her cooking was about food. I understand now that it was about continuity — a way of carrying a village across an ocean one meal at a time. When I cook for her, I am not repaying a debt. I am accepting an inheritance.

I don''t know yet what I will study, or what I will become. But I know what I carry: the patience to practice something until my hands remember it, and the understanding that love, most of the time, looks like showing up on Sunday and getting the rice slightly wrong.', 'anchor', true, 1450, 999, 68, 'anchor-45-linchpin-polished-familiar'),
  ('I keep a spreadsheet of every word I''ve ever mispronounced in public. It has 217 entries. Column D is "witnesses."

It started in seventh grade when I said "epitome" to rhyme with "metronome" in front of my English class, and a girl named Dana laughed so hard she had to leave the room. That night, instead of dying of shame like a normal person, I opened Google Sheets. Word: epitome. Correct pronunciation: ih-PIT-uh-mee. Witnesses: 24. Somehow, writing it down converted the humiliation into data, and data doesn''t hurt.

The spreadsheet taught me something no class has: I only mispronounce words I learned from books. Awry, chaos, segue, hyperbole — my whole catalog of errors is a map of words that entered through my eyes and never passed through anyone''s mouth. Every entry is proof I read something before I was ready for it. Dana laughed at the exact place where my reading outran my life.

So now I read the spreadsheet differently. Its real title is "words I met alone."

I''ve started collecting other people''s entries too. My calculus teacher says "FOY-er" for foyer and I have never corrected him, because I recognize the shape of it — he met that word alone too, probably in a novel, probably at an age when no one around him said foyer out loud. There is a whole hidden population of us, people whose vocabularies are bigger than our towns.

I don''t fully know what I want to do with this, which my college counselor says is a problem with this essay. But somewhere between the data and the embarrassment is the thing I actually am: a person who would rather log the wound than hide it, who thinks a mistake is just a fact you haven''t organized yet. Column E, which I added last year, is "would I unlearn this word to avoid the embarrassment?"

Two hundred and seventeen rows. Every single one says no.', 'anchor', true, 1600, 999, 50, 'anchor-60-distinctive-uneven'),
  ('My father and I have argued about the same intersection for six years.

Not politics, not curfews — an intersection. Route 9 and Miller Road, where the left-turn arrow lasts eleven seconds. My father, who drove a city bus in Lagos before we came here, believes the arrow is too short by design: "They time the lights for the people leaving the nice neighborhood, not entering it." I believed, at eleven, that he was paranoid. So I did what I have always done when I think someone is wrong: I started counting.

I have now timed 41 intersections in our county, most of them twice, some at rush hour with my mother''s phone propped on the dashboard because two data points are better than one. My father was not paranoid. The arrows feeding the east side of town average 4.2 seconds shorter. I made a map. The short arrows trace the bus routes.

Here is the part I keep turning over: when I showed him the spreadsheet, my father was not triumphant. He was quiet for a long time, and then he said, "I did not want to be right. I wanted you to check."

I think about that sentence more than anything anyone has said to me. He had carried his hypothesis for years the way you carry something you can''t put down — and what he wanted wasn''t vindication but verification, from a son with a stopwatch and no reason to believe him. Being right was lonely. Being checked was love.

I''ve since presented the map to our town''s traffic subcommittee, who thanked me and changed nothing. I used to think that made the project a failure. But the subcommittee was never really the audience. The audience was a bus driver from Lagos who spent six years being told, by his own son, that he was imagining things — and who kept saying "go count it" anyway.

I want to spend my life counting the things people carry but can''t prove. Not because the committees will listen. Because someone at the kitchen table is waiting to be checked.', 'anchor', true, 1800, 999, 60, 'anchor-80-standout'),
  ('Last summer I went on a mission trip to Guatemala that changed my life. Before the trip, I took many things for granted, like clean water, my house, and my education. Seeing how the people there lived opened my eyes to how lucky I am.

We spent one week building a school for the children of the village. It was hard work in the hot sun, but seeing the smiles on the kids'' faces made it all worth it. Even though we did not speak the same language, we communicated through soccer and laughter. It showed me that people everywhere are the same at heart.

One little boy named Miguel followed me around all week. On the last day he gave me a bracelet his mother made. I almost cried. I still wear that bracelet every day to remind me of the lessons I learned in Guatemala.

This trip taught me not to take things for granted and that helping others is the most rewarding thing you can do. It inspired me to start a volunteer club at my school where we do community service projects every month. We have already done a canned food drive and a park cleanup.

In college I want to continue giving back to the community and maybe study abroad to experience more cultures. The world is a big place and I have learned that we all have something to learn from each other. Guatemala will always have a special place in my heart, and I will never forget the people who taught me that happiness doesn''t come from what you have, but from what you give.', 'seed', false, 1150, 6, 33, 'seed-15-generic-mission'),
  ('Throughout my four years of high school, I have challenged myself in many ways that have prepared me for college and beyond.

As president of the National Honor Society, I organized our chapter''s largest tutoring program ever, with over thirty student volunteers. Balancing this with my responsibilities as varsity tennis captain and first-chair violin taught me time management skills that I know will serve me well. There were weeks when I went straight from practice to rehearsal to a leadership meeting, and I learned to use every spare minute productively.

Academically, I have taken the most rigorous course load available at my school, including seven AP classes. My favorite was AP Biology, where I discovered my passion for the life sciences. Our teacher had us design our own experiments, and mine — testing how different light wavelengths affect plant growth — won third place at the regional science fair.

But my activities have taught me more than any single class. Tennis taught me perseverance, especially when I lost in the sectional finals junior year and had to rebuild my confidence. Violin taught me discipline, because no one becomes first chair without practicing when they would rather be with friends. And NHS taught me that leadership is about service, not titles.

I believe my combination of academic rigor, leadership experience, and extracurricular commitment makes me ready for the challenges of a top university. I am excited to bring my work ethic, curiosity, and dedication to a campus community, and to keep growing into the leader I know I can become.', 'seed', false, 1200, 6, 36, 'seed-20-resume-recital'),
  ('The day my parents told me they were getting divorced, I was twelve years old and had just come home from a friend''s birthday party. I remember the cake still sitting in my stomach while they sat me down in the living room and used calm voices that scared me more than yelling would have.

For a long time after that, I split my life into two backpacks. One week at Mom''s apartment, one week at Dad''s house. Two toothbrushes, two desks, two versions of myself. At Mom''s I was quieter, because she cried sometimes at night and I didn''t want to add to it. At Dad''s I was more cheerful than I felt, because he tried so hard with his frozen pizzas and movie nights.

Slowly, things got better. I got better. I learned to speak up when the schedule wasn''t working, and my parents, to their credit, listened. By high school, the two-backpack life felt normal, and I noticed something surprising: I had become the person my friends came to with their problems. I knew how to sit with someone who was hurting without trying to fix it immediately, because I had needed that myself.

The divorce also taught me that adults are just people. My parents made mistakes, apologized, and kept showing up. That might be the most important thing I''ve learned: love isn''t about being perfect, it''s about continuing to show up.

I wouldn''t wish those years on anyone, but I wouldn''t trade what they gave me either. I am more empathetic, more adaptable, and more honest about my feelings than I would have been otherwise. Whatever roommate I end up with in college, they''re getting someone who knows how to share a space, listen at midnight, and make a decent frozen pizza.', 'seed', false, 1280, 6, 44, 'seed-28-divorce-safe'),
  ('Three weeks before the regional robotics competition, our robot could not pick up a single ball. The intake mechanism we had spent two months designing jammed every third attempt, and morale in the workshop was at an all-time low.

As lead builder, I felt responsible. I had pushed for the complicated four-bar design over the simpler roller intake that our programmer, Kevin, had suggested. Admitting I was wrong was harder than any technical problem we faced that season. But one Tuesday night, staring at the jammed mechanism for the hundredth time, I turned to the team and said the words out loud: "Kevin was right. Let''s rebuild."

We had nineteen days. We divided into pairs and worked in shifts — CAD in the morning, fabrication after school, testing at night. I stayed late so many times that the janitor started leaving the side door unlocked for me. The new intake worked on the second try. It wasn''t elegant, but it swallowed balls like a vacuum cleaner, and at regionals we made it to the semifinals, the furthest our team had ever gone.

What I remember most isn''t the competition, though. It''s the moment I admitted the mistake. The room didn''t erupt in blame like I had feared. Instead, everyone just started solving. I learned that a team doesn''t need a leader who is always right; it needs a leader who tells the truth fast enough for the team to do something about it.

I plan to study mechanical engineering, and I know I will make more wrong calls — engineering is wrong calls, corrected. What robotics gave me is the reflex to say so out loud, on Tuesday, with nineteen days left, while there is still time to rebuild.', 'seed', false, 1320, 6, 41, 'seed-32-robotics-standard'),
  ('I have attended four schools in three states, and at every one of them I have been "the new kid" — a title that comes with an invisible clipboard. People decide things about you in the first week, and you spend the rest of the year living inside their decisions.

By the third move, the summer before ninth grade, I had developed a strategy: say yes to everything for one month. Yes to the lunch invitation from the theater kids, yes to the pickup basketball game where I knew nobody, yes to the study group for a class I was already good at. My mom called it my "yes month." It was exhausting and slightly fake, and it worked — not because I fooled anyone, but because saying yes that many times meant that by October, at least three of the yeses had turned into something real.

In Ohio, the yes that stuck was stage crew. In Arizona, it was cross country, a sport I was mediocre at and came to love precisely because nobody expected anything from me at it. Here in North Carolina, it was the school newspaper, where I now edit the features section and write a column reviewing gas station snacks, which is somehow the most popular thing I have ever done.

Moving taught me that belonging isn''t found, it''s constructed — one slightly forced yes at a time. I''ve watched kids who lived in the same town their whole lives feel more alone than I ever was, because they thought community was something that was supposed to just happen to them.

When I get to college, everyone will be the new kid at the same time. I already know what I''ll be doing that first month. My roommate should be warned: I will be saying yes to almost everything, and I will probably drag them with me.', 'seed', false, 1360, 6, 45, 'seed-36-moving-schools'),
  ('Register four at Hartley''s Market has a wobble. You have to shim the left leg with a folded receipt or the whole station rocks every time you scan a can. I know this because I have spent eleven hundred hours behind it.

I took the job sophomore year because my family needed me to, which is a sentence I used to be embarrassed by and am not anymore. Twenty hours a week, Thursday through Sunday. While my friends posted from football games, I was learning the produce codes by heart — 4011 bananas, 4064 tomatoes — and learning things about my town that you cannot learn anywhere but a checkout line.

You learn who is struggling by what they put back. It is almost never the junk food; it is the berries, the good cheese, the birthday candles. The first time I watched a mother return a cake mix while her kid stared at the belt, I rang it up anyway and paid the $2.19 from my own pocket. Mr. Hartley saw and didn''t say anything, which is how I learned he had been quietly doing the same thing for years, and that there was a whole shadow economy of small mercies running through that store.

I got faster, then I got promoted, then I started training new hires. My training speech has one rule in it that Mr. Hartley never taught me but I learned at register four: you are the last person some of these customers will talk to all day. Mrs. Okafor comes in daily for one apple and one conversation. The apple is an excuse.

I don''t romanticize the job. My feet hurt and the pay is what it is. But I have a education you can''t get in a classroom: eleven hundred hours of watching what people carry, and learning which small things I can do about it.', 'seed', false, 1400, 6, 46, 'seed-40-grocery-job'),
  ('I joined debate to learn how to talk. I stayed because it taught me how to lose.

My first tournament, I went 0-4. I had memorized statistics, framed arguments, practiced my closing in the mirror — and I lost every single round. On the bus home, my coach handed me the judges'' ballots. One comment appeared, in different handwriting, on three of the four: "Doesn''t respond to opponent''s actual arguments."

I had prepared a debate. My opponents had shown up to a conversation.

The fix was harder than it sounds. To actually respond to someone, you have to actually listen to them, and listening while planning your rebuttal is like reading while someone talks to you — you can fake it, but everyone can tell. So I made myself a rule that felt insane in a timed activity: during my opponent''s speech, I was not allowed to write my response. Only their argument, in their terms, as fairly as I could state it. My responses got shorter and better. My win rate climbed. By junior year I was in elimination rounds at states.

But the real evidence that debate changed me happened at Thanksgiving. My uncle said something about immigration that I disagreed with, and instead of loading my counterargument while he talked, I heard myself say, "So your actual worry is about wages, not culture — is that right?" He stopped. He said, "Yes. Nobody ever says that part back to me." We talked for an hour. I did not change his mind, and this time that genuinely wasn''t the point.

I used to think debate was the art of being unanswerable. It is closer to the opposite: the discipline of being answerable — of stating the other side so fairly that your disagreement, when it comes, actually lands on something real. I want to study law, where I am told listening is a competitive advantage. It shouldn''t be. But I''ll take it.', 'seed', false, 1420, 6, 48, 'seed-42-debate-listening'),
  ('The metronome on my piano is older than I am. It belonged to my first teacher, Mrs. Albrecht, who gave it to me when she retired, and its tick has been the background rhythm of my life for eleven years.

I was not a prodigy. This took me years to accept. At nine, I watched a boy my age play Chopin''s Fantaisie-Impromptu on YouTube and cried, because I was still counting quarter notes in a beginner book. My parents never pushed; if anything, they offered me exits. I refused them out of what I can only call stubbornness, because it certainly wasn''t talent.

What I had instead was the metronome. Forty beats per minute, then forty-four, then forty-eight. A passage that is impossible at performance tempo is merely tedious at half speed, and tedium, it turns out, is negotiable. I learned to break every hard thing into a speed at which it was boring, and then to be patient with the boring version. The Fantaisie-Impromptu took me four years of that. I performed it at the spring recital when I was fifteen. The boy on YouTube had played it better at nine, and I have never been prouder of anything.

Piano gave me a body of knowledge about myself that I apply everywhere. When calculus stopped making sense, I found the tempo at which it was boring — rederiving each rule until it was mechanical — and sped up from there. When I couldn''t run a mile, I ran a slow half mile for two weeks.

I will never be a concert pianist, and I have made peace with the metronome''s real lesson: talent sets the ceiling, but tempo sets the floor, and you can live a whole life raising the floor. Tick by tick, forty beats a minute, I intend to keep doing exactly that.', 'seed', false, 1450, 6, 52, 'seed-45-piano-competent'),
  ('My father doesn''t say "I love you." He says "merlin, two o''clock, on the wire."

We started birding when I was ten, after his heart surgery, when the doctor prescribed walking and my mother prescribed me as his companion. Neither of us wanted to be there. He walked too slowly; I complained too much. Then one morning a bird neither of us could name — gray, sharp-winged, sitting like a fist on a telephone wire — refused to be ignored. We looked it up together at the kitchen table. Merlin. A small falcon. My father, an accountant who had not expressed wonder in my presence in a decade, said "huh" in a voice I didn''t recognize.

Eight years later we have a life list of 214 species, kept in a shared note on our phones that is, if I''m being honest, the longest conversation we have ever had. My father is not a talker. Car rides used to be silent in a way that felt like a test I was failing. Now the silence has a purpose: we are listening. He hears woodpeckers before I do. I catch warblers he misses. We have developed an entire grammar of grunts and chin-points that means slow down, look left, wait.

I''ve come to think everyone bilingual in the same way — everyone has someone they love in a language that doesn''t use the usual words. My father''s dialect happens to have feathers. When I found a snowy owl at the county landfill last winter — a genuinely rare bird, a once-a-decade bird — I didn''t post it anywhere. I called him at work. He left early. We stood in the cold smell of garbage watching a white owl on a trash mountain, and he put his hand on my shoulder and left it there.

Merlin, two o''clock, on the wire. I know what it means. I say it back.', 'seed', false, 1480, 6, 50, 'seed-48-birdwatching-dad'),
  ('The app I built has fourteen users, and twelve of them are named Nguyen.

My grandmother came to live with us when I was in eighth grade, speaking Vietnamese and roughly forty words of English. My parents work doubles. So her doctor''s appointments became mine to translate — a fourteen-year-old explaining blood pressure medication in a language that doesn''t have a comfortable word for "co-pay."

The existing translation apps failed us constantly, and they failed in a specific way: they translated words, but medical conversations run on phrases — "on an empty stomach," "twice daily with food," "call if it gets worse." Google Translate turned "take as needed" into something my grandmother understood as "take when you want to," which, with blood thinners, is a genuinely dangerous sentence.

So the summer before junior year I taught myself enough React Native to be dangerous and built PhraseCard: a deck of two hundred pre-translated, pharmacist-verified medical phrases, Vietnamese and English side by side, big fonts, works offline. The verification was the hard part and the part I''m proudest of — I cold-emailed thirty pharmacies and got one, run by Mr. Tran in Garden Grove, to check every card during his slow hours. It took him three months. He fixed forty-one of my translations and taught me that "dizzy" in Vietnamese has four different words depending on the kind of dizzy, a fact no API knows.

Fourteen users. My grandmother, eleven of her friends from temple, Mr. Tran''s mother, and one stranger from an app store review that made me shout in the library. I check the analytics anyway, most mornings.

I''ve stopped being embarrassed by the number. Software people call this a failure to scale. But scale was never the point — precision was. Twelve elderly Vietnamese people take their medication correctly because a pharmacist in Garden Grove and a teenager with a laptop argued about the four kinds of dizzy. I want to build more things like that: small, correct, and for someone specific.', 'seed', false, 1520, 6, 47, 'seed-52-translation-app'),
  ('Lifeguarding is the only job where doing it perfectly looks identical to doing nothing at all.

Four summers at Kettle Creek Pool, and I have never once performed a dramatic rescue. No whistle-sprint-dive, no grateful parents, no local news. My entire career, measured in visible heroics, rounds to zero. It took me two summers to understand that this was the achievement.

Here is what lifeguarding actually is: scanning. Left to right, near to far, ten seconds a cycle, four hours a shift. You are not watching the pool; you are reading it, over and over, like a sentence that might change one word when you blink. And the job''s dirty secret is that the danger almost never announces itself. Drowning doesn''t splash. It''s quiet and vertical and looks, from fifty feet, like standing still. The whole skill is noticing that a thing which looks like nothing is not nothing.

So I became a scholar of almost. The kid whose bounces toward the deep end were carrying him a foot further each time — I moved him back before there was an incident, and to any observer, nothing happened. The tired dad whose toddler drifted while he checked his phone: nothing happened. Fifty times a summer, nothing happened, on purpose, because of me.

I started seeing it everywhere. My friend who got quiet in a specific way in March — that was vertical and silent too, and I asked the question that a splashier friend might have missed. Nothing happened. He''s fine now. He doesn''t know he was a save, which is what makes him one.

I want to study public health, the profession of nothing happening. Vaccination campaigns where the epidemic doesn''t occur; clean water systems where the outbreak never starts. Fields where success is a silence, and where somebody has to love the silence enough to keep scanning. I have four summers of practice.', 'seed', false, 1550, 6, 53, 'seed-55-lifeguard-boredom'),
  ('Every Sunday at the Spin City laundromat on Fourth Street, a man named Gus sets up a chessboard on the folding table and destroys all comers, and for two years the only person in the neighborhood who could occasionally beat him was a sixteen-year-old with a garbage bag full of towels. That was me, and those games are the reason I think the way I think.

We wash our own towels because my mom runs a hair salon out of our kitchen — unlicensed, which I''m told colleges like honesty, so: unlicensed. Sunday is towel day. Forty towels, two machines, ninety minutes. Gus noticed me watching his board the way hungry people watch food, and he said the sentence that changed my Sundays: "You play, or you just loiter?"

Gus does not teach like the internet teaches. No openings, no theory. He plays a move, and if it beats you, you have to say out loud what you should have been afraid of. That''s his whole method: fear, articulated. "You lost because you feared the wrong thing," he says, tapping the board. "Name the real fear." Rook traps, back-rank mates, my queen wandering off like a tourist — I have named them all at that folding table while my towels spun.

It bled into everything, this exercise. Half my anxiety about school, it turns out, was misallocated. I feared the AP Chem exam and should have feared falling behind quietly in October. I feared asking Ms. Rivera for a recommendation and should have feared her writing a vague one. Name the real fear. Then respond to that one.

Gus was a civil engineer in Armenia. Here he fixes furnaces, and he is the smartest person I have ever played. I asked him once if it bothered him, the difference between what he was and what the country lets him be. He rearranged the pieces and said, "Wrong fear. I am not afraid of being small. I am afraid of no one to play."

Forty towels, ninety minutes, the real fear. I''m bringing all three to college.', 'seed', false, 1620, 6, 51, 'seed-62-laundromat-chess'),
  ('I photograph potholes. Not artistically — forensically. Every pothole on the six streets around my house, dated, measured with a tape measure my mother thinks she lost, uploaded to a database I named, with the unearned confidence of a fifteen-year-old, the Municipal Neglect Archive.

It started as spite. Our car needed a $340 control arm after the crater on Delancey ate our front-left wheel, and the city''s pothole portal — a real thing that exists — closed my report with the status "RESOLVED" while the pothole sat there, unresolved, growing, like a lie with a diameter. Something about that word did it to me. Resolved. The city had a button that made problems disappear from its own records while the asphalt stayed broken in the world.

So I built the counter-record. Three years, 312 potholes, each with a photo, a date, a depth, and — this is the column that matters — the gap between when the city marked it RESOLVED and when it was actually filled. Median gap: 54 days. Longest: 407. I know because I went back. Going back is the entire method. Anyone can report a pothole; the archive exists because someone returns on the fourteenth day, and the fortieth, holding the same tape measure, keeping the world''s version of events against the database''s version.

My friends find this hilarious, and it is. But I''ve come to believe the gap I''m measuring is one of the most important quantities in civic life: the distance between what institutions record and what is true. That distance has a size. It can be measured by anyone with patience and a tape measure. And institutions behave differently when someone is measuring — Delancey Street got repaved in full last spring, three weeks after a councilwoman''s aide found my archive and asked, nervously, how long I''d been keeping it.

Three years. I''ll keep it as long as the word RESOLVED keeps lying. What I want to study is really just this: who checks the record against the road, and what happens when nobody does.', 'seed', false, 1680, 6, 55, 'seed-68-pothole-archive'),
  ('Being named captain of the varsity basketball team my senior year was one of the proudest moments of my life. It taught me that leadership is not about being the best player, but about lifting up everyone around you.

Our season did not start well. We lost our first four games and people were starting to point fingers. As captain, I knew I had to do something. I called a team meeting and told everyone that we needed to stop blaming each other and start playing as a unit. I told them that a chain is only as strong as its weakest link, and that we would either win together or lose together.

Something changed after that meeting. We won our next game, and then the one after that. By the end of the season we had made it to the district semifinals, which nobody expected from us. We lost that game, but I have never been prouder of a group of people.

Basketball has taught me so many life lessons. It taught me discipline, because you cannot get better without putting in the work every single day. It taught me time management, because balancing practice and AP classes is not easy. Most of all, it taught me that hard work pays off in the end.

I plan to bring these same qualities to college. Whether or not I play basketball at the next level, I will always carry the lessons I learned on the court. I know how to lead, how to work with others, and how to push through adversity when things get tough. Those are the qualities that separate good teams from great ones, and good students from great ones.', 'seed', false, 1180, 6, 35, 'seed-18-sports-captain-cliche'),
  ('My grandfather passed away during my sophomore year, and losing him changed the way I look at the world.

He was the kind of person who lit up a room. He had a story for every occasion, most of them exaggerated, and he told them with his hands as much as his voice. Sunday dinners at his house were the highlight of my week. He always asked about school, and he actually listened to the answer, which is rarer than it sounds.

When he got sick, everything happened faster than we expected. Within three months he was gone. I remember sitting in the hospital room the last time, not knowing what to say, wishing I had asked him more questions when there was still time.

Grief taught me something I did not expect: that it comes in waves, and that the waves get further apart but never really stop. I found myself crying in the car over a song he liked, months later. I learned to let that happen instead of pushing it down.

Losing him also made me more present with the people I love. I call my grandmother every Sunday now, at the same time he used to call us. I ask her questions. I write down the answers, because I learned the hard way that stories disappear when the people holding them do.

I am not the same person I was before. I am more grateful, more aware of how quickly things can change, and more determined to make the most of the time I have. My grandfather would have wanted that. Every time I accomplish something, I imagine telling him about it, and I can hear exactly what he would say.', 'seed', false, 1230, 6, 43, 'seed-23-grandparent-passing'),
  ('My parents did not go to college, and for most of my life that fact sat in the middle of our kitchen table like a place setting for someone who never showed up.

They came here from Honduras in 1999. My father frames houses; my mother cleans them. Neither of them can help me with calculus, and both of them expect me to be a doctor. That contradiction has been the shape of my adolescence — enormous expectations paired with almost no map for how to meet them.

I filled in the map myself, badly at first. I did not know what a GPA was until ninth grade. I did not know you were supposed to take the SAT more than once. I found out about AP classes from a friend''s older sister, three weeks after registration closed, and spent a week convincing my counselor to let me in late.

What I have gotten good at is asking. It sounds small, but for a kid whose parents taught him never to be a bother, asking is the hardest skill I have ever learned. I ask teachers what I missed. I ask upperclassmen what they wish they had known. I asked a stranger at a college fair to explain what "need-blind" meant, and then made him explain it twice.

I have started passing the map along. There are eleven of us in an informal group chat now — mostly first-generation kids at my school — where we post deadlines and decode financial aid emails together. Nobody organized it. I just started adding people who looked as lost as I had been.

I still cannot ask my parents for help with homework. But I can tell them what a FAFSA is, in Spanish, at the kitchen table. That is a start.', 'seed', false, 1300, 6, 46, 'seed-30-first-gen-pressure'),
  ('I have been second chair viola for four years, and I have made peace with the fact that I will never be first.

The girl who beats me every year is named Priya, and she is genuinely better. Not by a lot. By enough. For a long time this ate at me. I practiced more the summer before junior year than I had in my life — three hours a day, scales until my fingers ached — and at the fall audition I lost by two points.

That night I did something I am not proud of: I considered quitting. Not because I hated viola, but because I could not see the point of being permanently second.

What changed my mind was a rehearsal three weeks later. We were working through Dvořák, and the section had a passage that kept falling apart. Priya could play it perfectly, which meant she could not hear why the rest of us could not. I could. I was close enough to the problem to diagnose it — a bowing change nobody had marked — and far enough from the front to notice that four of us were doing it differently.

I fixed it. Not by playing better, but by seeing better.

I think about that a lot now. There is a kind of usefulness that only exists slightly off the top. The person in front is solving their own problem; the person just behind can see the whole section. I have become the person our conductor asks when something is not working, and that turns out to be a more interesting job than being the best player in the room.

Priya is going to conservatory. I am not. I am going to study something where the view from second chair is worth having.', 'seed', false, 1340, 6, 47, 'seed-34-orchestra-second-chair'),
  ('The hardest camper I ever had was a nine-year-old named Elliot who refused to swim.

Not afraid — refused. He would put on his suit, walk to the edge of the lake, and then stand there with his arms crossed for the entire forty-five minute period, every day, for two weeks. The other counselors tried bribery, peer pressure, and a truly ill-advised attempt at picking him up. Nothing worked, and everything made it worse.

I tried something different, mostly out of exhaustion: I stopped trying. I sat on the dock next to him and did not mention swimming at all. For six days we talked about other things. He explained the entire plot of a video game to me twice. I learned his parents had separated in March and that he was going back and forth between two houses in a town he had just moved to.

On the seventh day he said, without preamble, "I can''t swim and everybody already thinks I can."

That was the whole thing. Not fear of water — fear of being found out. He had spent two weeks protecting a lie at enormous cost, because admitting it in front of kids who already knew each other felt impossible.

We worked out a deal. I taught him during free period, when the waterfront was empty, and told nobody. By the last week of camp he could make it across the shallow end. He never swam during his cabin''s period, and I never made him.

I have thought about that summer more than almost anything else in high school. My instinct — everyone''s instinct — was to solve the visible problem. The visible problem was almost never the real one. I want to work with kids, and the first thing I will bring is the willingness to sit on the dock for six days.', 'seed', false, 1380, 6, 48, 'seed-38-summer-camp-counselor'),
  ('My app has been rejected from the App Store four times. I want to tell you about the fourth one.

The first three were my fault in boring ways — a missing privacy policy, a crash on iPad, a screenshot at the wrong resolution. Fixable. The fourth said my app "duplicated existing functionality," which is Apple''s way of saying: this already exists and yours is not better.

They were right. I had built a habit tracker. There are nine thousand habit trackers. I had spent seven months of evenings building the ten-thousandth, and I had never once asked whether the world needed it. I had asked whether I could build it, which is a completely different question and a much easier one.

I did not code for three weeks after that. When I came back, I did something I should have done first: I asked people what was annoying. Not "what app do you want" — nobody knows that — but what was annoying. My mother, a nurse, said the thing that annoyed her was that shift swaps at her hospital happened over a bulletin board and a group text, and people missed them constantly.

That is not a fun problem. There is no elegant algorithm in it. It is a scheduling board with permissions and notifications, and it is deeply, specifically useful to about forty people at one hospital in my town.

It has been running for five months. Twenty-six nurses use it. My mother says the group text has gotten noticeably quieter.

I used to think being a good engineer meant being able to build anything. I am starting to think it means being willing to build the boring thing that someone actually needs. The habit tracker was better code. The shift board is better work.', 'seed', false, 1410, 6, 45, 'seed-41-coding-bootcamp-failure'),
  ('In Model UN, I represented Belarus twice, and both times I lost the same argument in the same way.

The committee was on refugee resettlement quotas. Belarus''s actual position is obstructionist and, frankly, indefensible — which is the point of being assigned it. Most delegates in that spot do one of two things: they abandon the position and vote their conscience, or they defend it so cynically that nobody engages with them. I did the second one. Twice. I lost both times, and I was proud of losing, which should have been my first clue that something was off.

The second loss was to a girl representing Poland who did something I had not considered. She granted my premise. She said, in effect: fine, assume Belarus''s border concerns are real and its capacity is genuinely limited — here is a resettlement structure that survives those constraints. And then she had one. She had actually done the work of building a proposal that would function even if I were right.

I could not argue with it, because she had already argued with it for me, and better.

What I had been doing was performing a position. What she was doing was solving a problem under a constraint she found inconvenient. Those look similar from the outside — both involve a lot of talking — and they are not remotely the same activity.

I have tried to carry that into everything since. In debate, in group projects, in an argument with my father about a curfew: state the other side''s constraint as if it were real, then build something that survives it. It is slower. It wins less often in rooms scored on style.

But the proposals are better, and I would rather be the person who wrote a workable one than the person who was clever about why it could not be done.', 'seed', false, 1440, 6, 55, 'seed-44-model-un-competent'),
  ('The Skyline Diner serves about four hundred cups of coffee between eleven at night and six in the morning, and I have poured most of them for the last two summers.

Night shift has a population you do not otherwise meet. Nurses coming off twelve-hour rotations. Long-haul drivers doing the math on their hours. A man named Roy who comes in at 3 a.m. every Tuesday and Friday, orders wheat toast, and reads actual newspapers, plural. Kids my age at 2 a.m. who are either very happy or very sad and never anything between.

You learn the tells. People who are about to cry order dessert. People who have been crying order nothing and take up a booth for an hour, and the right move — I learned this from Denise, who has worked there nineteen years — is to refill the water without asking and not make eye contact. Attention is a kindness in some cases and a cruelty in others, and telling them apart is most of the job.

The thing I did not expect is how much of the night runs on a set of rules nobody wrote down. Roy''s toast starts when his headlights hit the window. The nurses get the corner booth because it is dim and they have been under fluorescents for twelve hours. A regular who is short gets fed and squares it Thursday. None of this is policy. Some of it is technically against policy.

I am going to study something like sociology or public health, and everyone assumes that means I want to fix things. Partly. But mostly I want to notice things — I have spent two summers learning that the actual system in a place is almost never the one written on the wall, and that you can only find the real one by being there at 3 a.m. when it is running.', 'seed', false, 1470, 6, 49, 'seed-47-diner-night-shift'),
  ('My science fair project failed to reject the null hypothesis, and my teacher told me to change the data.

Not in those words. What Mr. Keller said was, "You might want to rerun the trials that look like outliers." He said it kindly. He said it the week before the regional deadline, looking at a spreadsheet where my hypothesis — that a particular soil amendment would increase seedling growth — had produced, across ninety-six pots, a difference of essentially nothing.

I understood the offer. Rerun the trials that disagree with you, keep the ones that agree, and the graph starts to have a shape. Nobody would ever know. Half the projects at regionals have a shape that clean.

I did not do it, and I want to be honest that this was not entirely courage. Part of it was that I had already spent eleven weeks measuring hypocotyl lengths with calipers and I could not stand the idea that the number I ended up reporting would be one I had chosen rather than one I had found. It felt like it would make the eleven weeks retroactively fake.

So I presented a null result. I made the graph of nothing. I explained the effect size I would have needed to detect a difference and why my sample was underpowered to find one that small. I got a participation ribbon and watched a volcano win.

Here is the part that has stayed with me: two judges came back afterward. One of them, a soil scientist at the state extension office, asked for my raw data because — she said — the amendment I tested is marketed pretty aggressively to home gardeners on essentially no evidence, and negative results on it are hard to find.

Nobody in my school remembers that project. It is the only thing I have ever made that a professional wanted.', 'seed', false, 1500, 6, 51, 'seed-50-science-fair-negative-result'),
  ('There are 1,412 pipes in the organ at St. Bartholomew''s and I have had my hands inside roughly six hundred of them.

The organ was built in 1911 and has been dying, very slowly, since about 1987. The parish cannot afford a professional restoration, which runs to six figures. What it has instead is Mr. Vance, who is eighty-one and was an HVAC technician for forty years, and me, who is seventeen and was bored.

I started because my mother volunteered me. I stayed because of the wind chest. The first time Vance opened one — a wooden box the size of a coffin that distributes pressurized air to the pipes — I saw that it was full of small leather valves called pallets, hundreds of them, each one a little hinged flap that a key press opens. Every note on the keyboard is a rope pulling a flap that lets air into a specific pipe. The whole thing is a machine you could explain to a child, scaled to a size that makes it sound like God.

We releather pallets. That is most of what we do. You steam the old leather off, cut new pieces from a hide, glue them, wait. A wind chest takes about forty hours. There are four.

What I did not anticipate is what this does to listening. I cannot hear the organ as sound anymore. During the processional I hear the 8-foot Principal on the Great, and I know that the slight delay on middle C is a pallet we have not gotten to. The congregation hears music. I hear a specific piece of leather I am going to have to replace in August.

I am not sure whether this is a loss. Something opaque became transparent to me, and now I cannot go back. I want to spend my life doing that to more things — taking the beautiful thing apart until it becomes a mechanism, and finding out that the mechanism is beautiful too.', 'seed', false, 1530, 6, 52, 'seed-53-church-organ-repair'),
  ('I have been present for four deaths, and in three of them nobody was talking.

I volunteer at a hospice, which is an odd thing for a sixteen-year-old to do and I did not choose it for good reasons — it was the only volunteer slot left that fit around my job. The training is eleven hours. Most of it is about what not to do. Do not say "I know how you feel." Do not fill silence. Do not, under any circumstances, promise anyone anything about what happens next.

What they do not train you for is how boring it is. That is the part nobody says out loud. Dying, when it is going well, is mostly a person sleeping in a room while a machine measures something, and the volunteer''s job is to be a body in a chair so the person is not alone. I have read four hundred pages of a Louis L''Amour novel aloud to a man who was unconscious for all of it, because his daughter said he liked westerns and I could not think of anything else to do with my voice.

The one death where somebody was talking was a woman named Ruth, who at the very end became briefly, startlingly lucid and asked me whether I had locked the car. I said yes. She said good, and went back to sleep, and died about four hours later. Her last words to another human being were about a car that was not hers, said to a kid she had met twice.

I used to think there would be a summation. Some final compression of a life into a sentence. There is almost never a summation. There is a person who is tired, and small ordinary concerns that stay small and ordinary right up to the edge, and someone in a chair.

I am going into medicine, and I already know the thing I will be worst at is the thing I am practicing now: staying in the room when there is nothing to do in it.', 'seed', false, 1580, 6, 54, 'seed-58-hospice-volunteer'),
  ('I have ridden the 47 bus 1,900 times and I have never once been on it for transportation.

Let me explain that. My family moved to this city when I was eleven, into an apartment where I was alone from 3 p.m. until my mother got home at 9. I was not allowed to have people over. I was not allowed to be outside after dark. What I was allowed to do, because it had not occurred to anyone to forbid it, was ride the bus.

A day pass was $2.50 and the 47 is a loop. That is the whole trick: a loop route means you can ride for six hours and end up where you started, and nobody asks you anything, because the bus is full of people also going nowhere in particular.

I did my homework on the 47. I read most of what I have read on the 47. I learned this city the way you learn a song, by repetition without intention — I know that the Vietnamese bakery on Sixteenth changes its sign on Tuesdays, that the man who sells oranges at the Bell Street stop is not there in February, that the stretch past the old foundry is the only place on the route where everyone on the bus goes quiet, and I have never figured out why.

Here is what I did with it. Sophomore year our city put out a draft plan to cut the 47 to peak hours only, on the grounds that midday ridership was low. Midday ridership is low. Midday ridership is also me, and about fifteen regulars I could describe by name, most of whom are elderly and none of whom were at the public comment meeting, which was held at 6 p.m. downtown.

I went. I brought a rider count I had done myself, by hand, for six weeks. I was the only person under sixty who spoke.

They cut it anyway. I want to study transportation policy, and it is not because I think I will win those meetings. It is because I have noticed that the people who show up to them have almost never been on the bus.', 'seed', false, 1650, 6, 53, 'seed-65-bus-route-map'),
  ('When I was twelve I corrected my mother''s English in front of a cashier, and she did not speak to me for the rest of the day.

She had said "borrow me the pen." The cashier had understood her perfectly. I said, "Lend. It''s lend me the pen," in the voice of a child who has just discovered he possesses something his parent does not, and I watched her face do something I had never seen it do, which was close.

I have spent five years trying to understand what I actually did in that moment, because "I was rude to my mother" does not cover it.

Here is the closest I have gotten. My mother speaks four languages. She learned English at thirty-four, at night, after cleaning offices, from a workbook and a radio. Her English is a monument to an enormous amount of labor. And in one sentence I reclassified it — publicly, in front of a stranger — from an achievement into a defect. I did not correct an error. I took a thing she had built and told her it was broken.

What makes it worse is that I knew, even at twelve, exactly what I was doing. I was trying to establish, for the cashier, that I was not the same kind of person as the woman next to me. That is the part I cannot get around. It was not pedantry. It was defection.

I have never apologized for it directly, which is a thing I am admitting here for the first time. What I did instead was become the person who handles the phone calls. Insurance, landlords, the DMV, the school — I take the calls, and I have gotten good at a specific and slightly ugly skill, which is sounding like the kind of American who does not get transferred.

I do it in her name. I say "I''m calling on behalf of Marisol Ferreira," and I make them spell it back to me.

That is not an apology. I know that. It is a tax I have decided to pay for a long time.', 'seed', false, 1710, 6, 57, 'seed-71-mothers-accent'),
  ('My mother''s appointment book is written in three alphabets, and I am the only person alive who can read all of it.

Khmer script for the regulars she trusts. English for the walk-ins. And for a certain kind of customer, a private shorthand she invented in the refugee camp in Khao-I-Dang — a system of dots and slashes that her sister devised so they could keep lists the guards couldn''t read. My mother is fifty-one now and owns a nail salon in a strip mall in Lowell, and she still records certain things in camp code. It took me until I was fourteen to notice which things.

The dots mark the customers who can''t pay. Mrs. Fields, every third Thursday, two dots: manicure, no charge, because her husband left and her hands, my mother says, are the only part of her life she can still keep nice. The man who lost his restaurant: one dot, one slash. I asked her once why she didn''t just write "free" — it''s her book, her salon, her right. She looked at me like I had suggested she undress in the parking lot. "You don''t write charity where the person can see it," she said. "Shame reads every language."

So the kindness is encrypted. That is the exact shape of my mother: a woman who survived Pol Pot''s arithmetic, crossed a border on foot at nineteen, and came out the other side believing that the highest use of a secret code is protecting someone else''s dignity while you paint their nails.

I keep her books now — the tax ones, in English, in QuickBooks. The other ledger she keeps herself. But she''s been teaching me the code, dot by slash, the way other families hand down recipes. Last month she let me make my first entry: two dots for a nursing student whose card declined. My handwriting in her alphabet.

People ask what I want to do, and I say something about economics, which is true but incomplete. What I actually want is to spend my life the way that book spends its ink: precise in public, generous in code, keeping accounts the guards can''t read.', 'seed', false, 1750, 6, 58, 'seed-75-nail-salon-ledger')
on conflict (label) do nothing;
