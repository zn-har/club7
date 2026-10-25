# KAIROS Athletic Club — Creative Direction

*Kairos (Gk.): the decisive moment. The brand is about the single rep you are about to take.*

## 1. Brand direction

A private strength house, not a "fitness experience". The site should read like a
printed campaign book: low-key light, one object in focus, people photographed
without pose, typography doing the shouting so the imagery doesn't have to.

- **Mood:** after-hours training floor. One light on. Chalk in the air.
- **Reference points:** automotive launch films (one object, controlled light),
  Aesop retail (restraint, materials), Nike long-form editorial (oversized type, bodies in motion).
- **Rule:** if something looks like "a WebGL demo", it goes.

## 2. Visual system

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0c0b0a` warm black | page ground, 3D fog |
| `--char` | `#161513` | section planes, cards |
| `--steel` | `#8b8d8f` | meta text, rules |
| `--bone` | `#ebe6dd` | primary text |
| `--ember` | `#c4693f` | one accent: active states, the CTA hairline |
| `--red` | `#d4161c` (deep `#8e0b10`) | hero only: "UP.", primary CTA, meta rule, scroll line. Never outside the hero |

**Type**
- Display: *Archivo Variable* — width axis pushed to condensed (wdth 62–75), weight 700–800, uppercase, tight tracking. Oversized headlines.
- Editorial accent: *Instrument Serif* italic — one or two words per headline, never full paragraphs.
- Text/UI: *Geist Variable* — 15–17px, generous leading, small-caps meta labels with wide tracking.

**Layout:** 12-col grid, 4vw outer gutters, asymmetric compositions (text 5 cols, image 7 cols offset), large negative space.

**Photography grade:** all photography graded towards warm monochrome (CSS: grayscale ~0.85, contrast lift, warm multiply) so stock from different shooters reads as one campaign. Recovery imagery keeps a little warmth — wood and steam.

## 3. Asset strategy

| Asset | Source | Licence | Notes |
|---|---|---|---|
| Lighting / reflections | Poly Haven HDRI `gym_01` (1k .hdr) | CC0 | Real gym: fluorescent strips give believable streak reflections on chrome |
| Facility panorama | Poly Haven `gym_01` tonemapped 360 (4k / 2k) | CC0 | Real photographic environment, graded in-shader |
| Floor / wall PBR | Poly Haven `rubber_tiles`, `concrete_floor_02` (diff / normal / rough, 1k) | CC0 | |
| Barbell + bumper plates | Built in code from **real IWF specs** (2.2 m bar, Ø28 mm shaft, Ø50 mm sleeves, 1.31 m between collars, Ø450 mm plates) as lathe-turned profiles — the way the real parts are machined | — | Procedural knurl normal map, rubber micro-normal, printed plate decals |
| Athlete / facility photography | Unsplash (23 images, downloaded and re-encoded to WebP) | Unsplash licence | Never hot-linked |

Honest limit: there is no CC0 photoscanned barbell available; a scanned GLB from a paid library (e.g. a photogrammetry Olympic bar) would be the upgrade path. The scene is designed so the asset can be swapped in `scene/Barbell.tsx` without touching choreography.

## 4. Page structure — one continuous take

Showcase brief: the 3D set is visible behind every section. Scroll drives one camera
(slider + jib, vertical FOV 22°) and one overhead key light on a track through a set of
equipment "stations" laid out on a rubber floor. Sections are transparent layers with
local scrims; photographs sit on top as printed plates.

| Station | Kit (real specs) | Position |
|---|---|---|
| Bar | 20 kg Olympic bar + 4 × 20 kg bumpers on an 8 ft oak-and-rubber platform (30 mm) | origin |
| Bells | 3 × 28 kg competition kettlebells (orange-coded, so the ember accent is honest), chipped powder coat, worn chalky grips | (-2.5, 0, 1.7) |
| Dumbbells | pair of 32 kg round-head dumbbells | (-2.3, 0, -1.7) |
| Stacks | bumpers stacked 1 / 2 / 3 high | (2.5, 0, -1.9) |

