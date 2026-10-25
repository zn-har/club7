import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'

const PROMISES = [
  {
    name: 'A certified trainer',
    bio: 'Every trainer on the floor is certified, and every plan starts from your goal: fat loss, muscle or endurance.',
  },
  {
    name: 'First day or fifth year',
    bio: 'Beginners and competing athletes share the same floor and the same trainers. Everyone gets coached.',
  },
  {
    name: 'For teams',
    bio: 'Corporate wellness programmes that get your people training together. Ask us about one for your company.',
  },
]

// the route is the one thing no other gym can claim
const ROUTE = [
  ['2022', 'Opened at AE Tower, Sultan Bathery, Wayanad'],
  ['2025', 'Opened at Al Quoz Mall, Dubai'],
] as const

export function Coaches() {
  return (
    <section className="section coaches on-sand" id="coaches" aria-labelledby="coaches-title">
      <div className="wrap grid coaches__head">
        <Lines id="coaches-title" className="h-lg coaches__title" lines={['What you', 'can count on.']} />
      </div>

      <ul className="wrap grid coaches__grid">
        {PROMISES.map((c, i) => (
          <li key={c.name} className="coach" data-reveal="fade" data-delay={i * 0.1}>
            <h3 className="display h-sm">{c.name}</h3>
            <p className="body-copy">{c.bio}</p>
          </li>
        ))}
      </ul>

      <figure className="wrap grid coaches__quote">
        <Photo name="c7-mezzanine" alt="The mezzanine balcony over the training floor, with the line I don't need therapy, all I need is the Club 7" parallax={6} focal="40% 50%" />
        <blockquote>
          <p className="display h-md">I don’t need therapy. All I need is the Club&nbsp;7.</p>
          <footer className="meta">Painted along the mezzanine, Al Quoz</footer>
        </blockquote>
      </figure>

      <ol className="wrap coaches__route" aria-label="Where Club 7 has opened">
        {ROUTE.map(([year, text]) => (
          <li key={year} data-reveal="fade">
            <span className="display h-md">{year}</span>
            <span className="body-copy">{text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
