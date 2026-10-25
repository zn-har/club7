import { CanvasTexture, LinearSRGBColorSpace, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Procedural maps for surfaces where no CC0 scan exists.
 * Generated once on the CPU, cached as module singletons.
 */

function heightToNormal(size: number, height: (x: number, y: number) => number, strength: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const h = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = height(x / size, y / size)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.colorSpace = LinearSRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// Hash noise for micro surface detail
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function valueNoise(x: number, y: number, period: number) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const p = (a: number, b: number) => hash(((a % period) + period) % period, ((b % period) + period) % period)
  return (p(xi, yi) * (1 - u) + p(xi + 1, yi) * u) * (1 - v) + (p(xi, yi + 1) * (1 - u) + p(xi + 1, yi + 1) * u) * v
}

let knurl: CanvasTexture | null = null
/** Diamond (aggressive Olympic) knurl: two crossed helical grooves. */
export function getKnurlNormal() {
  if (knurl) return knurl
  const tri = (t: number) => Math.abs((t - Math.floor(t)) * 2 - 1)
  knurl = heightToNormal(
    256,
    (x, y) => {
      const n = 16
      const a = tri((x + y) * n)
      const b = tri((x - y) * n)
      return Math.min(a, b) + valueNoise(x * 64, y * 64, 64) * 0.08
    },
    3.2,
  )
  return knurl
}

let rubber: CanvasTexture | null = null
/** Fine vulcanised-rubber grain for bumper plates. */
export function getRubberNormal() {
  if (rubber) return rubber
  rubber = heightToNormal(
    512,
    (x, y) => valueNoise(x * 128, y * 128, 128) * 0.6 + valueNoise(x * 32, y * 32, 32) * 0.4,
    1.4,
  )
  return rubber
}

const decals = new Map<string, CanvasTexture>()
/**
 * Printed face of a bumper plate: ring text + weight, like a competition plate.
 * Drawn for a RingGeometry whose UVs are planar over the outer diameter.
 */
export function getPlateDecal(weight: string) {
  const cached = decals.get(weight)
  if (cached) return cached
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(214, 208, 198, 0.86)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // circumferential legend
  const legend = 'KAIROS ATHLETIC CLUB  ·  CALIBRATED TRAINING BUMPER  ·  ±10 G  ·  '
  ctx.font = '600 25px "Archivo Variable", Arial Narrow, sans-serif'
  const radius = 0.43 * size
  const chars = [...legend]
  const step = (Math.PI * 1.06) / chars.length
  ctx.save()
  ctx.translate(c, c)
  ctx.rotate(-Math.PI * 0.53 - Math.PI / 2)
  for (const ch of chars) {
    ctx.save()
    ctx.translate(0, -radius)
    ctx.fillText(ch, 0, 0)
    ctx.restore()
    ctx.rotate(step)
  }
  ctx.restore()

  // weight, top and bottom
  ctx.font = '800 112px "Archivo Variable", Arial Narrow, sans-serif'
  for (const [y, r] of [[c + 0.3 * size, 0], [c - 0.3 * size, Math.PI]] as const) {
    ctx.save()
    ctx.translate(c, y)
    ctx.rotate(r)
    ctx.fillText(weight, -34, 0)
    ctx.font = '700 40px "Archivo Variable", Arial Narrow, sans-serif'
    ctx.fillText('KG', 66, 18)
    ctx.font = '800 112px "Archivo Variable", Arial Narrow, sans-serif'
    ctx.restore()
  }

  // wear: knock back the print with noise so it does not look freshly printed
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    // most of the face is bare: skip the noise where there's no ink
    if (img.data[i + 3] === 0) continue
    const x = (i / 4) % size, y = Math.floor(i / 4 / size)
    const wear = valueNoise(x / 6, y / 6, 4096) * 0.55 + valueNoise(x / 40, y / 40, 4096) * 0.45
    img.data[i + 3] *= Math.min(1, Math.max(0, (wear - 0.18) * 1.7))
  }
  ctx.putImageData(img, 0, 0)

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  decals.set(weight, tex)
  return tex
}
