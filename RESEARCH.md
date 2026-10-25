# Club 7: Research, Audit and Direction (Oct 2026)

Read before `DIRECTION.md`. It sets out why the redesign changed what it changed.

## 1. Market

**UAE / Dubai**
- Traditional gyms are now about a quarter of UAE operators. Hybrid and boutique concepts make up most of the rest, and more than half of operators position as premium (Dh500+/month; UAE average Dh927). Members ask for flexible pricing, and their spending is moving into PT, recovery and nutrition. ([The National, Jul 2026](https://www.thenationalnews.com/lifestyle/wellbeing/2026/07/24/have-we-hit-peak-gym-in-the-uae/))
- Al Quoz is home turf for two opposite brands. **Warehouse Gym** (born in Al Quoz) sells identity: design, music, community, "each gym is different". **GymNation** (also Al Quoz) sells value: 45,000 sqft, 500+ machines, 200 classes. ([Gulf Business](https://gulfbusiness.com/en/2026/interviews/warehouse-gyms-kevin-texieria-on-what-is-determining-the-future-of-fitness/), [Gulf Business](https://gulfbusiness.com/five-minutes-gymnation-founders-loren-holland-frank-afeak/))
- At the luxury end (e.g. SEVEN Dubai, $18k+/yr) the pitch is wellness, recovery and exclusivity. ([Sotheby's Realty](https://blog.sothebysrealty.ae/the-journal/luxury-gym-in-dubai), [Luxury Columnist](https://luxurycolumnist.com/most-luxurious-gyms/))

**India / Kerala**
- The market is ₹16,200 cr with 12.3M members, at 0.8% penetration, and is projected to reach ₹37,700 cr by 2030. Premium (16% CAGR) and boutique (19%) are growing fastest. Tier-2 cities are called "untapped", and price is the main reason people don't join (52%). ([HFA/Deloitte via Health Club Management](https://www.healthclubmanagement.co.uk/health-club-management-news/Momentum-building-and-opportunities-are-immense-in-Indias-fitness-market-finds-HFA-report/357914))
- Sultan Bathery is a hill town of the kind these reports call untapped. A designed, clean, coached club is rare there, so the Wayanad club is premium by local standard rather than by price.

**International benchmarks (principles, not layouts)**
- Equinox: provocative, confident tone with type that does the work, and a refusal of fitness cliché ([Cannes Lions](https://lovethework.com/work-awards/campaigns/equinox-237675)).
- 1Rebel: "industrial luxe" of black steel and copper, with a destination rather than a gym, and a non-judgemental voice ([Dexigner](https://www.dexigner.com/news/27992)).
- Conversion patterns that hold across vendors: a trial CTA above the fold, real photos over stock, booking in one step, a mobile-first layout, speed (53% of mobile visitors leave slow pages), and fast follow-up on leads (a lead reached within 5 min is about 21x likelier to convert). These figures come from vendor sources, so treat them as directional ([GymDesk](https://gymdesk.com/blog/9-gym-website-ideas-what-makes-a-good-gym-website), [Splitforms](https://splitforms.com/blog/best-contact-form-for-gyms)).

**Audience**
1. *Dubai, Al Quoz / Al Barsha / JVC residents and workers.* They are 25–45 and time-poor, and they pick a gym by commute and feel. They judge it by how the space looks, by cleanliness and by coaching. Most are choosing between "design-led and pricey" and "big box and anonymous".
2. *Wayanad, Sultan Bathery locals, students and returning NRIs.* For them this may be a first serious gym. Trust, a clean space, beginner-friendliness and a trainer who writes the plan come first. They book by calling or WhatsApp, not by app.
3. *Corporate wellness buyers*, in both cities.

**Triggers:** see the real space, know a trainer will guide you, and get a low-commitment first session that you can book from the phone in under a minute.

**Lasting vs. overused**
- Lasting: real photography, oversized confident type, one accent colour, restraint in motion, a short booking path.
- Overused: neon gradients, glass cards, stock "sweaty athlete" images, counters with self-scored stats, 3D that moves all the time, carousels.

**Gap for Club 7:** in Al Quoz the choice is identity-led *or* value-led. Club 7's real interiors (brass grid metalwork, sand walls, walnut slats, linear light) are already more refined than the big boxes. Its own wall copy is also more honest than anything an agency would write: *"Stronger than you walked in." "Discipline starts here." "I don't need therapy, all I need is the Club 7."* The brand is the route from a hill town in Kerala to Dubai, told through its own materials.

## 2. Audit of the previous redesign (`club7-seven.vercel.app`)

**Works (kept)**
- One persistent R3F canvas with a single GSAP-scrubbed take. It is an architecture that can't race itself.
- A physically built barbell, plates, kettlebells and dumbbells (IWF dimensions), PBR rubber and concrete, a real HDRI, PCSS shadows, a key light that finds each station, and the NaN-sanitising post chain.
- Honest copy (`COPY.md`), with no invented stats.
- Tablist a11y, reduced-motion cuts, and WebGL fallbacks.

**Off-brand / generic**
- Red accent (`#d4161c`). Club 7's mark is amber `#F7A600` and its rooms are brass and sand, so the red belonged to a different brand.
- **No Club 7 imagery at all.** Stock was hidden (`SHOW_CARDS = false`), and the "The floor" panorama is Poly Haven's `gym_01`, someone else's gym. It is presented as the facility, which misleads.
- The text wordmark stood in for the actual logo.
- Leftover template tells: the "01" hero index, numbered nav, and a red drip scroll line.

**Excessive motion**
- Nine shots for seven sections. The camera never rests, and the hero starts moving on the first pixel of scroll.
- The `above` jib goes into darkness and reveals nothing. The coaches, membership and finale shots frame mostly empty rubber floor, and the top-down finale with its roll loses the bar entirely.
- Text sits directly over moving 3D with no scrim, so the philosophy statement and programme copy collide with the plates (see screenshots).

**Conversion**
- The form "submits" to nothing: no backend, no email, no call. The lead is lost.
- No phone-first path, no map links, no hours.

**Performance**
- The canvas renders every frame, even while full-bleed content covers it.
- A 4K panorama texture and a second WebGL context for the panorama.

## 3. Direction: "Brass, chalk, one light"

- **Idea:** the barbell under one light is the opening shot, and the real club is the payoff. The 3D sets the mood, then steps back so real Club 7 photographs can show the actual product.
- **Palette:** warm ink `#0d0c0b`, bone `#ece6da`, sand `#b9a88a` (their walls), brass `#c29a5b` (their metalwork) for hairlines and state, and amber `#F7A600` (their logo) only for the primary CTA and the mark. No red.
- **Type:** Archivo condensed for display (kept), Geist for text (kept), and Instrument Serif reduced to one-line programme summaries.
- **Photography:** Club 7's own gallery, graded towards warm low-saturation so renders and phone photos sit together. Nothing captioned with a location it can't be verified for.
- **Motion:** five camera states, not nine. The hero holds, then macro on the knurl, then each station per programme tab. The stage then dims under a veil while real photos carry the middle of the page, and comes back lit on the bar for the finale. Type moves only on entry.
- **Mist:** prototyped, then removed at the client's request. The scene keeps only the original faint key-light beam.
- **Booking:** pick a club, then name, phone, goal and time. The request goes out as a prefilled email to info@c7clubseven.com with call links as the instant alternative. Nothing is lost silently.

## 4. Still needed from Club 7

- Opening hours for each club.
- Membership pricing (AED / INR).
- Confirmation of image locations. Placed so far from the site's own pages: tower and lockers are Sultan Bathery (Kerala page), and the brass-screen interior series is Dubai (Dubai page uses `portfolio-3`). The terracotta training floor, reception and showers are unplaced. Also whether the Dubai series is renders or the finished club.
- A WhatsApp-enabled number (it would likely beat email for both audiences).
- A booking backend or CRM endpoint (the form is ready to post to one).
