import { Vector3 } from 'three'

/**
 * Mutable stage state shared between GSAP (writer) and the render loop (reader).
 * Deliberately outside React: tweens mutate it, useFrame reads it, nothing re-renders.
 *
 * The whole page is one continuous take on a single set. Scroll moves a camera on a
 * slider/jib and an overhead light on a track between equipment "stations".
 */

// Station positions on the floor (metres). The bar is the origin.
export const STATIONS = {
  bar: new Vector3(0, 0, 0),
  bells: new Vector3(-2.5, 0, 1.7),
  dumbbells: new Vector3(-2.3, 0, -1.7),
  stacks: new Vector3(2.5, 0, -1.9),
}

/** Olympic lifting platform under the bar: 8 ft square, raised 30 mm off the floor. */
export const PLATFORM_W = 2.44
export const PLATFORM_H = 0.03

/** Every numeric channel the rig reads. Shots are complete snapshots of these. */
export type Shot = {
  px: number; py: number; pz: number // camera
  tx: number; ty: number; tz: number // look-at
  lx: number; ly: number; lz: number // key light
  ltx: number; lty: number; ltz: number // key target
  fx: number; fy: number; fz: number // focus point
  key: number; fill: number; rim: number; wall: number
  warm: number // 0 neutral 4500K-ish → 1 tungsten
  blur: number // 0 deep focus → 1 macro-shallow
  fogNear: number; fogFar: number
  cone: number // key light spread, radians
  pools: number // practicals over the other stations
}

type V = [number, number, number]
const add = (a: Vector3, b: V): V => [a.x + b[0], a.y + b[1], a.z + b[2]]
/** shots on the bar sit on the platform */
const up = (p: V): V => [p[0], p[1] + PLATFORM_H, p[2]]

function shot(o: {
  pos: V; target: V; light?: V; lightTarget?: V; focus?: V
  key?: number; fill?: number; rim?: number; wall?: number; warm?: number; blur?: number; fog?: [number, number]; cone?: number; pools?: number
  /** slide the subject right in frame by this fraction of subject distance (text column lives left) */
  frame?: number
}): Shot {
  const light = o.light ?? [o.target[0] - 0.1, 3.4, o.target[2] - 0.8]
  const lt = o.lightTarget ?? [o.target[0], 0, o.target[2]]
  const f = o.focus ?? o.target
  if (o.frame) {
    // aim left of the subject: target += normalize(up × viewDir) * distance * frame
    const dir = new Vector3(o.target[0] - o.pos[0], o.target[1] - o.pos[1], o.target[2] - o.pos[2])
    const d = dir.length()
    const left = new Vector3(0, 1, 0).cross(dir).normalize().multiplyScalar(d * o.frame)
    o = { ...o, target: [o.target[0] + left.x, o.target[1] + left.y, o.target[2] + left.z] }
  }
  return {
    px: o.pos[0], py: o.pos[1], pz: o.pos[2],
    tx: o.target[0], ty: o.target[1], tz: o.target[2],
    lx: light[0], ly: light[1], lz: light[2],
    ltx: lt[0], lty: lt[1], ltz: lt[2],
    fx: f[0], fy: f[1], fz: f[2],
    key: o.key ?? 1, fill: o.fill ?? 1, rim: o.rim ?? 1, wall: o.wall ?? 1,
    warm: o.warm ?? 0.25, blur: o.blur ?? 0.25,
    fogNear: o.fog?.[0] ?? 4.5, fogFar: o.fog?.[1] ?? 15,
    cone: o.cone ?? 0.5,
    pools: o.pools ?? 0.2,
  }
}

const { bells, dumbbells, stacks } = STATIONS

