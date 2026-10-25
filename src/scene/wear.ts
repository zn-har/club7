import { CanvasTexture, ClampToEdgeWrapping, LinearSRGBColorSpace, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Wear-and-tear maps: the chips, chalk, worn varnish and scuffs that make kit look used.
 * Generated once on the CPU over a few million texels, so this uses a table-driven
 * lattice noise rather than the sin hash in textures.ts.
 */

const TABLE = 256
const table = (() => {
  const t = new Float32Array(TABLE * TABLE)
  let s = 0x2f6b9e1d
  for (let i = 0; i < t.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    t[i] = s / 4294967296
  }
  return t
})()

/** Lattice noise that wraps every `period` cells (a power of two ≤ 256). */
function noise(x: number, y: number, period = TABLE) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const m = period - 1
  const x0 = xi & m, x1 = (xi + 1) & m, y0 = (yi & m) * TABLE, y1 = ((yi + 1) & m) * TABLE
  const a = table[y0 + x0], b = table[y0 + x1], c = table[y1 + x0], d = table[y1 + x1]
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v
}

function fbm(x: number, y: number, period: number, octaves = 4) {
  let s = 0, amp = 0.5, norm = 0
  for (let i = 0; i < octaves; i++) {
    s += amp * noise(x, y, Math.min(period, TABLE))
    norm += amp
    x *= 2; y *= 2; period *= 2; amp *= 0.5
  }
  return s / norm
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function canvasTex(w: number, h: number, data: Uint8ClampedArray<ArrayBuffer>, srgb: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.putImageData(new ImageData(data, w, h), 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Tangent-space normal map from a height field (row 0 = top of the canvas, wraps both ways). */
function normalFromHeight(w: number, h: number, height: Float32Array, strength: number) {
  const out = new Uint8ClampedArray(w * h * 4)
  const at = (x: number, y: number) => height[((y + h) % h) * w + ((x + w) % w)]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      out[i] = ((-dx / len) * 0.5 + 0.5) * 255
      out[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      out[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      out[i + 3] = 255
    }
  }
  return canvasTex(w, h, out, false)
}

/** Alpha of text drawn into a scratch canvas, for print that is then worn by noise. */
function textMask(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  draw(ctx)
  const src = ctx.getImageData(0, 0, w, h).data
  const a = new Float32Array(w * h)
  for (let i = 0; i < a.length; i++) a[i] = src[i * 4 + 3] / 255
  return a
}

export type SurfaceMaps = { map: CanvasTexture; orm: CanvasTexture; normal: CanvasTexture }

/**
 * Bakes albedo (sRGB), roughness (G) + metalness (B) in one map, and a height-derived
 * normal. `texel` returns [r, g, b (0–255 sRGB), roughness, metalness, height].
 */
function bakeSurface(w: number, h: number, normalStrength: number, texel: (x: number, y: number, i: number) => number[]): SurfaceMaps {
  const albedo = new Uint8ClampedArray(w * h * 4)
  const orm = new Uint8ClampedArray(w * h * 4)
  const height = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const [r, g, b, rough, metal, ht] = texel(x, y, i)
      albedo[i * 4] = r; albedo[i * 4 + 1] = g; albedo[i * 4 + 2] = b; albedo[i * 4 + 3] = 255
      orm[i * 4] = 255; orm[i * 4 + 1] = rough * 255; orm[i * 4 + 2] = metal * 255; orm[i * 4 + 3] = 255
      height[i] = ht
    }
  }
  return { map: canvasTex(w, h, albedo, true), orm: canvasTex(w, h, orm, false), normal: normalFromHeight(w, h, height, normalStrength) }
}

// powder coat in the club's ember (competition code orange = 28 kg), and what is under it
const PAINT = [178, 90, 52]
const STEEL = [150, 146, 140]
const RUST = [86, 50, 31]
const PRINT = [226, 219, 206]
const CHALK = [205, 201, 193]

let bellBody: SurfaceMaps | null = null
/**
 * Competition kettlebell shell, mapped u = around (0 at the front, +Z), v = height
 * (0 base → 1 crown). Chips cluster where a real bell takes knocks: the base rim that
 * meets the floor, the widest girth where bells clash, and the shoulders under the horns.
 */
export function getBellBodyMaps() {
  if (bellBody) return bellBody
  const W = 1024, H = 512
  // the shell is ~0.66 m round and 0.21 m tall: squash x so the type keeps its proportions
  const sx = (W / 0.66) / (H / 0.207)
  const label = textMask(W, H, (ctx) => {
    // weight on the front face, drawn twice so it straddles the u seam
    for (const cx of [0, W]) {
      ctx.save()
      ctx.translate(cx, H * 0.47)
      ctx.scale(sx, 1)
      ctx.font = '800 150px "Archivo Variable", Arial Narrow, sans-serif'
      ctx.fillText('28', 0, -10)
      ctx.font = '700 44px "Archivo Variable", Arial Narrow, sans-serif'
      ctx.fillText('KG', 0, 86)
      ctx.restore()
    }
    ctx.save()
    ctx.translate(W / 2, H * 0.5)
    ctx.scale(sx, 1)
    ctx.font = '700 40px "Archivo Variable", Arial Narrow, sans-serif'
    ctx.fillText('K A I R O S', 0, 0)
    ctx.restore()
  })
  bellBody = bakeSurface(W, H, 1.6, (x, y, i) => {
    const u = x / W
    const t = 1 - (y + 0.5) / H
    const zone = Math.max(1 - smooth(0, 0.1, t), Math.exp(-(((t - 0.5) / 0.06) ** 2)) * 0.55, smooth(0.7, 0.8, t) * 0.35)
    const n = fbm(u * 32, t * 10, 32, 4) * 0.8 + noise(u * 256, t * 80) * 0.2
    const th = 0.8 - zone * 0.2
    const chip = smooth(th, th + 0.015, n)
    const halo = smooth(th - 0.04, th, n) - chip
    const mottle = fbm(u * 8, t * 2.5, 8, 3)
    const peel = noise(u * 256, t * 80) * 0.6 + noise(u * 128, t * 40, 128) * 0.4
    const grime = 0.72 + 0.28 * smooth(0, 0.28, t)
    const printWear = smooth(0.24, 0.38, fbm(u * 64, t * 20, 64, 3))
    const print = label[i] * printWear * (1 - chip)
    const chalk = smooth(0.6, 0.92, t) * smooth(0.55, 0.85, fbm(u * 16, t * 5, 16, 3) + noise(u * 256, t * 80) * 0.15) * 0.5
    // rub marks run round the girth: paint dulled and greyed, not through to steel
    const rub = smooth(0.58, 0.72, fbm(u * 16, t * 70, 16, 3)) * (0.25 + zone) * (1 - chip)

    const c = [0, 1, 2].map((k) => {
      let v = PAINT[k] * (0.93 + 0.12 * mottle) * grime
      v = mix(v, PRINT[k] * grime, print)
      v = mix(v, (v + 128) * 0.55, rub * 0.6)
      v = mix(v, RUST[k], halo * 0.7)
      v = mix(v, STEEL[k] * (0.85 + 0.3 * noise(u * 200, t * 60)), chip)
      return mix(v, CHALK[k], chalk)
    })
    const rough = mix(mix(mix(mix(0.36 + peel * 0.1 - zone * 0.08, 0.52, print), 0.6, rub), 0.3, chip), 0.95, chalk)
    const metal = chip + halo * 0.15
    const height = (1 - chip) * (1 + peel * 0.08) + print * 0.04
    return [...c, rough, metal, height]
  })
  return bellBody
}

let bellHandle: SurfaceMaps | null = null
/**
 * Handle tube, mapped u = along the loop, v = around the bar. The grip is worn to bright
 * steel by hands and chalk packs into what is left; the horns keep their paint.
 */
export function getBellHandleMaps() {
  if (bellHandle) return bellHandle
  const W = 512, H = 128
  bellHandle = bakeSurface(W, H, 1.4, (x, y) => {
    const s = x / W
    const a = y / H
    const edge = fbm(s * 48, a * 16, 16, 3)
    const keep = smooth(0.12, 0.3, Math.abs(s - 0.5) + (edge - 0.5) * 0.14)
    const n = fbm(s * 64, a * 16, 16, 4)
    const chip = smooth(0.77, 0.785, n) * keep
    const bare = 1 - keep * (1 - chip)
    const chalk = (1 - keep) * smooth(0.4, 0.7, fbm(s * 96, a * 24, 32, 3)) * 0.85
    const streak = noise(s * 6, a * 128, 128)
    const c = [0, 1, 2].map((k) => {
      const paint = PAINT[k] * (0.9 + 0.1 * edge)
      const steel = STEEL[k] * (0.92 + 0.18 * streak)
      return mix(mix(paint, steel, bare), CHALK[k], chalk)
    })
    const rough = mix(mix(0.38, 0.34 + streak * 0.12, bare), 0.9, chalk)
    const height = keep * (1 - chip)
    return [...c, rough, bare, height]
  })
  return bellHandle
}

let wood: SurfaceMaps | null = null
/**
 * Oak centre of an Olympic lifting platform: one 1.22 × 2.44 m plywood sheet laid in
 * veneer flitches running front to back. Varnish is worn grey where lifters stand, chalk
 * is ground into the grain, and the club mark is painted across the front.
 * Mapped x = across the sheet, canvas row 0 = back edge (-Z).
 */
export function getPlatformWoodMaps() {
  if (wood) return wood
  const W = 512, H = 1024
  // flitch boundaries across the sheet (fractions of width)
  const cuts = [0]
  for (let k = 1; cuts[cuts.length - 1] < 1; k++) cuts.push(Math.min(1, cuts[cuts.length - 1] + 0.09 + table[k * 7] * 0.09))
  const mark = textMask(W, H, (ctx) => {
    ctx.translate(W / 2, H * 0.84)
    ctx.font = '800 96px "Archivo Variable", Arial Narrow, sans-serif'
    ctx.fillText('KAIROS', 0, 0)
  })
  wood = bakeSurface(W, H, 2.2, (x, y, i) => {
    const fx = x / W, fy = y / H
    let f = 0
    while (cuts[f + 1] <= fx) f++
    const seed = table[f * 131 + 17]
    // grain: slow wobbling lines along the length, figure varies per flitch
    const wob = fbm(fx * 6 + seed * 9, fy * 3, 64, 3)
    const ring = Math.sin((fx * (90 + seed * 70) + wob * 6 + seed * 20) * Math.PI)
    const grain = Math.pow(Math.abs(ring), 0.35)
    const pores = noise(fx * 240, fy * 30) // open oak pores, elongated along the grain
    const tone = 0.86 + seed * 0.2 + (fbm(fx * 3, fy * 6, 64, 2) - 0.5) * 0.15
    const seam = 1 - smooth(0, 0.0035, Math.min(fx - cuts[f], cuts[f + 1] - fx))
    // where feet land: the middle of the sheet, under the bar
    const dx = (fx - 0.5) / 0.32, dy = (fy - 0.5) / 0.2
    const stance = Math.exp(-(dx * dx + dy * dy))
    const worn = Math.min(1, stance * (0.7 + 0.6 * fbm(fx * 20, fy * 40, 64, 3)))
    const chalk = Math.min(1, smooth(0.5, 0.85, fbm(fx * 14, fy * 28, 32, 4) + stance * 0.35) * (0.25 + stance * 0.9))
    const scuff = smooth(0.78, 0.86, fbm(fx * 9 + 3, fy * 60, 64, 3)) * (0.3 + stance)
    const paintWear = smooth(0.3, 0.46, fbm(fx * 40, fy * 80, 64, 3))
    const paint = mark[i] * paintWear

    const oak = [158, 116, 72].map((v, k) => v * tone * (0.78 + 0.22 * grain) * (0.9 + 0.1 * pores) * (1 - seam * 0.5) * (k === 2 ? 0.95 : 1))
    const c = [0, 1, 2].map((k) => {
      let v = mix(oak[k], oak[k] * 0.82 + 22, worn * 0.55) // varnish worn through: drier, greyer
      v = mix(v, PAINT[k] * 0.92, paint)
      v *= 1 - scuff * 0.35
      return mix(v, CHALK[k], chalk * 0.75)
    })
    const rough = mix(mix(mix(0.42 + (1 - grain) * 0.12, 0.78, worn), 0.55, paint), 0.95, chalk)
    const height = grain * 0.3 + pores * 0.15 - seam * 0.6 + paint * 0.15
    return [...c, rough, 0, height]
  })
  for (const t of [wood.map, wood.orm, wood.normal]) t.wrapS = t.wrapT = ClampToEdgeWrapping
  return wood
}

/** Size of the floor overlay (metres, centred on the bar). */
export const FLOOR_OVERLAY_SIZE = 12

type XZ = { x: number; z: number }
let overlay: CanvasTexture | null = null
/**
 * Where things have happened on the floor, as masks for the floor shader (which adds the
 * breakup): R chalk, G painted ember line, B rubber scuffs. Canvas y runs toward -Z.
 */
export function getFloorOverlay(stations: { bells: XZ; dumbbells: XZ; stacks: XZ }) {
  if (overlay) return overlay
  const S = 2048
  const k = S / FLOOR_OVERLAY_SIZE
  const P = (x: number, z: number): [number, number] => [(x / FLOOR_OVERLAY_SIZE + 0.5) * S, (0.5 - z / FLOOR_OVERLAY_SIZE) * S]
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, S, S)
  ctx.globalCompositeOperation = 'lighter'
  let seed = 3
  const r = () => table[(seed += 37) % table.length]

  const blot = (at: XZ, radius: number, color: string, count: number, blur: number) => {
    ctx.filter = `blur(${blur}px)`
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radius
      const [cx, cy] = P(at.x + Math.cos(a) * d, at.z + Math.sin(a) * d)
      ctx.beginPath()
      ctx.ellipse(cx, cy, (0.02 + r() * 0.07) * k, (0.015 + r() * 0.04) * k, r() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const { bells, dumbbells, stacks } = stations

  // chalk: tracked off the platform front and sides, and around the bells
  blot({ x: 0, z: 1.5 }, 0.45, 'rgba(255,0,0,0.22)', 60, 6)
  blot({ x: 0.2, z: -1.45 }, 0.35, 'rgba(255,0,0,0.14)', 30, 6)
  blot({ x: 1.5, z: 0.2 }, 0.3, 'rgba(255,0,0,0.12)', 20, 6)
  blot({ x: bells.x + 0.1, z: bells.z + 0.1 }, 0.55, 'rgba(255,0,0,0.25)', 70, 5)
  blot({ x: dumbbells.x, z: dumbbells.z + 0.2 }, 0.4, 'rgba(255,0,0,0.12)', 25, 6)
  // chalky shoe prints walking from the platform over to the bells
  ctx.filter = 'blur(2px)'
  ctx.fillStyle = 'rgba(255,0,0,0.3)'
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const [cx, cy] = P(mix(-0.6, bells.x + 0.6, t) + (i % 2 ? 0.09 : -0.09), mix(1.5, bells.z - 0.2, t))
    ctx.beginPath()
    ctx.ellipse(cx, cy, 0.12 * k, 0.045 * k, -0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  // scuffs: plates dragged off the stacks, dumbbells rolled, bells set down
  ctx.filter = 'blur(3px)'
  ctx.lineCap = 'round'
  const arc = (x: number, z: number, radius: number, a0: number, a1: number, width: number, alpha: number) => {
    const [cx, cy] = P(x, z)
    ctx.strokeStyle = `rgba(0,0,255,${alpha})`
    ctx.lineWidth = width * k
    ctx.beginPath()
    ctx.arc(cx, cy, radius * k, a0, a1)
    ctx.stroke()
  }
  for (let i = 0; i < 9; i++) arc(stacks.x + (r() - 0.5) * 1.6, stacks.z + (r() - 0.3) * 1.2, 0.3 + r() * 0.8, r() * 6, r() * 6 + 0.6, 0.05 + r() * 0.12, 0.25 + r() * 0.3)
  for (let i = 0; i < 5; i++) arc(dumbbells.x + (r() - 0.5), dumbbells.z + (r() - 0.5), 0.2 + r() * 0.5, r() * 6, r() * 6 + 0.8, 0.04, 0.3)
  blot(bells, 0.5, 'rgba(0,0,255,0.25)', 30, 4)

  // painted ember lines: a conditioning box round the bells, and the sled lane edge
  ctx.filter = 'blur(0.6px)'
  ctx.strokeStyle = 'rgba(0,255,0,1)'
  ctx.lineWidth = 0.05 * k
  ctx.lineCap = 'butt'
  const [x0, y0] = P(bells.x - 0.95, bells.z + 0.8)
  const [x1, y1] = P(bells.x + 0.85, bells.z - 0.85)
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
  ctx.beginPath()
  ctx.moveTo(...P(-6, 2.95))
  ctx.lineTo(...P(6, 2.95))
  ctx.stroke()
  // stencilled zone number inside the box, reading from the open floor
  ctx.translate(...P(bells.x + 0.55, bells.z + 0.5))
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = 'rgba(0,255,0,1)'
  ctx.font = `800 ${0.34 * k}px "Archivo Variable", Arial Narrow, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('02', 0, 0)

  overlay = new CanvasTexture(canvas)
  overlay.colorSpace = LinearSRGBColorSpace
  overlay.anisotropy = 8
  return overlay
}
