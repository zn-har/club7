import { DefaultLoadingManager } from 'three'
import { useEffect, useRef, useState } from 'react'
import { hasWebGL, prefersReducedMotion } from '../lib/env'
import { gsap, lockScroll } from '../motion/scroll'
import { stage } from '../scene/state'

const MIN_TIME = 1400
const MARK = 'Club 7'

/**
 * Black frame, the wordmark rising letter by letter, a hairline tied to real asset loading.
 * Once the set is lit-ready the mark lifts away and the frame wipes up off the opening shot.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(!hasWebGL || stage.ready)
  const root = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  useEffect(() => {
    lockScroll(true)
    // drei's loaders all report through three's default manager
    DefaultLoadingManager.onProgress = (_url, loaded, total) => setProgress((loaded / Math.max(total, 1)) * 100)
    const onReady = () => setReady(true)
    window.addEventListener('stage:ready', onReady)
    // never trap the visitor behind a loader
    const bail = window.setTimeout(onReady, 6000)
    return () => {
      window.removeEventListener('stage:ready', onReady)
      window.clearTimeout(bail)
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    const tween = gsap.from(gsap.utils.selector(root)('.loader__char'), {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.05,
      delay: 0.2,
    })
    return () => {
      tween.revert()
    }
  }, [])

  useEffect(() => {
    if (!ready || done.current) return
    done.current = true
    // performance.now() is time since navigation start
    Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, Math.max(0, MIN_TIME - performance.now())))]).then(() => {
      const el = root.current
      const finish = () => {
        lockScroll(false)
        if (el) el.style.display = 'none'
      }
      if (prefersReducedMotion) {
        gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: finish })
        onDone()
        return
      }
      const q = gsap.utils.selector(el)
      gsap
        .timeline({ onComplete: finish, delay: 0.35 }) // let the hairline land
        .to(q('.loader__char'), { yPercent: -110, duration: 0.7, ease: 'power3.in', stagger: 0.035 })
        .to(q('.loader__bar'), { opacity: 0, duration: 0.4, ease: 'power1.in' }, 0.1)
        .add(onDone, 0.6)
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.6)
    })
  }, [ready, onDone])

  const pct = hasWebGL ? Math.round(ready ? 100 : Math.min(progress, 99)) : 100

  return (
    <div className="loader" ref={root} role="status" aria-live="polite" aria-label={`Loading ${pct}%`}>
      <div className="loader__mark display" aria-hidden>
        {[...MARK].map((c, i) => (
          <span className="loader__char" key={i}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </div>
      <div className="loader__bar" aria-hidden>
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  )
}
