import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { lockScroll, scrollToTarget } from '../motion/scroll'

const LINKS = [
  ['#philosophy', 'Philosophy'],
  ['#programs', 'Training'],
  ['#floor', 'The floor'],
  ['#coaches', 'Why Club 7'],
  ['#membership', 'Join'],
] as const

export function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const wasOpen = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
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
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`} data-intro>
      <a href="#top" className="nav__mark" onClick={go('#top')} aria-label="Club 7 Fitness & Gym, back to top">
        <span className="display">Club 7</span>
        <span className="meta">Fitness &amp; Gym</span>
      </a>
      <nav aria-label="Primary" className="nav__links" id="primary-nav">
        <ul>
          {LINKS.map(([href, label], i) => (
            <li key={href}>
              <a href={href} onClick={go(href)}>
                <span className="nav__num meta" aria-hidden>
                  0{i + 1}
                </span>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a href="#membership" className="nav__cta" onClick={go('#membership')}>
        Book a session
      </a>
      <button
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <span className="nav__burger" aria-hidden />
      </button>
    </header>
  )
}