## 5. Animation storyboard

All camera/light moves live on ONE GSAP timeline measured in scroll pixels
(`motion/choreography.ts → buildTake`). A single ScrollTrigger eases its playhead to the
scroll position (1.1 s, power3.out); the rig then adds critically damped smoothing. One
writer means fast scrolls and anchor jumps can never race two moves.

| # | Section | Shot / visual event | Trigger (scroll range) | Duration | Easing | Transition |
|---|---|---|---|---|---|---|
| 0 | Loader | Wordmark, hairline tied to real asset loading | page load | until loaded, min 1.2 s | linear | fades 0.9 s power2.inOut |
| 0 | Intro | `dark → hero`: key light strikes (one flicker), fill/rim follow, 0.9 m dolly-in, focus rack | loader done | 4.2 s | steps → power2/3.out | yields instantly if the visitor scrolls |
| 1 | Hero | Headline lines rise from masks (0.12 s stagger), copy + CTAs fade up | 1.3 s into intro | 1.3 s | expo.out | pointer parallax ≈ 2 cm × distance |
| 1→2 | Hero exit | `hero → macro`: camera slides along the bar into the knurl; DOF opens to macro | hero top → philosophy top 10% | scrubbed | sine.inOut | headline drifts up 18% and fades |
| 2 | Philosophy | Statement words go 14% → 100% opacity as read, over the knurl macro | statement 82% → 38% | scrubbed | none | — |
| 2 | Philosophy | `macro → above`: jib up into darkness as photographs arrive; photos mask-reveal | images top bottom → top 20% | scrubbed / 1.4 s | sine.inOut / expo.inOut | in-frame photo parallax ±4% |
| 3 | Programs | `above → program`, where `program` is the live shot of the picked tab (strength / conditioning / personal / recovery); picking a tab crosses the floor to that station, recovery shifts to tungsten and macro focus | section top bottom → top 25%; tab pick | scrubbed; 1.8 s | sine.inOut; power2.inOut | one panel, four tabs; text left, station framed right |
| 4 | The floor | `recovery → wide`: crane to an establishing shot; practicals over every station come up | facility top bottom → top top | scrubbed | sine.inOut | 360° panorama (lazy) is interactive: drag + zone buttons |
| 5 | Coaches | `wide → coaches`: low dim pass behind the dumbbells under the portraits | coaches top bottom → top top | scrubbed | sine.inOut | community strip translates with scroll |
| 6 | Membership | `coaches → membership`: three stacks — one, two, three plates | membership top bottom → top top | scrubbed | sine.inOut | featured tier hairline draws |
| 7 | Finale | `membership → finale`: straight down on the bar, then a slow 4.6° roll | finale top bottom → top top; roll across finale | scrubbed | sine.inOut | footer static |
| — | Reduced motion | No Lenis, no intro moves, no parallax; camera **cuts** at the midpoint of each move | `prefers-reduced-motion` | — | — | — |

## 6. Design revisions after skill review

Removed defaults the design review flagged as templated: numbered eyebrow labels
("01 — Philosophy"), single italic-word accents in headlines, middle-dot meta strings,
arrow-suffixed buttons, all-caps tracked labels. Serif italic is kept only for the program
one-liners and tier summaries (full sentences). Accent ember is used for state only
(program count, active zone, featured tier).

## 7. Performance & fallbacks

- One persistent canvas; PCSS soft shadows, N8AO and DOF only on the high tier.
- `PerformanceMonitor` drops DPR 1.5 → 1 and the tier to low on weak GPUs; touch/small screens start low.
- Contact shadows are baked once (`frames={1}`); pool lights cast no shadows.
- Panorama canvas lazy-mounts a viewport ahead and unmounts when far away.
- No WebGL → hero and finale fall back to graded photographs; panorama shows a still.
