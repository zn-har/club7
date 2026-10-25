import type { ThreeElements } from '@react-three/fiber'
import { CatmullRomCurve3, CylinderGeometry, LatheGeometry, MeshPhysicalMaterial, SplineCurve, TubeGeometry, Vector2, Vector3 } from 'three'
import { PLATE_T, PlateFlat, sharedMaterials } from './Barbell'
import { getBellBodyMaps, getBellHandleMaps } from './wear'

const v = (r: number, y: number) => new Vector2(r, y)

/* ---------------------------------------------------------------
   Competition kettlebell, 28 kg: steel shell, the same Ø210 mm × 280 mm at every weight,
   colour-coded by weight (28 kg = orange), Ø35 mm handle with straight horns.
   --------------------------------------------------------------- */
const KB_H = 0.207
let kb: ReturnType<typeof makeKettlebell> | null = null
function makeKettlebell() {
  // flat chamfered base, then a smooth spline for the bell (sampled densely so the
  // silhouette never shows facets)
  const bell = new SplineCurve([
    v(0.072, 0.008),
    v(0.09, 0.03),
    v(0.102, 0.065),
    v(0.105, 0.1),
    v(0.1, 0.14),
    v(0.086, 0.172),
    v(0.062, 0.194),
    v(0.03, 0.205),
    v(0.0001, KB_H),
  ]).getPoints(64)
  const body = new LatheGeometry([v(0.0001, 0), v(0.062, 0), v(0.068, 0.002), ...bell], 128)
  // map v to true height so the paint map can place wear by where the bell takes knocks
  const pos = body.attributes.position
  const uv = body.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) / KB_H)

  // window handle: straight horns, tight corners, flat top bar
  const path = new CatmullRomCurve3(
    [
      new Vector3(-0.07, 0.16, 0),
      new Vector3(-0.082, 0.19, 0),
      new Vector3(-0.085, 0.226, 0),
      new Vector3(-0.081, 0.256, 0),
      new Vector3(-0.066, 0.278, 0),
      new Vector3(-0.036, 0.287, 0),
      new Vector3(0, 0.2885, 0),
      new Vector3(0.036, 0.287, 0),
      new Vector3(0.066, 0.278, 0),
      new Vector3(0.081, 0.256, 0),
      new Vector3(0.085, 0.226, 0),
      new Vector3(0.082, 0.19, 0),
      new Vector3(0.07, 0.16, 0),
    ],
    false,
    'centripetal',
  )
  const handle = new TubeGeometry(path, 160, 0.0175, 32, false)
  // weld fillet where each horn meets the shell
  const fillet = new CylinderGeometry(0.0185, 0.027, 0.022, 32, 1, true)

  const b = getBellBodyMaps()
  const h = getBellHandleMaps()
  // powder-coated steel; roughness (G) and metalness (B) share one map, so chips read as bare steel
  const coat = new MeshPhysicalMaterial({
    map: b.map,
    roughnessMap: b.orm,
    metalnessMap: b.orm,
    normalMap: b.normal,
    normalScale: new Vector2(0.55, 0.55),
    roughness: 1,
    metalness: 1,
    color: '#c9c1ba',
    envMapIntensity: 0.9,
  })
  const grip = new MeshPhysicalMaterial({
    map: h.map,
    roughnessMap: h.orm,
    metalnessMap: h.orm,
    normalMap: h.normal,
    normalScale: new Vector2(0.5, 0.5),
    roughness: 1,
    metalness: 1,
    color: '#c9c1ba',
    envMapIntensity: 0.9,
  })
  return { body, handle, fillet, coat, grip }
}

export function Kettlebell(props: ThreeElements['group']) {
  kb ??= makeKettlebell()
  return (
    <group {...props}>
      <mesh geometry={kb.body} material={kb.coat} castShadow receiveShadow />
      <mesh geometry={kb.handle} material={kb.grip} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={kb!.fillet} material={kb!.coat} position={[s * 0.076, 0.176, 0]} rotation-z={-s * 0.38} castShadow />
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------
   Round-head pro dumbbell, 32 kg: Ø150 mm urethane heads, 140 mm knurled handle.
   --------------------------------------------------------------- */
let db: ReturnType<typeof makeDumbbell> | null = null
function makeDumbbell() {
  const half = 0.07 // half handle length
  const head = new LatheGeometry(
    [
      v(0.0001, half),
      v(0.03, half),
      v(0.034, half + 0.003),
      v(0.07, half + 0.006),
      v(0.075, half + 0.014),
      v(0.075, half + 0.066),
      v(0.07, half + 0.074),
      v(0.04, half + 0.078),
      v(0.0001, half + 0.079),
    ],
    96,
  )
  const urethane = new MeshPhysicalMaterial({ color: '#141413', roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.4 })
  return { head, urethane, half }
}

export function Dumbbell(props: ThreeElements['group']) {
  db ??= makeDumbbell()
  const m = sharedMaterials()
  return (
    // lies on its side: handle axis along local X, resting on the heads
    <group {...props}>
      <group position-y={0.075} rotation-z={Math.PI / 2}>
        <mesh material={m.knurled} castShadow receiveShadow>
          <cylinderGeometry args={[0.016, 0.016, db.half * 2, 40, 1, true]} />
        </mesh>
        <mesh geometry={db.head} material={db.urethane} castShadow receiveShadow />
        <mesh geometry={db.head} material={db.urethane} rotation-z={Math.PI} castShadow receiveShadow />
      </group>
    </group>
  )
}

/** Bumpers stacked flat, each settled a few millimetres off true like a real stack. */
export function PlateStack({ count, ...props }: { count: number } & ThreeElements['group']) {
  return (
    <group {...props}>
      {Array.from({ length: count }, (_, i) => (
        <PlateFlat
          key={i}
          position={[Math.sin(i * 2.3) * 0.006, PLATE_T / 2 + i * (PLATE_T + 0.0005), Math.cos(i * 1.7) * 0.006]}
          rotation-y={i * 1.9 + 0.3}
        />
      ))}
    </group>
  )
}
