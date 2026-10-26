import { useEffect, useRef } from 'react'
import { hasWebGL, prefersReducedMotion } from '../lib/env'
import { gsap, lockScroll } from '../motion/scroll'
import { stage } from '../scene/state'

const MIN_TIME = 1400

/** Resolves once frames come steadily again (the set's first heavy draws are behind us). */
function settled() {
  return new Promise<void>((resolve) => {
    let calm = 0
    let last = performance.now()
    const bail = window.setTimeout(resolve, 3000)
    const tick = (t: number) => {
      calm = t - last < 40 ? calm + 1 : 0
      last = t
      if (calm < 10) return void requestAnimationFrame(tick)
      window.clearTimeout(bail)
      resolve()
    }
    requestAnimationFrame(tick)
  })
}

/**
 * Drives the loader that index.html paints before any script runs: the C7 mark as a breathing
 * ghost. Nothing travels while the app and the set boot, since any motion would show their
 * main-thread stalls. Once the set is lit-ready and frames run steadily again, the amber mark
 * wipes in left to right in one go, like loading the bar, lifts away, and the frame wipes up
 * off the opening shot.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const done = useRef(false)

  useEffect(() => {
    const el = document.getElementById('loader')
    if (!el || done.current) return
    lockScroll(true)
    let ready = !hasWebGL || stage.ready
    const onReady = () => {
      if (ready) return
      ready = true
      run()
    }
    const run = () => {
      if (done.current) return
      done.current = true
      // performance.now() is time since navigation start
      Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, Math.max(0, MIN_TIME - performance.now())))])
        .then(settled)
        .then(() => exit(el, onDone))
    }
    window.addEventListener('stage:ready', onReady)
    // never trap the visitor behind a loader
    const bail = window.setTimeout(onReady, 6000)
    if (ready) run()
    return () => {
      window.removeEventListener('stage:ready', onReady)
      window.clearTimeout(bail)
    }
  }, [onDone])

  return null
}

async function exit(el: HTMLElement, onDone: () => void) {
  const finish = () => {
    lockScroll(false)
    el.remove()
  }
  el.setAttribute('aria-label', 'Loaded')
  if (prefersReducedMotion) {
    gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: finish })
    onDone()
    return
  }
  const wipe = el.querySelector<HTMLElement>('.loader__wipe')!
  const timing: KeyframeAnimationOptions = { duration: 1100, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
  await Promise.all([
    wipe.animate([{ transform: 'translateX(-100%)' }, { transform: 'none' }], timing).finished,
    wipe.firstElementChild!.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], timing).finished,
  ])
  gsap
    .timeline({ onComplete: finish, delay: 0.25 }) // let the full mark read
    .to(el.querySelector('.loader__mark'), { yPercent: -40, opacity: 0, duration: 0.7, ease: 'power3.in' })
    .add(onDone, 0.6)
    .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.6)
}
