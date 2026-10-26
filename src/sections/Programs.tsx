import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'
import { pointerFx as POINTER_FX, SHOW_CARDS } from '../lib/env'
import { pickProgram } from '../motion/choreography'

const PROGRAMS = [
  {
    id: 'strength',
    name: 'Personal Training',
    kind: 'One to one',
    line: 'A plan with your name on it.',
    body: 'A certified trainer looks at your body type, your goal and your schedule, then writes the programme. Fat loss, muscle gain or endurance. You’ll know what each session is for before you start it.',
    photo: { name: 'lift-f', alt: 'A lifter sets up under a barbell with a trainer beside them', focal: '50% 35%' },
    facts: [['Led by', 'Certified trainer'], ['Goals', 'Fat loss, muscle, endurance'], ['Level', 'Any']],
  },
  {
    id: 'conditioning',
    name: 'Dynamic Movement',
    kind: 'Functional',
    line: 'Train the way you move.',
    body: 'Three-dimensional exercises built on the body’s natural patterns: twisting, reaching, lunging, lifting. Strength you’ll use on the stairs and the pitch.',
    photo: { name: 'rope', alt: 'An athlete rests with battle ropes over one shoulder', focal: '45% 30%' },
    facts: [['Focus', 'Natural movement'], ['Planes', 'All three'], ['Level', 'Any']],
  },
  {
    id: 'personal',
    name: 'Quick Result',
    kind: 'Core strength',
    line: 'Core first.',
    body: 'Weight-bearing work aimed at the abdomen and lower back, the muscles that hold every other lift together.',
    photo: { name: 'shoulder-bar', alt: 'A lifter braces under a loaded bar during a core-focused set', focal: '50% 30%' },
    facts: [['Focus', 'Core and lower back'], ['Method', 'Weight-bearing'], ['Level', 'Any']],
  },
  {
    id: 'recovery',
    name: 'Group Sessions',
    kind: 'Small group',
    line: 'Louder together.',
    body: 'High-intensity rounds, functional work and a proper stretch at the end, scaled so first-timers and regulars finish at the same time.',
    // [NEED: group class photo] the sauna image stays until one arrives
    photo: { name: 'steam', alt: 'A group finishing a session together on the gym floor', focal: '50% 60%', warm: true },
    facts: [['Format', 'Trainer-led group'], ['Includes', 'HIIT, functional, stretch'], ['Level', 'All']],
  },
] as const

// split glyphs lose the font's kerning; put back the pairs these names need
const KERN: Record<string, string> = { LT: '-0.07em', AV: '-0.05em', VA: '-0.05em' }

/** Letters that roll up to a copy of themselves on hover, one after another. */
function RollText({ text, className }: { text: string; className: string }) {
  const chars = [...text]
  return (
    <span className={className} aria-hidden="true">
      {chars.map((ch, i) => {
        const l = ch === ' ' ? ' ' : ch
        const style = { '--i': i, marginRight: KERN[ch + chars[i + 1]] } as CSSProperties
        return (
          <span key={i} data-l={l} style={style}>
            {l}
          </span>
        )
      })}
    </span>
  )
}

/**
 * A photo of the hovered programme that trails the cursor: it eases after the pointer,
 * leans into the direction of travel, and cross-fades as you move between rows.
 */
function usePeek() {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<number | null>(null)
  const p = useRef({ x: 0, y: 0, tx: 0, ty: 0, live: false })

  useEffect(() => {
    const el = ref.current
    if (!el || shown === null) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const s = p.current
      // eased by elapsed time so the trail feels the same at any frame rate
      const k = 1 - Math.pow(1 - 0.14, Math.min(now - last, 100) / 16.67)
      last = now
      s.x += (s.tx - s.x) * k
      s.y += (s.ty - s.y) * k
      const lean = Math.max(-9, Math.min(9, (s.tx - s.x) * 0.06))
      el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${lean}deg)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // scrolling under a still cursor fires no pointerleave, so let the page put it away
    const away = () => {
      p.current.live = false
      setShown(null)
    }
    window.addEventListener('scroll', away, { passive: true, once: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', away)
    }
  }, [shown])

  const move = (x: number, y: number) => {
    const s = p.current
    s.tx = x
    s.ty = y
    // first contact: appear under the cursor instead of flying in from the corner
    if (!s.live) {
      s.x = x
      s.y = y
      s.live = true
    }
  }
  const hide = () => {
    p.current.live = false
    setShown(null)
  }
  return { ref, shown, setShown, move, hide }
}

