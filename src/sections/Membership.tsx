import { useState, type FormEvent } from 'react'
import { Lines } from '../components/Lines'

const EMAIL = 'info@c7clubseven.com'

// one entry per club; pricing and hours differ and aren't published, so the phone is the answer
const CLUBS = [
  {
    id: 'wayanad',
    name: 'Sultan Bathery',
    address: ['AE Tower, Sultan Bathery', 'Wayanad, Kerala'],
    since: 'Open since 2022',
    phone: '+91 9207 55 66 22',
    tel: '+919207556622',
    maps: 'https://www.google.com/maps/search/?api=1&query=Club+Seven+Fitness+AE+Tower+Sultan+Bathery+Wayanad',
  },
  {
    id: 'dubai',
    name: 'Al Quoz, Dubai',
    address: ['Al Quoz Mall', 'Dubai, UAE'],
    since: 'Open since 2025',
    phone: '+971 52 53 15875',
    tel: '+971525315875',
    maps: 'https://www.google.com/maps/search/?api=1&query=Club+Seven+Fitness+Al+Quoz+Mall+Dubai',
  },
] as const

const GOALS = ['Fat loss', 'Muscle gain', 'Endurance', 'Not sure yet'] as const
const TIMES = ['Early morning', 'Daytime', 'Evening'] as const

type Sent = { first: string; club: (typeof CLUBS)[number] }

export function Membership() {
  const [club, setClub] = useState<(typeof CLUBS)[number]['id']>('wayanad')
  const [sent, setSent] = useState<Sent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    if (!name) return setError('Add your name so the trainer knows who to expect.')
    if (phone.replace(/\D/g, '').length < 7 && !/^\S+@\S+\.\S+$/.test(email))
      return setError('Add a phone number or an email address so we can confirm your session.')
    setError(null)
    const c = CLUBS.find((x) => x.id === club)!
    // No booking backend yet: the request leaves as a ready-to-send email to the club, never
    // dropped silently. Swap this for a POST when Club 7 has an endpoint.
    const body = [
      `Name: ${name}`,
      phone && `Phone: ${phone}`,
      email && `Email: ${email}`,
      `Club: ${c.name}`,
      `Goal: ${data.get('goal')}`,
      `Usually trains: ${data.get('time')}`,
    ]
      .filter(Boolean)
      .join('\n')
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`First session request, ${c.name}`)}&body=${encodeURIComponent(body)}`
    setSent({ first: name.split(' ')[0], club: c })
  }

  return (
    <section className="section membership on-sand" id="membership" aria-labelledby="membership-title">
      <div className="wrap grid membership__head">
        <Lines id="membership-title" className="h-lg membership__title" lines={['Come train', 'once.']} />
        <p className="lede membership__lede" data-reveal="fade">
          Pick a club and tell us when you train. A trainer will meet you for your first session and start your plan.
        </p>
      </div>

      <div className="wrap grid booking">
        <fieldset className="booking__clubs">
          <legend className="meta">Your club</legend>
          {CLUBS.map((c) => (
            <label key={c.id} className={`club ${club === c.id ? 'is-active' : ''}`}>
              <input type="radio" name="club-pick" value={c.id} checked={club === c.id} onChange={() => setClub(c.id)} />
              <span className="club__name display h-sm">{c.name}</span>
              <span className="club__detail body-copy">
                {c.address[0]}
                <br />
                {c.address[1]}
              </span>
              <span className="club__since meta">{c.since}</span>
            </label>
          ))}
        </fieldset>

        {sent ? (
          <div className="booking__done" role="status">
            <p className="display h-md">Nearly there, {sent.first}.</p>
            <p className="body-copy">
              Your email app should have opened with the request for {sent.club.name} written out. Press send and the
              club will reply to book your session. If nothing opened, call the club instead.
            </p>
            <div className="booking__actions">
              <a className="btn btn--ink" href={`tel:${sent.club.tel}`}>
                Call {sent.club.name}
              </a>
              <button className="text-link" onClick={() => setSent(null)}>
                Edit the request
              </button>
            </div>
          </div>
        ) : (
          <form className="booking__form" onSubmit={submit} noValidate aria-describedby={error ? 'booking-error' : undefined}>
            <div className="field field--wide">
              <label htmlFor="booking-name" className="meta">Name</label>
              <input id="booking-name" name="name" autoComplete="name" required aria-invalid={error?.includes('your name') || undefined} />
            </div>
            <div className="field">
              <label htmlFor="booking-phone" className="meta">Phone</label>
              <input id="booking-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={error?.includes('phone') || undefined} />
            </div>
            <div className="field">
              <label htmlFor="booking-email" className="meta">Email (optional)</label>
              <input id="booking-email" name="email" type="email" autoComplete="email" aria-invalid={error?.includes('phone') || undefined} />
            </div>
            <div className="field">
              <label htmlFor="booking-goal" className="meta">Goal</label>
              <select id="booking-goal" name="goal" defaultValue={GOALS[0]}>
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="booking-time" className="meta">Usually train</label>
              <select id="booking-time" name="time" defaultValue={TIMES[2]}>
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            {error && (
              <p className="booking__error" id="booking-error" role="alert">
                {error}
              </p>
            )}
            <div className="booking__submit">
              <button type="submit" className="btn btn--ink">
                Request my session
              </button>
              <p className="meta">Sends to {EMAIL}. Prefer to talk? Call the club below.</p>
            </div>
          </form>
        )}
      </div>

      <ul className="wrap grid visit" aria-label="Contact each club">
        {CLUBS.map((c) => (
          <li key={c.id} className="visit__club">
            <p className="visit__name">{c.name}</p>
            <a className="visit__phone display" href={`tel:${c.tel}`}>
              {c.phone}
            </a>
            <p className="body-copy">Call for opening hours and membership prices.</p>
            <a className="text-link" href={c.maps} target="_blank" rel="noreferrer">
              Get directions
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
