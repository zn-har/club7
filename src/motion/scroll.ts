import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { prefersReducedMotion } from '../lib/env'

gsap.registerPlugin(ScrollTrigger)
// the mobile URL bar resizes the viewport on every direction change; refreshing then jolts the take
ScrollTrigger.config({ ignoreMobileResize: true })

let lenis: Lenis | null = null

/** Lenis keeps the fixed canvas and DOM in lockstep; skipped entirely for reduced motion. */
export function initSmoothScroll() {
  if (prefersReducedMotion || lenis) return () => {}
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, anchors: false })
  lenis.on('scroll', ScrollTrigger.update)
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__lenis = lenis
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToTarget(selector: string) {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  // move focus for keyboard and screen-reader users
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

export function lockScroll(locked: boolean) {
  if (lenis) (locked ? lenis.stop() : lenis.start())
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

export { gsap, ScrollTrigger }

if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__ST = ScrollTrigger
