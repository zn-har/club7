import { Photo } from '../components/Photo'
import { SHOW_CARDS } from '../lib/env'

const PRINCIPLES = [
  {
    n: '01',
    title: 'Your plan, written for you',
    body: 'Certified trainers build it around your body, your goal and your week, then change it as you get stronger.',
  },
  {
    n: '02',
    title: 'First day or fifth year',
    body: 'Beginners and competing athletes share the same floor and the same trainers. Everyone gets coached.',
  },
  {
    n: '03',
    title: 'Clean is a standard',
    body: 'Equipment wiped down, floors swept, showers and lockers kept the way you’d want them at home.',
  },
]

export function Philosophy() {
  return (
    <section className="section philosophy" id="philosophy" aria-labelledby="philosophy-title">
      <div className="wrap grid philosophy__intro">
        <h2 className="sr-only" id="philosophy-title">
          Philosophy
        </h2>
        <p className="display h-md philosophy__statement" data-words>
          We opened in Sultan Bathery in 2022 so the town had a real place to train. In 2025, Dubai got one too.
        </p>
        <ol className="principles__list">
          {PRINCIPLES.map((p, i) => (
            <li key={p.n} className="principle" data-reveal="fade" data-delay={i * 0.1}>
              <h3 className="display h-sm">{p.title}</h3>
              <p className="body-copy">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* the wrapper stays either way: it cues the camera's jib up */}
      <div className="wrap grid philosophy__images">
        {SHOW_CARDS && (<>
        <figure className="philosophy__wide">
          <Photo name="deadlift" alt="An athlete grips a loaded barbell before a deadlift, lit by a single overhead light" parallax={8} focal="62% 60%" />
          <figcaption className="caption meta">
            <span>The first pull</span>
            <span>Sultan Bathery, early</span>
          </figcaption>
        </figure>
        <figure className="philosophy__tall">
          <Photo name="hang" alt="An athlete hangs from a bar in near darkness, back muscles catching the light" parallax={10} focal="50% 40%" />
          <figcaption className="caption meta">
            <span>Dead hang</span>
          </figcaption>
        </figure>
        </>)}
        <div className="philosophy__aside">
          <p className="body-copy" data-reveal="fade">
            Our trainers live for the high-five at the end of a hard session. You’ll get yours on day one.
          </p>
        </div>
      </div>
    </section>
  )
}
