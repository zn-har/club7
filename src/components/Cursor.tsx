import { useEffect, useRef } from 'react'
import { pointerFx } from '../lib/env'

// what the ring reacts to; anything else is plain ground
const HOVER = 'a, button, label, select, [role="tab"], [data-cursor]'
const TEXT = 'input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable="true"]'

/**
 * The club's cursor: a brass dot that is exactly where the mouse is, and a plate-edge ring
 * that follows a beat behind, stretching along the way it travels. Over links and buttons the
 * ring swells, tints brass and leans toward the control's centre; over the programme names
 * (data-cursor="spot") it gets out of the way of the spotlight; in text fields the native caret
 * comes back. Mouse only: touch and reduced motion keep the system cursor.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!pointerFx || !el) return
    document.documentElement.classList.add('has-cursor')

    const m = { x: -100, y: -100 } // the mouse
    const r = { x: -100, y: -100 } // the ring, eased
    let target: HTMLElement | null = null
    let seen = false
    let raf = 0
    let last = performance.now()

    const setState = (t: HTMLElement | null) => {
      const text = !!t?.closest(TEXT)
      const hot = text ? null : (t?.closest<HTMLElement>(HOVER) ?? null)
      target = hot
      el.classList.toggle('is-text', text)
      el.classList.toggle('is-spot', hot?.dataset.cursor === 'spot')
      el.classList.toggle('is-hover', !!hot && hot.dataset.cursor !== 'spot')
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      m.x = e.clientX
      m.y = e.clientY
      if (!seen) {
        // first sight: start on the mouse rather than sweeping in from a corner
        r.x = m.x
        r.y = m.y
        seen = true
      }
      el.classList.remove('is-away')
      setState(e.target as HTMLElement)
    }
    const onDown = () => el.classList.add('is-down')
    const onUp = () => el.classList.remove('is-down')
    const onLeave = () => el.classList.add('is-away')

    const tick = (now: number) => {
      // ease by elapsed time, not per frame, so it feels the same at 30, 60 or 120 fps
      const k = 1 - Math.pow(1 - 0.18, Math.min(now - last, 100) / 16.67)
      last = now
      // magnetic: over a control the ring settles part-way toward its centre
      let tx = m.x
      let ty = m.y
      if (target && target.dataset.cursor !== 'spot') {
        const b = target.getBoundingClientRect()
        if (b.width < 320 && b.height < 120) {
          tx += (b.left + b.width / 2 - m.x) * 0.3
          ty += (b.top + b.height / 2 - m.y) * 0.3
        }
      }
      const dx = tx - r.x
      const dy = ty - r.y
      r.x += dx * k
      r.y += dy * k
      // liquid: stretch along the line of travel, more the faster it goes
      const speed = Math.min(Math.hypot(dx, dy) / 90, 0.45)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      ring.current!.style.transform = `translate3d(${r.x}px, ${r.y}px, 0) rotate(${angle}deg) scale(${1 + speed}, ${1 - speed * 0.6})`
      dot.current!.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  if (!pointerFx) return null
  return (
    <div ref={root} className="cursor is-away" aria-hidden="true">
      <div ref={ring} className="cursor__ring">
        <span className="cursor__plate" />
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
