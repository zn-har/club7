import { prefersReducedMotion } from '../lib/env'
import { SHOTS, stage, type Shot, type ShotName } from '../scene/state'
import { gsap, ScrollTrigger } from './scroll'

/**
 * Central timeline. Every section's motion is registered here, in page order,
 * so the whole film can be read top to bottom. Timings mirror DIRECTION.md §5.
 */

const RM = prefersReducedMotion

let intro: gsap.core.Timeline | null = null

/** 0 — Lights on. Called once the loader has lifted. */
export function playIntro() {
  const tl = gsap.timeline()
  intro = tl
  const { key, ...rest } = SHOTS.hero
  if (RM || window.scrollY > 40) {
    // at the top the hero shot is the frame; further down the scrubbed moves already set it
    if (window.scrollY <= 40) Object.assign(stage.cam, SHOTS.hero)
    else ScrollTrigger.update()
    tl.to('[data-intro]', { opacity: 1, duration: 0.4, stagger: 0.05 })
    tl.set('.hero .line-mask > span', { yPercent: 0 }, 0)
    return tl
  }

  // key light strikes: one restrained flicker, like a high-bay ballast catching
  tl.to(stage.cam, { key: 0.35, duration: 0.08, ease: 'none' }, 0.2)
    .to(stage.cam, { key: 0.08, duration: 0.12, ease: 'none' })
    .to(stage.cam, { key, duration: 1.6, ease: 'power2.out' })
    .to(stage.cam, { fill: rest.fill, rim: rest.rim, duration: 2.2, ease: 'power2.out' }, 0.7)
    .to(stage.cam, { wall: rest.wall, duration: 2.6, ease: 'power1.inOut' }, 1.1)
    // slider dolly + focus rack
    .to(stage.cam, { px: rest.px, py: rest.py, pz: rest.pz, tx: rest.tx, ty: rest.ty, tz: rest.tz, duration: 4.2, ease: 'power3.out' }, 0.1)
    .to(stage.cam, { blur: rest.blur, duration: 2.8, ease: 'power2.inOut' }, 0.9)
    // type
    .to('.hero .line-mask > span', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12 }, 1.3)
    .to('[data-intro]', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, 1.8)
  return tl
}

/** 'program' is the station picked in the programs tabs, so it is a live shot rather than a fixed one. */
type ShotRef = ShotName | 'program'
type Move = { from: ShotRef; to: ShotRef; trigger: string | Element; start: string; end: string; endTrigger?: string }

const programShot: Shot = { ...SHOTS.strength }
const resolve = (s: ShotRef): Shot => (s === 'program' ? programShot : SHOTS[s])
const CHANNELS = Object.keys(SHOTS.hero) as (keyof Shot)[]
function blend(a: Shot, b: Shot, t: number) {
  for (const k of CHANNELS) stage.cam[k] = a[k] + (b[k] - a[k]) * t
}

/** Re-applies whichever move currently owns the frame, if it involves the live program shot. */
let refreshProgram = () => {}
let programTween: gsap.core.Tween | null = null

/** Programs tab picked: the camera crosses the floor to that station. */
export function pickProgram(name: ShotName) {
  programTween?.kill()
  programTween = gsap.to(programShot, {
    ...SHOTS[name],
    duration: RM ? 0 : 1.8,
    ease: 'power2.inOut',
    onUpdate: () => refreshProgram(),
    onComplete: () => refreshProgram(),
  })
}

/**
 * The take. Every camera/light move is laid onto ONE timeline whose time is measured in
 * scroll pixels, then a single trigger eases the playhead towards the scroll position.
 * One writer means fast scrolls and anchor jumps can never race two moves against each other.
 */
