import { useState, type FormEvent } from 'react'
import { Lines } from '../components/Lines'

// one card per club; pricing differs by currency, so none is shown until confirmed
const CLUBS = [
  {
    id: 'wayanad',
    name: 'Sultan Bathery',
    label: 'Sultan Bathery, Wayanad',
    summary: 'Where it started.',
    items: ['AE Tower, Sultan Bathery, Wayanad', 'Open since 2022', 'Personal training and group sessions', '+91 9207 55 66 22'],
  },
  {
    id: 'dubai',
    name: 'Al Quoz, Dubai',
    label: 'Al Quoz Mall, Dubai',
    summary: 'The second address.',
    featured: true,
    items: ['Al Quoz Mall, Dubai', 'Open since 2025', 'Personal training and group sessions', '+971 52 53 15875'],
  },
]

export function Membership() {
  const [club, setClub] = useState('wayanad')
  const [sent, setSent] = useState<null | string>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Add your name and a working email so we can reach you.')
      return
    }
    setError(null)
    // No backend in this build — the enquiry is acknowledged locally.
    setSent(name.split(' ')[0])
    form.reset()
  }

  return (
    <section className="section membership" id="membership" aria-labelledby="membership-title">
      <div className="wrap grid membership__head">
        <Lines id="membership-title" className="h-lg membership__title" lines={['Find your', 'club.']} />
        <p className="lede membership__lede" data-reveal="fade">
          Two addresses. Pick the one closest to you, tell us when you train, and we’ll set up your first
          session.
        </p>
      </div>

      <ul className="wrap tiers">
        {CLUBS.map((c, i) => (
          <li key={c.id} className={`tier ${c.featured ? 'tier--featured' : ''}`} data-reveal="fade" data-delay={i * 0.1}>
            <span className="tier__hairline" aria-hidden />
            <div className="tier__top">
              <h3 className="display h-sm">{c.name}</h3>
              {c.featured && <span className="meta tier__badge">Newest</span>}
            </div>
            <p className="tier__summary serif">{c.summary}</p>
            <ul className="tier__items">
              {c.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
              {/* [NEED: membership pricing] */}
            </ul>
            <button
              className={`btn ${c.featured ? 'btn--solid' : 'btn--ghost'} tier__cta`}
              onClick={() => {
                setClub(c.id)
                document.getElementById('enquiry-name')?.focus({ preventScroll: false })
              }}
            >
              Choose {c.name}
            </button>
          </li>
        ))}
      </ul>

      <div className="wrap grid enquiry">
        <div className="enquiry__intro">
          <h3 className="display h-md">
            Come train once.
          </h3>
          <p className="body-copy">
            Tell us which club and when you usually train. We’ll book your first session with a trainer.
          </p>
        </div>
        {sent ? (
          <div className="enquiry__done" role="status">
            <p className="display h-sm">Thanks, {sent}.</p>
            <p className="body-copy">We’ll be in touch to book your first session.</p>
            <button className="text-link" onClick={() => setSent(null)}>
              Send another request
            </button>
          </div>
        ) : (
          <form className="enquiry__form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="enquiry-name" className="meta">Name</label>
              <input id="enquiry-name" name="name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="enquiry-email" className="meta">Email</label>
              <input id="enquiry-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="enquiry-club" className="meta">Club</label>
              <select id="enquiry-club" name="club" value={club} onChange={(e) => setClub(e.target.value)}>
                {CLUBS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="enquiry-time" className="meta">Usually train</label>
              <select id="enquiry-time" name="time" defaultValue="early">
                <option value="early">Early morning</option>
                <option value="day">Daytime</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            {error && (
              <p className="enquiry__error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn--solid enquiry__submit">
              Request my session
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
