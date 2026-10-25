import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'

// what's on the floor, as the club's own services page lists it
const ZONES = [
  ['Free weights', 'Barbells, plates and dumbbells for every major muscle group.'],
  ['Strength zone', 'Resistance machines set up for safe, heavy, repeatable work.'],
  ['Cardio zone', 'Treadmills and ellipticals for warm-ups, conditioning and long steady sessions.'],
  ['Freestyle area', 'Open floor for functional work and full-body sessions your trainer builds on the spot.'],
] as const

/**
 * The payoff of the take: the set steps back under a sand veil (the club's own wall colour) and
 * the real rooms take over. Every image is from c7clubseven.com. A location is captioned only where
 * the site itself places it (the Kerala page shows the tower and lockers; the Dubai page leads with
 * the brass-screen interiors); the rest say only what the frame shows.
 */
export function Clubs() {
  return (
    <section className="section clubs on-sand" id="clubs" aria-labelledby="clubs-title">
      <div className="wrap grid clubs__head">
        {/* painted over the reception in the club itself */}
        <Lines id="clubs-title" className="h-lg clubs__title" lines={['Discipline', 'starts here.']} />
        <p className="lede clubs__lede" data-reveal="fade">
          Free weights, resistance machines, cardio and open freestyle space. Lockers, showers and a hydration
          zone for afterwards. All of it kept clean.
        </p>
      </div>

      <div className="wrap grid clubs__floor">
        <figure className="clubs__plate">
          <Photo name="c7-floor" alt="The Club 7 training floor: rows of plate-loaded and selectorised machines on a terracotta floor" parallax={5} />
          <figcaption className="caption meta">
            <span>The training floor</span>
          </figcaption>
        </figure>
        <ul className="clubs__zones" aria-label="On the floor">
          {ZONES.map(([name, note], i) => (
            <li key={name} data-reveal="fade" data-delay={i * 0.08}>
              <h3 className="clubs__zone">{name}</h3>
              <p className="body-copy">{note}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="wrap grid clubs__pair">
        <figure className="clubs__entrance">
          <Photo name="c7-entrance" alt="The entrance: brass grid screens, a lounge behind railings and the words Stronger than you walked in on the wall" focal="55% 50%" />
          <figcaption className="caption meta">
            <span>The way in at Al Quoz, Dubai. The line on the wall is ours.</span>
          </figcaption>
        </figure>
        <figure className="clubs__reception">
          <Photo name="c7-reception" alt="Reception desk in front of a walnut slatted wall with the brass Club 7 mark" warm focal="70% 50%" />
          <figcaption className="caption meta">
            <span>Reception</span>
          </figcaption>
        </figure>
      </div>

      <ul className="wrap clubs__amenities" aria-label="Facilities">
        <li>
          <Photo name="c7-lockers" alt="A row of timber lockers along a corridor with a bench" warm />
          <p className="clubs__amenity">Lockers, Sultan Bathery</p>
        </li>
        <li>
          <Photo name="c7-showers" alt="Showers and washbasins in grey stone with frosted glass partitions" />
          <p className="clubs__amenity">Showers</p>
        </li>
        <li>
          <Photo name="c7-tower" alt="AE Tower in Sultan Bathery from above, with the Club 7 sign on its top floor and the Wayanad hills behind" />
          <p className="clubs__amenity">AE Tower, Sultan Bathery</p>
        </li>
      </ul>
    </section>
  )
}
