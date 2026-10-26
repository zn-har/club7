import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { lockScroll, scrollToTarget } from '../motion/scroll'

const LINKS = [
  ['#programs', 'Training'],
  ['#clubs', 'The clubs'],
  ['#coaches', 'Why Club 7'],
  ['#membership', 'Visit'],
] as const

export function Nav() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const wasOpen = useRef(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - lastY
      // a few px of slack so trackpad jitter doesn't toggle it
      if (Math.abs(dy) < 6) return
      setHidden(dy > 0 && y > 80)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (open || wasOpen.current) lockScroll(open)
    wasOpen.current = open
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    // let the menu close before moving
    requestAnimationFrame(() => scrollToTarget(href))
  }

  return (
    <>
      <header className={`nav ${open ? 'is-open' : ''} ${hidden && !open ? 'is-hidden' : ''}`} data-intro>
        <a href="#top" className="nav__mark" onClick={go('#top')} aria-label="Club 7 Fitness & Gym, back to top">
          Club 7 Fitness &amp; Gym
        </a>
        <div className="nav__links">
          <nav aria-label="Primary">
            {LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={go(href)} tabIndex={open ? -1 : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <button
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span className="nav__dots" aria-hidden>
              <i /><i /><i /><i />
            </span>
          </button>
        </div>
      </header>
      {/* outside the header: its backdrop-filter would trap a fixed child inside the bar */}
      <div className={`nav__menu ${open ? 'is-open' : ''}`} id="nav-menu" aria-hidden={!open}>
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} onClick={go(href)} tabIndex={open ? undefined : -1}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#membership" className="nav__cta" onClick={go('#membership')} tabIndex={open ? undefined : -1}>
          Book a session
        </a>
      </div>
    </>
  )
}