function buildTake(moves: Move[]) {
  const markers = moves.map((m) => ScrollTrigger.create({ trigger: m.trigger, start: m.start, end: m.end, endTrigger: m.endTrigger }))
  let take: gsap.core.Timeline | null = null
  let playhead: gsap.core.Tween | null = null
  // each move tweens a 0..1 mix and blends its two shots, so a live shot is read every frame
  const mixes = moves.map(() => ({ v: 0 }))
  const starts: number[] = []

  const build = () => {
    const time = take?.time() ?? 0
    take?.kill()
    take = gsap.timeline({ paused: true })
    moves.forEach((m, i) => {
      const { start, end } = markers[i]
      const mix = mixes[i]
      const write = () => blend(resolve(m.from), resolve(m.to), mix.v)
      // reduced motion: a clean cut halfway through the move
      starts[i] = RM ? (start + end) / 2 : start
      take!.fromTo(
        mix,
        { v: 0 },
        { v: 1, ease: RM ? 'steps(1)' : 'sine.inOut', duration: RM ? 1 : Math.max(1, end - start), immediateRender: false, onUpdate: write },
        starts[i],
      )
    })
    take.set({}, {}, ScrollTrigger.maxScroll(window) + 1)
    take.time(time)
  }

  build()
  ScrollTrigger.addEventListener('refresh', build)
  refreshProgram = () => {
    if (!take) return
    // the latest move to have started owns the frame
    const t = take.time()
    let owner = -1
    starts.forEach((s, i) => {
      if (s <= t) owner = i
    })
    const m = moves[owner]
    if (m && (m.from === 'program' || m.to === 'program')) blend(resolve(m.from), resolve(m.to), mixes[owner].v)
  }
  const driver = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (!take) return
      // the intro owns the camera until the visitor first scrolls
      if (self.scroll() < 2 && intro?.isActive()) return
      if (RM) {
        take.time(self.scroll())
        return
      }
      playhead?.kill()
      playhead = gsap.to(take, { time: self.scroll(), duration: 1.1, ease: 'power3.out' })
    },
  })
  return () => {
    ScrollTrigger.removeEventListener('refresh', build)
    refreshProgram = () => {}
    driver.kill()
    markers.forEach((m) => m.kill())
    playhead?.kill()
    take?.kill()
  }
}

/**
 * The sand veil: Club 7's own wall colour rises over the set as the visitor walks into the
 * clubs, and lifts again for the finale. One trigger computes it from both ranges so the two
 * fades can never fight; the canvas stops drawing while it's fully up (scene/Stage.tsx).
 */
function buildVeil() {
  const el = document.querySelector<HTMLElement>('.veil')
  if (!el) return () => {}
  const rise = ScrollTrigger.create({ trigger: '.clubs', start: 'top 72%', end: 'top 18%' })
  const fall = ScrollTrigger.create({ trigger: '.finale', start: 'top 62%', end: 'top 4%' })
  const ramp = (y: number, t: ScrollTrigger) => Math.min(1, Math.max(0, (y - t.start) / Math.max(1, t.end - t.start)))
  const apply = (y: number) => {
    let v = ramp(y, rise) * (1 - ramp(y, fall))
    if (RM) v = Math.round(v)
    stage.veil = v
    el.style.opacity = String(v)
    el.style.visibility = v < 0.001 ? 'hidden' : 'visible'
    // the nav follows the ground it sits on
    document.documentElement.classList.toggle('veil-up', v > 0.5)
  }
  const driver = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => apply(self.scroll()), onRefresh: (self) => apply(self.scroll()) })
  apply(window.scrollY)
  return () => {
    rise.kill()
    fall.kill()
    driver.kill()
  }
}

