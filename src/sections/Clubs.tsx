import { useEffect, useRef } from 'react'
import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'
import { pointerFx } from '../lib/env'

const WORD = 'Afterwards'
const REACH = 300 // px: how far from the cursor a letter still feels it

/**
 * The letters of AFTERWARDS flex under the cursor. Each one eases toward a pull set by its
 * distance from the pointer: close letters widen and gain weight on the variable font's axes
 * and fill brass out of their outline, then relax back as the cursor moves on. It keeps
 * running while the band drifts under a still cursor, and sleeps once everything has settled.
 */
function useFlex() {
  const band = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const host = band.current
    const letters = Array.from(word.current?.children ?? []) as HTMLElement[]
    if (!pointerFx || !host || !letters.length) return

    const m = { x: 0, y: 0, in: false }
    const pull = letters.map(() => 0)
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const k = 1 - Math.pow(1 - 0.12, Math.min(now - last, 100) / 16.67)
      last = now
      let moving = m.in
      letters.forEach((l, i) => {
        let target = 0
        if (m.in) {
          const b = l.getBoundingClientRect()
          const d = Math.hypot(m.x - (b.left + b.width / 2), m.y - (b.top + b.height / 2))
          target = Math.max(0, 1 - d / REACH) ** 1.6
        }
        pull[i] += (target - pull[i]) * k
        if (Math.abs(target - pull[i]) > 0.002) moving = true
        const t = pull[i]
        l.style.fontVariationSettings = `'wdth' ${64 + t * 36}, 'wght' ${760 + t * 140}`
        l.style.color = `rgba(194, 154, 91, ${t * 0.95})`
        l.style.webkitTextStrokeColor = `rgba(${235 - t * 41}, ${230 - t * 76}, ${221 - t * 130}, ${0.3 + t * 0.7})`
      })
      raf = moving ? requestAnimationFrame(tick) : 0
    }
    const wake = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      m.x = e.clientX
      m.y = e.clientY
      m.in = true
      wake()
    }
    const onLeave = () => {
      m.in = false
      wake()
    }
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return { band, word }
}

// what's on the floor, as the club's own services page lists it
const ZONES = [
  ['Free weights', 'Barbells, plates and dumbbells for every major muscle group.'],
  ['Strength zone', 'Resistance machines set up for safe, heavy, repeatable work.'],
  ['Cardio zone', 'Treadmills and ellipticals for warm-ups, conditioning and long steady sessions.'],
  ['Freestyle area', 'Open floor for functional work and full-body sessions your trainer builds on the spot.'],
] as const

// glimpses of the building that float around the floor before it opens up
const GLIMPSES = [
  { name: 'c7-mezzanine', alt: 'A mezzanine and staircase over the entrance hall, with the line I don’t need therapy, all I need is the Club 7 on its balcony', caption: 'Mezzanine' },
  { name: 'c7-entrance', alt: 'The entrance: brass grid screens, a lounge behind railings and the words Stronger than you walked in on the wall', caption: 'The way in, Al Quoz', focal: '55% 50%' },
  { name: 'c7-reception', alt: 'Reception desk in front of a walnut slatted wall with the brass Club 7 mark', caption: 'Reception', focal: '70% 50%', warm: true },
] as const

const AMENITIES = [
  { name: 'c7-lockers', alt: 'A row of timber lockers along a corridor with a bench', caption: 'Lockers, Sultan Bathery', warm: true },
  { name: 'c7-showers', alt: 'Showers and washbasins in grey stone with frosted glass partitions', caption: 'Showers' },
  { name: 'c7-tower', alt: 'AE Tower in Sultan Bathery from above, with the Club 7 sign on its top floor and the Wayanad hills behind', caption: 'AE Tower, Sultan Bathery' },
] as const

/**
 * The payoff of the take: the set steps back under the veil and the real rooms take over.
 * On wide screens the stage pins: the floor opens from a small frame to the full screen while
 * glimpses of the building drift out of the way (motion/choreography.ts, buildClubs). Without
 * that (phones, reduced motion, no JS) the same parts read as a plain stack.
 * Every image is from c7clubseven.com; a location is captioned only where the site places it.
 */
export function Clubs() {
  const flex = useFlex()
  return (
    <section className="section clubs on-sand" id="clubs" aria-labelledby="clubs-title">
      <div className="clubs__stage">
        {/* painted over the reception in the club itself */}
        <Lines id="clubs-title" className="h-lg clubs__title" lines={['Discipline', 'starts here.']} />

        <figure className="clubs__plate">
          <Photo
            name="c7-floor"
            alt="The Club 7 training floor: rows of plate-loaded and selectorised machines on a terracotta floor"
            reveal={false}
          />
          <div className="clubs__shade" aria-hidden="true" />
        </figure>

        <div className="wrap clubs__brief">
          <p className="clubs__lede">
            Free weights, resistance machines, cardio and open freestyle space. Lockers, showers and a hydration
            zone for afterwards. All of it kept clean.
          </p>
          <ul className="clubs__zones" aria-label="On the floor">
            {ZONES.map(([name, note], i) => (
              <li key={name} className="clubs__zone">
                <p className="clubs__zone-num">{String(i + 1).padStart(2, '0')}</p>
                <h3>{name}</h3>
                <p>{note}</p>
              </li>
            ))}
          </ul>
        </div>

        <ul className="clubs__glimpses" aria-label="Around the club">
          {GLIMPSES.map((g) => (
            <li key={g.name} className="clubs__glimpse">
              <Photo name={g.name} alt={g.alt} focal={'focal' in g ? g.focal : undefined} warm={'warm' in g} />
              <p className="meta">{g.caption}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="clubs__after" ref={flex.band}>
        <p className="clubs__word" aria-hidden="true" ref={flex.word}>
          {[...WORD].map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>
        <ul className="wrap clubs__amenities" aria-label="Facilities">
          {AMENITIES.map((a) => (
            <li key={a.name}>
              <Photo name={a.name} alt={a.alt} warm={'warm' in a} />
              <p className="clubs__amenity">{a.caption}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
