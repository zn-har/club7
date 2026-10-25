import { useRef, useState, type KeyboardEvent } from 'react'
import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'
import { SHOW_CARDS } from '../lib/env'
import { pickProgram } from '../motion/choreography'

const PROGRAMS = [
  {
    id: 'strength',
    name: 'Personal Training',
    line: 'A plan with your name on it.',
    body: 'A certified trainer looks at your body type, your goal and your schedule, then writes the programme. Fat loss, muscle gain or endurance. You’ll know what each session is for before you start it.',
    photo: { name: 'lift-f', alt: 'A lifter sets up under a barbell with a trainer beside them', focal: '50% 35%' },
    facts: [['Led by', 'Certified trainer'], ['Goals', 'Fat loss, muscle, endurance'], ['Level', 'Any']],
  },
  {
    id: 'conditioning',
    name: 'Dynamic Movement',
    line: 'Train the way you move.',
    body: 'Three-dimensional exercises built on the body’s natural patterns: twisting, reaching, lunging, lifting. Strength you’ll use on the stairs and the pitch.',
    photo: { name: 'rope', alt: 'An athlete rests with battle ropes over one shoulder', focal: '45% 30%' },
    facts: [['Focus', 'Natural movement'], ['Planes', 'All three'], ['Level', 'Any']],
  },
  {
    id: 'personal',
    name: 'Quick Result',
    line: 'Core first.',
    body: 'Weight-bearing work aimed at the abdomen and lower back, the muscles that hold every other lift together.',
    photo: { name: 'shoulder-bar', alt: 'A lifter braces under a loaded bar during a core-focused set', focal: '50% 30%' },
    facts: [['Focus', 'Core and lower back'], ['Method', 'Weight-bearing'], ['Level', 'Any']],
  },
  {
    id: 'recovery',
    name: 'Group Sessions',
    line: 'Louder together.',
    body: 'High-intensity rounds, functional work and a proper stretch at the end, scaled so first-timers and regulars finish at the same time.',
    // [NEED: group class photo] the sauna image stays until one arrives
    photo: { name: 'steam', alt: 'A group finishing a session together on the gym floor', focal: '50% 60%', warm: true },
    facts: [['Format', 'Trainer-led group'], ['Includes', 'HIIT, functional, stretch'], ['Level', 'All']],
  },
] as const

export function Programs() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

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
        <Lines id="programs-title" className="h-lg programs__title" lines={['Four ways', 'in.']} />
        <div className="programs__tabs" role="tablist" aria-label="Programs" onKeyDown={onKey}>
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
              className={i === active ? 'is-active' : ''}
              onClick={() => select(i)}
            >
              {q.name}
            </button>
          ))}
        </div>
        <article className="program" id="program-panel" role="tabpanel" aria-labelledby={`program-tab-${p.id}`}>
          <div className="program__text" key={p.id}>
            <p className="meta program__count">
              {active + 1} of {PROGRAMS.length}
            </p>
            <h3 className="display h-lg">{p.name}</h3>
            <p className="program__line serif">{p.line}</p>
            <p className="body-copy">{p.body}</p>
            <dl className="program__facts">
              {p.facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="meta">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
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
