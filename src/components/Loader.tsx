import { DefaultLoadingManager } from 'three'
import { useEffect, useRef, useState } from 'react'
import { hasWebGL, prefersReducedMotion } from '../lib/env'
import { gsap, lockScroll } from '../motion/scroll'
import { stage } from '../scene/state'

const MIN_TIME = 500

/** Black frame, wordmark, a hairline tied to real asset loading. Lifts once the set is lit-ready. */
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
    if (!ready || done.current) return
    done.current = true
    // performance.now() is time since navigation start
    Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, Math.max(0, MIN_TIME - performance.now())))]).then(() => {
      gsap.to(root.current, {
        opacity: 0,
        duration: prefersReducedMotion ? 0.3 : 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          lockScroll(false)
          if (root.current) root.current.style.display = 'none'
        },
      })
      onDone()
    })
  }, [ready, onDone])

  const pct = hasWebGL ? Math.round(ready ? 100 : Math.min(progress, 99)) : 100

  return (
    <div className="loader" ref={root} role="status" aria-live="polite" aria-label={`Loading ${pct}%`}>
      <div className="loader__mark display">Club 7</div>
      <div className="loader__bar" aria-hidden>
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <div className="loader__meta meta" aria-hidden>
        <span>Fitness &amp; Gym</span>
        <span>{String(pct).padStart(3, '0')}</span>
      </div>
    </div>
  )
}
