# Club 7 — Website Copy

Replaces all Kairos placeholder copy. Every fact below comes from c7clubseven.com (read 2026-10-24).
Anything the source site doesn't state is marked `[NEED: …]` or `[VERIFY: …]`. Nothing is invented.

---

## 0. Strategy

### Diagnosis
**A. Blank / slop.** The current text is AI-generated for a fictional London club (Kairos, 1,400 m², 400 members, named coaches, $ prices). None of it is true for Club 7. The source site copy is generic ("ultimate destination", "state-of-the-art", "99% member satisfaction"). Angle gets rebuilt; facts come only from the source.

### What we actually know
| Fact | Source |
|---|---|
| Club Seven Fitness & Gym ("Club 7", "C7") | site title, logo |
| Club 1: AE Tower, Sultan Bathery, Wayanad, Kerala. Opened 2022 | home, Kerala page |
| Club 2: Al Quoz Mall, Dubai, UAE. Opened 2025 | Dubai page |
| Certified trainers, personalised plans for fat loss, muscle gain, endurance | services |
| Dynamic Movement Training (3D natural movement), Quick Result (weight-bearing, core and lower back), Group Fitness (HIIT, functional, stretching), Freestyle areas, Corporate Wellness | home, services |
| Strength & cardio zone: free weights, resistance equipment, treadmills, ellipticals | services |
| Lockers, showers, hydration zone. "Very clean" | home, services |
| All levels, beginner to athlete | Kerala / Dubai pages |
| Trainers "live for your post-workout high-fives" | home |
| info@c7clubseven.com, +91 9207 55 66 22, +971 52 53 15875, IG @c7_clubseven, FB /c7club | contact |

**Not used:** the "100% / 99%" strength bars on the location pages. They're self-scored, not measured, and you asked for no fake stats.

### Positioning
> **Club 7 is a gym that started in a hill town in Kerala and earned a second address in Dubai.** Two clubs, run on the same three things: a certified trainer who writes your plan, a floor kept clean, and a room that cheers when you finish.

The ownable line is the route: **Sultan Bathery → Al Quoz.** No other gym can claim it, so it passes the swap test that "state-of-the-art equipment" fails.

### Voice
- **Headlines:** loud, short, imperative. Two to four words a line. Built for the Archivo condensed h-xl.
- **Body:** plain, specific, warm. Short sentences that name real things (treadmills, lockers, lower back).
- **Personality:** confident coach, not drill sergeant. Generous with beginners. Proud of where it started.
- **Words we use:** floor, plan, trainer, rep, lift, club, show up.
- **Words we don't:** ultimate, state-of-the-art, journey, transform, unleash, beast, grind, world-class.

### Narrative arc (one continuous camera take)
1. **Hero:** the light hits the bar. A command: pick it up.
2. **Philosophy:** camera in the knurl. Where we came from, and why.
3. **Training:** camera crosses the floor station to station. Four ways in.
4. **The floor:** crane to the wide shot. The kit and the space.
5. **Why Club 7:** low pass behind the dumbbells. What you can hold us to.
6. **Join:** three plate stacks. Pick your club.
7. **Finale:** straight down on the bar. See you there.

### Section map (structure and animation unchanged)
| Your brief | Existing section / component | Camera shot it sits on |
|---|---|---|
| Hero | `Hero.tsx` | dark → key light strike → hero |
| Brand philosophy | `Philosophy.tsx` (statement + 3 principles + aside) | macro on knurl, words light up as read |
| Training philosophy | `Programs.tsx` (4 tabs) | camera crosses to each station per tab |
| Equipment showcase + atmosphere | `Facility.tsx` (panorama, 4 zones, spec strip) | crane to wide establishing shot |
| Brand highlights | `Coaches.tsx` (3 cards) | low pass behind dumbbells |
| Final CTA (part 1) | `Membership.tsx` (cards + enquiry form) | three plate stacks |
| Final CTA | `Finale.tsx` | top-down on bar, slow roll |
| Footer | `Finale.tsx` footer | static |

All section ids, program ids (`strength`, `conditioning`, `personal`, `recovery`) and panorama zone ids stay as they are, so the choreography keeps working. Only visible text changes.

---

## 1. Global

**Page title:** `Club 7 | Strength & Fitness Gym in Wayanad and Dubai`
**Meta description:** `Club Seven Fitness & Gym in Sultan Bathery, Wayanad and Al Quoz Mall, Dubai. Certified trainers, personal plans, free weights, cardio and group sessions.`