export const SHOTS = {
  // black frame before the lights come on
  dark: shot({ pools: 0, pos: up([4.15, 0.44, 2.55]), target: up([0.15, 0.3, 0.25]), light: [0.1, 3.4, -0.85], lightTarget: up([0.15, 0, 0.1]), focus: up([0.78, 0.225, 0]), key: 0, fill: 0, rim: 0, wall: 0, blur: 1 }),
  // hero: low on a long lens, plate height
  hero: shot({ pos: up([3.25, 0.36, 1.95]), target: up([0.02, 0.3, 0.22]), light: [0.1, 3.4, -0.85], lightTarget: up([0.15, 0, 0.1]), focus: up([0.78, 0.225, 0]) }),
  // philosophy: macro along the sleeve into the knurl, light pulled down
  macro: shot({ pos: up([0.42, 0.2, 0.42]), target: up([0.56, 0.31, -0.08]), light: [0.9, 2.8, -0.9], lightTarget: up([0.6, 0.2, 0]), focus: up([0.6, 0.225, 0.0]), key: 0.6, fill: 0.35, rim: 1, wall: 0, blur: 1, warm: 0.35 }),
  // philosophy, later: jib up into darkness above the bar
  above: shot({ pos: up([-0.6, 2.4, 2.6]), target: up([0, 0.15, 0]), light: [0, 3.4, -0.4], focus: up([0, 0.2, 0]), key: 0.38, fill: 0.35, rim: 0.4, wall: 0.2, blur: 0.4, fog: [4.5, 15] }),
  // programs
  strength: shot({ frame: 0.12, pos: up([-1.9, 1.1, 1.55]), target: up([0.15, 0.22, -0.05]), light: [-0.3, 3.4, -0.7], focus: up([-0.75, 0.225, 0]), key: 1, warm: 0.2 }),
  conditioning: shot({ frame: 0.1, pos: add(bells, [1.45, 0.42, 0.95]), target: add(bells, [0, 0.16, 0]), light: add(bells, [-0.2, 3.3, -0.7]), lightTarget: add(bells, [0, 0, 0]), key: 1, blur: 0.4 }),
  personal: shot({ frame: 0.1, pos: add(dumbbells, [1.35, 0.5, 1.05]), target: add(dumbbells, [0, 0.08, 0]), light: add(dumbbells, [0.2, 3.3, -0.8]), lightTarget: add(dumbbells, [0, 0, 0]), key: 1, blur: 0.4 }),
  recovery: shot({ frame: 0.12, pos: add(bells, [0.62, 0.36, 0.72]), target: add(bells, [0.02, 0.22, 0]), light: add(bells, [0.6, 2.4, -0.4]), lightTarget: add(bells, [0, 0.1, 0]), focus: add(bells, [0, 0.25, 0]), key: 0.5, fill: 0.3, rim: 0.6, wall: 0.1, warm: 0.8, blur: 0.9 }),
  // the floor: high wide establishing shot of the whole set
  wide: shot({ pos: [6.4, 3.3, 5.9], target: [-0.2, 0, 0], light: [0, 4.6, 0], lightTarget: [0, 0, 0], key: 1, fill: 1, rim: 0.8, wall: 0.8, blur: 0.05, fog: [9, 22], cone: 0.7, pools: 1 }),
  // coaching: slow, low pass behind the dumbbells, set dimmed under the photographs
  coaches: shot({ pos: add(dumbbells, [-1.4, 0.55, 1.7]), target: add(dumbbells, [0.6, 0.12, 0.2]), light: add(dumbbells, [0, 3.4, -0.6]), lightTarget: add(dumbbells, [0, 0, 0]), key: 0.45, fill: 0.35, rim: 0.5, wall: 0.2, blur: 0.6 }),
  // membership: three stacks — one, two and three plates
  membership: shot({ frame: 0.0, pos: add(stacks, [0.15, 1.15, 2.85]), target: add(stacks, [0, 0.1, 0]), light: add(stacks, [0, 3.4, -0.5]), lightTarget: add(stacks, [0, 0, 0]), focus: add(stacks, [0, 0.1, 0]), key: 1, blur: 0.2 }),
  // finale: straight down on the bar
  finale: shot({ pos: up([0.0, 4.1, 0.55]), target: up([0, 0, 0]), light: [0, 3.6, -0.3], lightTarget: up([0, 0, 0]), focus: up([0, 0.2, 0]), key: 1, fill: 0.8, rim: 0.4, wall: 0, blur: 0.1 }),
} satisfies Record<string, Shot>

export type ShotName = keyof typeof SHOTS

export const stage = {
  /** live rig values, tweened between shots by scroll */
  cam: { ...SHOTS.dark } as Shot,
  /** roll of the overhead finale shot, radians */
  camRoll: 0,
  /** pointer offset -1..1 */
  pointer: { x: 0, y: 0 },
  /** set by the canvas once assets are ready */
  ready: false,
}

export type Stage = typeof stage

if (import.meta.env.DEV) {
  // art-direction hooks: tweak shots live from the console and grab full-res frames
  const w = window as unknown as Record<string, unknown>
  w.__stage = stage
  w.__shots = SHOTS
  w.__grab = async (name = 'grab') => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas')
    if (!canvas) return 'no canvas'
    await fetch(`/__grab?name=${name}`, { method: 'POST', body: canvas.toDataURL('image/png') })
    return `${canvas.width}x${canvas.height}`
  }
}
