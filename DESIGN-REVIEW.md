# Design review — Club 7 site (2026-11-08)

Sources: full scroll capture at 1536×864 and 390×844, a computed-style audit of every text node / link / input on the
live build (desktop and phone), and pixel-measured contrast of the risky spots against what is actually rendered behind
them. Measured with the 1fd3efb build. Nothing here has been changed in code.

Things checked and **ruled out** (so they don't get "fixed"):
- The booking form *does* demand a phone or an email (`src/sections/Membership.tsx:45`).
- The outlined programme-name duplicates are `aria-hidden` (`src/sections/Programs.tsx:55`), so screen readers don't repeat them.
- Body copy contrast passes on its own: bone at 66 % on ink measures 7.1:1, the grey `#8b8d8f` 5.9:1. Small grey text is a
  size/hierarchy problem, not a WCAG failure.
- Under the booking labels the measured backdrop is flat ink (rgb 13,12,11), not the 3D set — labels pass at 7.1:1.
- The "Philosophy" H2 is `sr-only`, so the 24 px H2 / 46 px H3 inversion the audit shows is not visible.

---

## Tier 1 — costs bookings

### 1. The primary action has no single identity
One action, four names and three looks:

| Where | Label | Style |
|---|---|---|
| Nav `src/components/Nav.tsx:85` | Book a session | nav pill |
| Hero `src/sections/Hero.tsx:38`, Finale `src/sections/Finale.tsx:19` | Book your first session | amber button |
| Programs `src/sections/Programs.tsx:236` | Book a first session | underlined link, 28 px tall |
| Form `src/sections/Membership.tsx:144` | Request my session | `btn--ink` (bone/sand, not amber) |

The amber button is the brand's one loud signal (DIRECTION §9: amber = logo + primary CTA only), yet the button that
actually submits the booking is the one that *isn't* amber. **Fix:** one label ("Book your first session"), amber for
every instance that leads to the form and for the submit; the programme link becomes a proper ≥44 px button.

### 2. Form inputs are nearly invisible
Inputs are a single bottom hairline at `rgba(235,230,221,.28)` — measured **2.18:1** against the ink behind them. WCAG
1.4.11 asks 3:1 for the boundary of a control. In the capture (desk visit shots) the fields read as floating labels with
nothing to type into. **Fix:** raise the line to ≥ .42 alpha (≈3.2:1) or give inputs a faint filled field; keep a
brass focus line.

### 3. Hero CTAs are stranded from the message
`.hero__foot` (`src/styles/sections.css:115`) is `justify-content: space-between`, so the subcopy sits bottom-left and the
buttons bottom-right, ~900 px apart on a 1536 screen. The eye reads headline → lede and finds no action there.
**Fix:** put the CTAs directly under the lede in the same column.

### 4. The booking section is very long on phone
The phone capture shows the club picker (a heavy bone-filled selected card) plus five fields plus a submit, scrolling
well past one screen before the visitor sees the button. **Fix:** pick club inline as a two-option segmented control,
fold goal/time into one optional row.

---

## Tier 2 — system and hierarchy

### 5. No type scale
The audit finds ~40 distinct type styles. Text sizes: 13, 15, 16, 16.13, 17, 20.7, 22, 24. Display: 46, 55, 72.6, 73.7, 83,
132, 144, 190. 72.6 vs 73.7 and 16 vs 16.13 are `clamp()` drift, not intentional steps. **Fix:** define 5 text and 5 display
steps as tokens and map every `clamp()` to one.

### 6. Two display faces fighting in one section
Programs: H2 "Four ways in." is 46 px Archivo 760; the H3 "A plan with your name on it." beside it is 46 px *Geist* 600
(`.program__line`, `src/sections/Programs.tsx:225`). Same size, different face, so neither leads. **Fix:** H3 in Archivo
at a smaller step, or Geist clearly subordinate (≤ 28 px).

### 7. Off-palette pure white in the nav
`.nav { color: #fff }` (`src/styles/sections.css:20`) — every other light element is bone `#ebe6dd`. The nav is the one
thing on screen at all times, so the mismatch is always visible against bone headlines. **Fix:** `var(--bone)`.

### 8. Same content twice
"First day or fifth year" appears in Philosophy (`src/sections/Philosophy.tsx:12`) and again in "What you can count on"
(`src/sections/Coaches.tsx:10`), along with the certified-trainer promise. Repetition reads as filler. **Fix:** keep it in
one place; give the other slot something new (opening hours, a trainer, a member quote).

### 9. Outline type is too thin to read
Programme names use a 1 px stroke at .38 alpha (`src/styles/sections.css:183`) — measured 3.07:1 for the stroke colour,
but a 1 px stroke on 72 px letters has almost no ink, so it reads far fainter than that. "AFTERWARDS" (`.clubs__word`,
`sections.css:353`) is 2.34:1 — fine as decoration (it's `aria-hidden`), but it's the section's centrepiece and barely
registers in the capture. **Fix:** solid bone for the active/hovered programme and ≥ .55 stroke for the rest; decide
whether AFTERWARDS is decoration (then it can stay faint) or a headline (then make it solid).

### 10. The C7 logo isn't in the nav
The nav is a mono-caps text wordmark; the logo only appears in the footer. First impression carries no brand mark.
**Fix:** logo in the nav pill.

---

## Tier 3 — polish

11. **Off-palette blue in the 3D set.** The cardio console screens glow `#3d7fa0` (`src/scene/Machines.tsx:27`) and show up
    as floating blue shapes behind Finale and Visit. Blue isn't in the palette and it's exactly the "WebGL demo" look
    DIRECTION rules out. Fix: warm/amber-dim emissive or switch them off.
12. **Dead space.** A large empty dark band between Programs and Clubs (desk-04), and wide empty areas around "What you
    can count on". Tighten section padding or let the 3D set carry the gap deliberately.
13. **Orphan paragraph.** "Our trainers live for the high-five…" (`src/sections/Philosophy.tsx:61`) floats offset, tied to
    no heading or image.
14. **Nav overlaps headlines** while scrolling — the translucent pill sits over big display type. Hide-on-scroll-down /
    show-on-up, or more top padding on pinned sections.
15. **Clubs glimpses.** Small scattered photos with tiny captions; body text fades in over the photo. Fewer, larger images.
16. **Small targets.** Desktop menu button 24×24; "Book a first session" 28 px tall on both desktop and phone. Phone footer
    links are fine (39 px).

---

## Content gaps (may be business choices, not layout flaws)
- Membership cards are switched off (`SHOW_CARDS = false`, `src/lib/env.ts:110`), and pricing is "call for prices".
- No trainer faces anywhere, although "certified trainers" is the main promise.
- No opening hours on the page.
