import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'
import { hasWebGL, SHOW_CARDS } from '../lib/env'
import type { View } from '../scene/Panorama'

const Panorama = lazy(() => import('../scene/Panorama'))

// yaw angles calibrated to the panorama
const ZONES = [
  { id: 'platforms', label: 'Free weights', note: 'Barbells, plates and dumbbells for every major muscle group.', yaw: 0.25, pitch: -0.12 },
  { id: 'lane', label: 'Freestyle area', note: 'Open floor for functional work and full-body sessions your trainer builds on the spot.', yaw: -1.05, pitch: -0.2 },
  { id: 'racks', label: 'Strength zone', note: 'Resistance equipment set up for safe, heavy, repeatable work.', yaw: 2.35, pitch: -0.08 },
  { id: 'cables', label: 'Cardio zone', note: 'Treadmills and ellipticals for warm-ups, conditioning and long steady sessions.', yaw: -2.55, pitch: -0.1 },
]

const SPECS = [
  ['2022', 'Opened in Sultan Bathery'],
  ['2025', 'Opened in Dubai'],
  ['2', 'Clubs'],
  ['4', 'Training zones'],
]

export function Facility() {
  const frame = useRef<HTMLDivElement>(null)
  const view = useRef<View>({ yaw: ZONES[0].yaw, pitch: ZONES[0].pitch, auto: true })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const [near, setNear] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [zone, setZone] = useState(ZONES[0].id)

  // mount the panorama a viewport ahead and keep it: remounting meant a fresh context, a 4K
  // upload and a blank frame on every return. Far away it just stops rendering.
  useEffect(() => {
    if (!hasWebGL || !frame.current) return
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting)
        if (e.isIntersecting) setMounted(true)
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(frame.current)
    return () => io.disconnect()
  }, [])

  const onReady = useCallback(() => setLoaded(true), [])

  const go = (id: string) => {
    const z = ZONES.find((z) => z.id === id)!
    const v = view.current
    // shortest way round
    const delta = Math.atan2(Math.sin(z.yaw - v.yaw), Math.cos(z.yaw - v.yaw))
    v.yaw += delta
    v.pitch = z.pitch
    v.auto = false
    setZone(id)
  }

  const onDown = (e: PointerEvent) => {
    dragging.current = true
    view.current.auto = false
    last.current = { x: e.clientX, y: e.clientY }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!dragging.current) return
    const v = view.current
    v.yaw -= (e.clientX - last.current.x) * 0.0032
    v.pitch = Math.max(-0.7, Math.min(0.5, v.pitch + (e.clientY - last.current.y) * 0.0026))
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = () => (dragging.current = false)

  const active = ZONES.find((z) => z.id === zone)!

  return (
    <section className="section facility" id="floor" aria-labelledby="floor-title">
      <div className="wrap grid facility__head">
        <Lines id="floor-title" className="h-lg facility__title" lines={['Built to', 'be used.']} />
        <p className="lede facility__lede" data-reveal="fade">
          Free weights, resistance machines, treadmills, ellipticals, and open freestyle space for sessions that
          don’t fit on a machine.
        </p>
      </div>

      <div className="wrap">
        <div
          className={`facility__frame ${loaded ? 'is-loaded' : ''}`}
          ref={frame}
          data-reveal="photo"
          onPointerDown={hasWebGL ? onDown : undefined}
          onPointerMove={hasWebGL ? onMove : undefined}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <Photo name="floor-dark" alt="A training floor at night, rows of machines under a strip light" className="facility__still" reveal={false} />
          {mounted && (
            <Suspense fallback={null}>
              <div className="facility__canvas">
                <Panorama view={view} dragging={dragging} onReady={onReady} active={near} />
              </div>
            </Suspense>
          )}
          {hasWebGL && (
            <p className="facility__hint meta" aria-hidden>
              Drag to look around
            </p>
          )}
        </div>

        <div className="facility__zones">
          <div className="facility__tabs" role="group" aria-label="Training zones">
            {ZONES.map((z) => (
              <button key={z.id} className={zone === z.id ? 'is-active' : ''} aria-pressed={zone === z.id} onClick={() => go(z.id)}>
                <span>{z.label}</span>
              </button>
            ))}
          </div>
          <p className="facility__note body-copy" aria-live="polite">
            {active.note}
          </p>
        </div>

        <dl className="facility__specs">
          {SPECS.map(([v, k], i) => (
            <div key={k} data-reveal="fade" data-delay={i * 0.08}>
              <dd className="display">{v}</dd>
              <dt className="meta">{k}</dt>
            </div>
          ))}
        </dl>
      </div>

      {SHOW_CARDS && <div className="wrap grid facility__details">
        <figure className="facility__d1">
          <Photo name="dumbbells" alt="A long rack of round dumbbells receding into shadow" parallax={6} />
          <figcaption className="caption meta"><span>Free weights for every major muscle group</span></figcaption>
        </figure>
        <figure className="facility__d2">
          <Photo name="kettlebells" alt="Rows of black competition kettlebells on a rubber floor" parallax={6} />
          <figcaption className="caption meta"><span>Freestyle area</span></figcaption>
        </figure>
        <figure className="facility__d3">
          <Photo name="sauna" alt="Lockers and showers" warm parallax={6} />
          <figcaption className="caption meta"><span>Lockers, showers and hydration zone</span>{/* [NEED: locker photo] */}</figcaption>
        </figure>
      </div>}
    </section>
  )
}