**Loader** (`Loader.tsx`)
- Mark: `Club 7`
- Meta: `Fitness & Gym`

**Nav** (`Nav.tsx`)
- Mark: `Club 7` / meta `Fitness & Gym`
- aria-label: `Club 7 Fitness & Gym, back to top`
- Links: `Philosophy` · `Training` · `The floor` · `Why Club 7` · `Join`
  (hrefs unchanged: `#philosophy` `#programs` `#floor` `#coaches` `#membership`)
- CTA: `Book a session`

---

## 2. Hero (`Hero.tsx`)

*Shot: black frame, one light strikes the bar, dolly in. The headline arrives with the light, so it's an instruction aimed at the object on screen.*

- **Eyebrow** (optional; needs a `<p className="meta">` above the h1): `Sultan Bathery and Dubai`
- **Headline** (two `line-mask` spans):
  - `Pick it`
  - `up.`
- **Lede:**
  > Club 7 is a strength and fitness gym in Wayanad and Dubai. Certified trainers write your plan. You do the lifting.
- **CTA primary:** `Book your first session` → `#membership`
- **CTA ghost:** `See the floor` → `#floor`
- **Fallback photo alt:** `An athlete stands beside a loaded barbell in a dark gym` (unchanged)

**Headline alternatives**
- A. `Pick it / up.` *(recommended)* Two words, one verb, aimed at the barbell the light just found. Works at any size.
- B. `Two cities. / One floor.` The positioning in four words. Stronger brand line, weaker with the barbell shot. Better as a campaign/social line.
- C. `The bar / doesn't care.` Edgier. Implies "where you started doesn't matter", which supports the all-levels promise, but needs the lede to land it.

**CTA alternatives:** `Book your first session` *(recommended)* · `Train at Club 7` · `Find your club`

---

## 3. Brand philosophy (`Philosophy.tsx`)

*Shot: camera slides along the bar into the knurl. Statement words go from 14% to 100% opacity as the reader scrolls, so it reads like a sentence being spoken.*

- **sr-only h2:** `Philosophy`
- **Statement** (`data-words`, 22 words):
  > We opened in Sultan Bathery in 2022 so the town had a real place to train. In 2025, Dubai got one too.

- **Principles** (`PRINCIPLES`, title + body):
  1. **Your plan, written for you**
     Certified trainers build it around your body, your goal and your week, then change it as you get stronger.
  2. **First day or fifth year**
     Beginners and competing athletes share the same floor and the same trainers. Everyone gets coached.
  3. **Clean is a standard**
     Equipment wiped down, floors swept, showers and lockers kept the way you'd want them at home.

- **Aside** (`philosophy__aside`):
  > Our trainers live for the high-five at the end of a hard session. You'll get yours on day one.

- **Photo captions** (hidden while `SHOW_CARDS = false`):
  - Wide: `The first pull` / `Sultan Bathery, early`
  - Tall: `Dead hang`
  - `[VERIFY: photos are Unsplash stock; swap for Club 7 shots before using location captions]`

**Statement alternative:** `Club 7 started in a hill town in Kerala. Now it has an address in Dubai. Same trainers' standard at both doors.` (more poetic, slightly longer).

---

## 4. Training philosophy (`Programs.tsx`)

*Shot: each tab sends the camera to a station. Bar for personal training, kettlebells for dynamic movement, dumbbells for core, warm tungsten light for group sessions (the warm shift now reads as "the room fills up").*

- **Title** (`Lines`): `Four ways` / `in.`

| id (keep) | name | line (serif) | body | facts |
|---|---|---|---|---|
| `strength` | **Personal Training** | A plan with your name on it. | A certified trainer looks at your body type, your goal and your schedule, then writes the programme. Fat loss, muscle gain or endurance. You'll know what each session is for before you start it. | Led by: Certified trainer · Goals: Fat loss, muscle, endurance · Level: Any |
| `conditioning` | **Dynamic Movement** | Train the way you move. | Three-dimensional exercises built on the body's natural patterns: twisting, reaching, lunging, lifting. Strength you'll use on the stairs and the pitch. | Focus: Natural movement · Planes: All three · Level: Any |
| `personal` | **Quick Result** | Core first. | Weight-bearing work aimed at the abdomen and lower back, the muscles that hold every other lift together. | Focus: Core and lower back · Method: Weight-bearing · Level: Any |
| `recovery` | **Group Sessions** | Louder together. | High-intensity rounds, functional work and a proper stretch at the end, scaled so first-timers and regulars finish at the same time. | Format: Trainer-led group · Includes: HIIT, functional, stretch · Level: All |

