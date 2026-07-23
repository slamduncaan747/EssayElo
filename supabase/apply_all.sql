-- Margin — initial schema.
-- Access model: the browser only ever talks to Supabase for auth. All data
-- access goes through Next.js API routes / server components. RLS is enabled
-- everywhere as defense in depth: users can read their own rows; every write
-- that affects ratings, quotas, or plans is service-role only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
-- No insert/update/delete policies: plan changes are service-role only.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- essays & drafts
-- ---------------------------------------------------------------------------
create table public.essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  essay_type text not null default 'Common App personal statement',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index essays_user_idx on public.essays (user_id, updated_at desc);

alter table public.essays enable row level security;
create policy "essays_select_own" on public.essays
  for select using (auth.uid() = user_id);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays (id) on delete cascade,
  version int not null,
  content text not null check (char_length(content) between 1 and 40000),
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (essay_id, version)
);
create index drafts_essay_idx on public.drafts (essay_id, version desc);

alter table public.drafts enable row level security;
create policy "drafts_select_own" on public.drafts
  for select using (
    exists (
      select 1 from public.essays e
      where e.id = drafts.essay_id and e.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- corpus (service-role only; contents are never exposed to clients)
-- ---------------------------------------------------------------------------
create table public.corpus_essays (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text not null check (source in ('anchor', 'seed', 'user')),
  locked boolean not null default false,
  elo real not null,
  match_count int not null default 0,
  prose_score real,
  label text,
  owner_draft_id uuid unique references public.drafts (id) on delete set null,
  created_at timestamptz not null default now()
);
create index corpus_elo_idx on public.corpus_essays (elo);

alter table public.corpus_essays enable row level security;
-- No policies: service-role access only.

-- ---------------------------------------------------------------------------
-- evaluations & matches
-- ---------------------------------------------------------------------------
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays (id) on delete cascade,
  draft_id uuid not null references public.drafts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'full' check (kind in ('full', 'quick')),
  budget int not null check (budget between 1 and 40),
  matches_done int not null default 0,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  phase text not null default 'placement'
    check (phase in ('placement', 'match', 'prose', 'synthesis', 'done')),
  elo real,
  start_elo real,
  ci real,
  placement_tier int,
  prose_score real,
  prose_tag text check (prose_tag in ('carrying', 'substance_ahead', 'aligned')),
  structure_score real,
  direction_flag text,
  intransitivity real not null default 0,
  result jsonb,
  error text,
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index evaluations_essay_idx on public.evaluations (essay_id, created_at desc);
create index evaluations_user_month_idx on public.evaluations (user_id, kind, created_at);

alter table public.evaluations enable row level security;
create policy "evaluations_select_own" on public.evaluations
  for select using (auth.uid() = user_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  corpus_essay_id uuid not null references public.corpus_essays (id),
  round int not null,
  winner text not null check (winner in ('user', 'opponent', 'split')),
  margin text not null check (margin in ('decisive', 'clear', 'narrow')),
  weight real not null default 1,
  off_axis boolean not null default false,
  harvest jsonb,
  elo_before real not null,
  elo_after real not null,
  opp_elo real not null,
  created_at timestamptz not null default now()
);
create index matches_eval_idx on public.matches (evaluation_id, round);

alter table public.matches enable row level security;
-- No policies: match rows (which reference corpus essays) are service-role only.

-- ---------------------------------------------------------------------------
-- Atomic step lock: claim an evaluation for one tournament step.
-- ---------------------------------------------------------------------------
create or replace function public.claim_evaluation(p_eval_id uuid, p_lock_seconds int)
returns setof public.evaluations
language sql
security definer set search_path = public
as $$
  update public.evaluations
  set lock_until = now() + make_interval(secs => p_lock_seconds)
  where id = p_eval_id
    and (lock_until is null or lock_until < now())
  returning *;
$$;

-- Clients must never call this directly; the server (service_role) must.
revoke all on function public.claim_evaluation(uuid, int) from public, anon, authenticated;
grant execute on function public.claim_evaluation(uuid, int) to service_role;
delete from public.corpus_essays where source in ('anchor','seed');
insert into public.corpus_essays (content, source, locked, elo, match_count, prose_score, label) values
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
('My mother''s appointment book is written in three alphabets, and I am the only person alive who can read all of it.

Khmer script for the regulars she trusts. English for the walk-ins. And for a certain kind of customer, a private shorthand she invented in the refugee camp in Khao-I-Dang — a system of dots and slashes that her sister devised so they could keep lists the guards couldn''t read. My mother is fifty-one now and owns a nail salon in a strip mall in Lowell, and she still records certain things in camp code. It took me until I was fourteen to notice which things.

The dots mark the customers who can''t pay. Mrs. Fields, every third Thursday, two dots: manicure, no charge, because her husband left and her hands, my mother says, are the only part of her life she can still keep nice. The man who lost his restaurant: one dot, one slash. I asked her once why she didn''t just write "free" — it''s her book, her salon, her right. She looked at me like I had suggested she undress in the parking lot. "You don''t write charity where the person can see it," she said. "Shame reads every language."

So the kindness is encrypted. That is the exact shape of my mother: a woman who survived Pol Pot''s arithmetic, crossed a border on foot at nineteen, and came out the other side believing that the highest use of a secret code is protecting someone else''s dignity while you paint their nails.

I keep her books now — the tax ones, in English, in QuickBooks. The other ledger she keeps herself. But she''s been teaching me the code, dot by slash, the way other families hand down recipes. Last month she let me make my first entry: two dots for a nursing student whose card declined. My handwriting in her alphabet.

People ask what I want to do, and I say something about economics, which is true but incomplete. What I actually want is to spend my life the way that book spends its ink: precise in public, generous in code, keeping accounts the guards can''t read.', 'seed', false, 1750, 6, 58, 'seed-75-nail-salon-ledger');
