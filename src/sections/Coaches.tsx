import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'
import { SHOW_CARDS } from '../lib/env'

const COACHES = [
  {
    name: 'Certified trainers',
    role: 'Coaching',
    bio: 'Every trainer on the floor is certified, and every plan starts from your goal.',
    photo: { name: 'coach-m', alt: 'A Club 7 trainer on the gym floor', focal: '55% 25%' },
  },
  {
    name: 'Kept clean',
    role: 'Facilities',
    bio: 'Wiped-down kit, clean lockers and showers, and a hydration zone to reset before you head out.',
    photo: { name: 'coach-f', alt: 'Clean locker room and showers', focal: '40% 30%' },
  },
  {
    name: 'Corporate wellness',
    role: 'For teams',
    bio: 'Workplace programmes that get your people training together. Ask us about one for your company.',
    photo: { name: 'coach-2', alt: 'A team training together', focal: '50% 30%' },
  },
]

export function Coaches() {
  return (
    <section className="section coaches" id="coaches" aria-labelledby="coaches-title">
      <div className="wrap grid coaches__head">
        <Lines id="coaches-title" className="h-lg coaches__title" lines={['What you', 'can count on.']} />
        <p className="lede coaches__lede" data-reveal="fade">
          Three things we hold every session to, at both clubs.
        </p>
      </div>

      <ul className="wrap coaches__grid">
        {COACHES.map((c, i) => (
          <li key={c.name} className="coach">
            {SHOW_CARDS && <Photo name={c.photo.name} alt={c.photo.alt} focal={c.photo.focal} className="coach__photo" />}
            <div className="coach__text" data-reveal="fade" data-delay={i * 0.12}>
              <p className="meta">{c.role}</p>
              <h3 className="display h-sm">{c.name}</h3>
              <p className="body-copy">{c.bio}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