- **Inset caption:** `On the floor` (unchanged)
- **Photo alts:** strength `A lifter sets up under a barbell with a trainer beside them` · conditioning `An athlete rests with battle ropes over one shoulder` · personal `A lifter braces under a loaded bar during a core-focused set` · recovery `A group finishing a session together on the gym floor` `[NEED: group photo; current "steam" image is a sauna, which Club 7 doesn't list]`

**Note on "Quick Result":** it's Club 7's own programme name, so it stays. It promises speed, which the copy doesn't back. Consider `Core Foundation` if you can rename it.

**Title alternatives:** `Four ways / in.` *(recommended, shortest, reads as an invitation)* · `Choose / your work.` · `How we / train.`

---

## 5. Equipment showcase and atmosphere (`Facility.tsx`)

*Shot: crane up to the wide establishing shot; every station's practical light comes up. Then the interactive 360° panorama. Copy names the kit, then hands control to the visitor.*

- **Title:** `Built to` / `be used.`
- **Lede:**
  > Free weights, resistance machines, treadmills, ellipticals, and open freestyle space for sessions that don't fit on a machine.
- **Hint:** `Drag to look around` (unchanged)

- **Zones** (keep ids and yaw values; labels follow what's visible in the current panorama):

| id | label | note |
|---|---|---|
| `platforms` | Free weights | Barbells, plates and dumbbells for every major muscle group. |
| `lane` | Freestyle area | Open floor for functional work and full-body sessions your trainer builds on the spot. |
| `racks` | Strength zone | Resistance equipment set up for safe, heavy, repeatable work. |
| `cables` | Cardio zone | Treadmills and ellipticals for warm-ups, conditioning and long steady sessions. |

- **Spec strip** (`SPECS`, value / label):
  - `2022` / `Opened in Sultan Bathery`
  - `2025` / `Opened in Dubai`
  - `2` / `Clubs`
  - `4` / `Training zones` `[VERIFY]` (or swap for hours: `[NEED: opening hours]`)

- **Detail captions** (hidden while `SHOW_CARDS = false`):
  - Dumbbells: `Free weights for every major muscle group`
  - Kettlebells: `Freestyle area`
  - Sauna → **replace photo**: `Lockers, showers and hydration zone` `[NEED: locker/shower photo]`

- **Panorama still alt:** `A training floor at night, rows of machines under a strip light`

`[VERIFY: the 360° panorama is a Poly Haven stock gym, not Club 7. The copy never says "this is our floor". A real 360 of either club would make this section true.]`

---

## 6. Brand highlights (`Coaches.tsx` → "Why Club 7")

*Shot: low, dim pass behind the dumbbells. Three cards, three things a member can hold us to.*

- **Title:** `What you` / `can count on.`
- **Lede:**
  > Three things we hold every session to, at both clubs.

- **Cards** (`COACHES` array: role → meta, name → h3, bio → body):
  1. meta `Coaching` · **Certified trainers**
     Every trainer on the floor is certified, and every plan starts from your goal.
  2. meta `Facilities` · **Kept clean**
     Wiped-down kit, clean lockers and showers, and a hydration zone to reset before you head out.
  3. meta `For teams` · **Corporate wellness**
     Workplace programmes that get your people training together. Ask us about one for your company.

- **Photo alts:** `A Club 7 trainer on the gym floor` · `Clean locker room and showers` · `A team training together` `[NEED: real photos; current portraits are stock coaches with fake names]`

**Title alternatives:** `What you / can count on.` *(recommended)* · `Why people / stay.` (needs member proof: `[NEED: testimonials or Google reviews export]`) · `The Club 7 / standard.`

---

## 7. Join (`Membership.tsx`)

*Shot: three plate stacks, one, two, three high. The featured card's hairline draws.*

- **Title:** `Find your` / `club.`
- **Lede:**
  > Two addresses. Pick the one closest to you, tell us when you train, and we'll set up your first session.

### Cards
The current tiers show `$` prices. The source site lists no prices, and the clubs bill in different currencies (INR, AED). Two options:

**Option 1 (recommended): location cards.** Needs `price` removed from the card render (small code change).
| id | name | summary (serif) | items | CTA |
|---|---|---|---|---|
| `wayanad` | Sultan Bathery | Where it started. | AE Tower, Sultan Bathery, Wayanad · Open since 2022 · Personal training and group sessions · +91 9207 55 66 22 | Choose Sultan Bathery |
| `dubai` | Al Quoz, Dubai | The second address. | Al Quoz Mall, Dubai · Open since 2025 · Personal training and group sessions · +971 52 53 15875 | Choose Dubai |
Featured badge: drop, or `Newest` on Dubai.

**Option 2: membership tiers** (keeps current layout, needs real pricing).
| name | price | summary | items |
|---|---|---|---|
| Floor | `[NEED]` | The full gym, on your schedule. | Strength and cardio zones · Freestyle area · Lockers, showers, hydration zone |
| Coached *(featured, badge `Most chosen` `[VERIFY]`)* | `[NEED]` | A trainer and a plan. | Everything in Floor · Personalised programme from a certified trainer · Group sessions |
| Corporate | `[NEED]` | Your team, training together. | Workplace wellness programme · Group sessions for staff · `[NEED: terms]` |

### Enquiry
- **h3:** `Come train once.`
- **Body:**
  > Tell us which club and when you usually train. We'll book your first session with a trainer. `[VERIFY: is the first session free? If yes, add "It's on us."]`
- **Fields:**
  - `Name`
  - `Email`
  - `Club`: `Sultan Bathery, Wayanad` / `Al Quoz Mall, Dubai`
  - `Usually train`: `Early morning` / `Daytime` / `Evening` (hour ranges removed until real hours are known)
- **Submit:** `Request my session`
- **Error:** `Add your name and a working email so we can reach you.`
- **Success h:** `Thanks, {name}.`
- **Success body:** `We'll be in touch to book your first session.` `[VERIFY: response time, e.g. "within a day"]`
- **Reset link:** `Send another request`

---

## 8. Final CTA (`Finale.tsx`)

*Shot: camera straight down on the bar, then a slow 4.6° roll. Last image of the take. The page started with an order and ends with an invitation.*

- **Meta line:** `Sultan Bathery and Al Quoz, Dubai`
- **Headline:** `See you` / `on the floor.`
- **CTA:** `Book your first session` → `#membership`

**Headline alternatives**
- A. `See you / on the floor.` *(recommended)* Warm, confident, assumes they're coming. Pairs with the hero: the hero gives the order, the finale gives the welcome.
- B. `Your rep / is next.` Harder, more Nike. Echoes the hero's command.
- C. `The bar / is loaded.` Fits the top-down bar shot exactly.

---

## 9. Footer (`Finale.tsx`)

- **Brand:** `Club 7` / meta `Fitness & Gym, since 2022`
- **Col: Wayanad**
  AE Tower, Sultan Bathery
  Wayanad, Kerala
  `+91 9207 55 66 22` → `tel:+919207556622`
- **Col: Dubai**
  Al Quoz Mall
  Dubai, UAE
  `+971 52 53 15875` → `tel:+971525315875`
- **Col: Contact**
  `info@c7clubseven.com` → `mailto:info@c7clubseven.com`
  `Instagram` → `https://www.instagram.com/c7_clubseven/`
  `Facebook` → `https://www.facebook.com/c7club/`
- **Hours:** `[NEED: opening hours per club]` (current Mon–Fri / Sat–Sun times are invented; remove until confirmed)
- **Base left:** `© {year} Club Seven Fitness & Gym`
- **Base right:** `Photography from Unsplash. Environment and materials from Poly Haven (CC0).` (keep while stock assets are in use)

---

## 10. Open items for Club 7
| # | Need | Unlocks |
|---|---|---|
| 1 | Opening hours, both clubs | Footer hours, spec strip, enquiry time slots |
| 2 | Pricing (INR / AED) or OK to use location cards | Join section |
| 3 | Is the first session free? | Hero and enquiry CTA strength ("Book a free session") |
| 4 | Real photos: floor, trainers, lockers, a group class | Captions with locations; "Why Club 7" cards |
| 5 | Trainer names and certifications | Named trainer cards (restore Coaches format) |
| 6 | Member reviews (Google export or written quotes, with consent) | "Why people stay" headline, proof line |
| 7 | Rename "Quick Result"? | Programme name matches what the copy can prove |