export function Programs() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const peek = usePeek()

  // the spotlight: each row knows where the cursor is inside its letters
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!POINTER_FX || e.pointerType !== 'mouse') return
    const row = (e.target as HTMLElement).closest<HTMLElement>('.programs__row')
    if (!row) return
    const word = row.querySelector<HTMLElement>('.programs__word')
    if (word) {
      const r = word.getBoundingClientRect()
      word.style.setProperty('--mx', `${e.clientX - r.left}px`)
      word.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    const i = Number(row.dataset.index)
    if (peek.shown !== i) peek.setShown(i)
    // the photo hangs just off the cursor, clear of the letters it is lighting,
    // and never slides up under the nav or off the right edge
    const box = peek.ref.current?.getBoundingClientRect()
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))
    peek.move(
      Math.min(e.clientX + 32, window.innerWidth - (box?.width ?? 0) - 16),
      Math.max(navH + 8, e.clientY - 150),
    )
  }

  const select = (i: number) => {
    setActive(i)
    // the camera crosses the floor to that discipline's station
    pickProgram(PROGRAMS[i].id)
  }

  // arrow keys move between tabs, as a tablist should
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    let next = step === undefined ? -1 : (active + step + PROGRAMS.length) % PROGRAMS.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = PROGRAMS.length - 1
    if (next < 0) return
    e.preventDefault()
    select(next)
    tabs.current[next]?.focus()
  }

  const p = PROGRAMS[active]

  return (
    <section className="section programs" id="programs" aria-labelledby="programs-title">
      <div className="wrap programs__inner">
        <Lines id="programs-title" className="programs__title" lines={[<>Four ways <span className="programs__accent">in.</span></>]} />
        <div className="programs__index" role="tablist" aria-label="Programs" aria-orientation="vertical"
          onKeyDown={onKey}
          onPointerMove={onPointerMove}
          onPointerLeave={peek.hide}
        >
          {PROGRAMS.map((q, i) => (
            <button
              key={q.id}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              id={`program-tab-${q.id}`}
              aria-selected={i === active}
              aria-controls="program-panel"
              tabIndex={i === active ? 0 : -1}
              className={`programs__row${i === active ? ' is-active' : ''}`}
              data-index={i}
              data-cursor="spot"
              onClick={() => select(i)}
            >
              <span className="programs__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="programs__word">
                <span className="sr-only">{q.name}</span>
                {/* outline underneath, solid on top: the solid sweeps in when the row opens */}
                <RollText text={q.name} className="programs__ghost" />
                <RollText text={q.name} className="programs__fill" />
                {/* brass, masked to a pool of light around the cursor */}
                {POINTER_FX && <RollText text={q.name} className="programs__lit" />}
              </span>
            </button>
          ))}
        </div>
        {POINTER_FX &&
          createPortal(
            <div ref={peek.ref} className={`programs__peek${peek.shown !== null ? ' is-on' : ''}`} aria-hidden="true">
              {PROGRAMS.map((q, i) => (
                <div key={q.id} className={`photo${'warm' in q.photo ? ' warm' : ''}${peek.shown === i ? ' is-shown' : ''}`}>
                  <img src={`/img/${q.photo.name}-sm.webp`} alt="" style={{ objectPosition: q.photo.focal }} />
                </div>
              ))}
            </div>,
            document.body,
          )}
        <article className="program" id="program-panel" role="tabpanel" aria-labelledby={`program-tab-${p.id}`}>
          <div className="program__text" key={p.id}>
            <p className="program__eyebrow">{p.kind}</p>
            {/* the index row already shouts the name; the card leads with the promise */}
            <h3 className="program__line">{p.line}</h3>
            <p className="program__body">{p.body}</p>
            <dl className="program__facts">
              {p.facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="meta">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <a className="text-link program__cta" href="#membership">
              Book a first session
            </a>
          </div>
          {SHOW_CARDS && <figure className="program__inset">
            <Photo name={p.photo.name} alt={p.photo.alt} focal={p.photo.focal} warm={'warm' in p.photo} />
            <figcaption className="meta">On the floor</figcaption>
          </figure>}
        </article>
      </div>
    </section>
  )
}