/** Registers every scroll-driven event. Returns a cleanup. */
export function initChoreography() {
  let killTake = () => {}
  let killVeil = () => {}
  const ctx = gsap.context(() => {
    // initial states for the intro (set here so no-JS / fallback stays visible)
    gsap.set('.hero .line-mask > span', { yPercent: 108 })
    gsap.set('[data-intro]', { opacity: 0, y: RM ? 0 : 16 })

    // if the visitor scrolls before the intro finishes, scroll owns the camera from then on
    ScrollTrigger.create({
      start: 40,
      onEnter: () => {
        if (!intro || !intro.isActive()) return
        intro.kill()
        gsap.to('.hero .line-mask > span', { yPercent: 0, duration: 0.6, ease: 'expo.out' })
        gsap.to('[data-intro]', { opacity: 1, y: 0, duration: 0.6 })
        ScrollTrigger.update()
      },
    })

    /* ---- The take: one camera, one light, three moves ---- */
    // Every move reveals something: the knurl, then the kit for each programme, then the bar
    // again lit for the sign-off. Between programmes and finale the set rests under the veil.
    killTake = buildTake([
      // hero holds for the first fifth of a screen, then slides along the bar into the knurl
      { from: 'hero', to: 'macro', trigger: '.hero', start: 'top -22%', endTrigger: '.philosophy', end: 'top 15%' },
      // programmes: down to whichever station's tab is picked
      { from: 'macro', to: 'program', trigger: '.programs', start: 'top bottom', end: 'top 25%' },
      // hidden under the veil: reset to the finale bookend so it is already composed when revealed
      { from: 'program', to: 'finale', trigger: '.membership', start: 'top bottom', end: 'bottom bottom' },
    ])
    killVeil = buildVeil()

    /* 1  Hero type drifts up and away */
    gsap.to('.hero__inner', {
      yPercent: RM ? 0 : -18,
      opacity: 0,
      ease: 'none',
      // holds while the frame holds, leaves as the camera starts to move
      scrollTrigger: { trigger: '.hero', start: RM ? '30% top' : 'top -12%', end: 'bottom 25%', scrub: true },
    })

    /* 2  Philosophy statement: words come up as they are read */
    document.querySelectorAll<HTMLElement>('[data-words]').forEach((el) => {
      const words = splitWords(el)
      if (RM) return
      gsap.fromTo(
        words,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 38%', scrub: true },
        },
      )
    })

    /* Generic: masked line reveals */
    gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
      const lines = el.querySelectorAll('.line-mask > span')
      gsap.from(lines, {
        yPercent: RM ? 0 : 108,
        opacity: RM ? 0 : 1,
        duration: RM ? 0.4 : 1.25,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' },
      })
    })

    /* Generic: soft rise */
    gsap.utils.toArray<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
      gsap.from(el, {
        y: RM ? 0 : 24,
        opacity: 0,
        duration: RM ? 0.4 : 1,
        ease: 'power3.out',
        delay: Number(el.dataset.delay ?? 0),
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      })
    })

    /* Generic: photograph mask reveal + settle */
    gsap.utils.toArray<HTMLElement>('[data-reveal="photo"]').forEach((el) => {
      const img = el.querySelector('img')
      if (RM) {
        gsap.from(el, { opacity: 0, duration: 0.4, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } })
        return
      }
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' } })
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
      if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.2)
    })

    /* Generic: slow parallax inside the frame */
    if (!RM) {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const amount = Number(el.dataset.parallax || 8)
        const img = el.querySelector('img')
        if (!img) return
        gsap.set(img, { height: `${100 + amount * 2}%`, top: `-${amount}%`, position: 'absolute', left: 0 })
        gsap.fromTo(
          img,
          { yPercent: -amount / 2 },
          { yPercent: amount / 2, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      })
    }

  })

  return () => {
    killTake()
    killVeil()
    ctx.revert()
  }
}

/** Wrap each word in a span; the text stays in the accessibility tree untouched. */
function splitWords(el: HTMLElement) {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>('.w'))
  el.dataset.split = '1'
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment()
        child.textContent!.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) frag.append(part)
          else {
            const s = document.createElement('span')
            s.className = 'w'
            s.textContent = part
            frag.append(s)
          }
        })
        child.replaceWith(frag)
      } else if (child.nodeType === Node.ELEMENT_NODE) walk(child)
    })
  }
  walk(el)
  return Array.from(el.querySelectorAll<HTMLElement>('.w'))
}
