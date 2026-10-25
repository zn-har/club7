import type { ThreeElements } from '@react-three/fiber'
import { DoubleSide, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, RingGeometry, Vector2 } from 'three'
import { getKnurlNormal, getPlateDecal, getRubberNormal } from './textures'

/**
 * Olympic barbell loaded with bumper plates, built to IWF dimensions.
 * Everything is lathe-turned around the bar axis, which is how the real parts are made.
 *
 * Bar: 2.20 m, shaft Ø28 mm, 1.31 m between inner collars, sleeves Ø50 mm × 415 mm.
 * Plates: Ø450 mm, 20 kg ≈ 54 mm thick, steel hub insert.
 */

export const PLATE_R = 0.225
const SHAFT_R = 0.014
const COLLAR_IN = 0.655 // half of 1.31 m
const COLLAR_W = 0.03
const SLEEVE_R = 0.025
const BAR_HALF = 1.1

const v = (r: number, y: number) => new Vector2(r, y)

let materials: ReturnType<typeof createMaterials> | null = null
const useMaterials = () => (materials ??= createMaterials())
let geometries: ReturnType<typeof createGeometries> | null = null
const useGeometries = () => (geometries ??= createGeometries())

function createMaterials() {
  {
    const knurl = getKnurlNormal()
    const knurlTex = knurl.clone()
    knurlTex.repeat.set(5, 18)
    knurlTex.needsUpdate = true

    const knurled = new MeshPhysicalMaterial({
      color: '#9a9894',
      metalness: 1,
      roughness: 0.42,
      normalMap: knurlTex,
      normalScale: new Vector2(0.9, 0.9),
    })
    const smoothShaft = new MeshPhysicalMaterial({ color: '#a19f9b', metalness: 1, roughness: 0.3 })
    // hard chrome sleeves, lightly brushed by years of plates sliding on
    const chrome = new MeshPhysicalMaterial({
      color: '#e2e0dc',
      metalness: 1,
      roughness: 0.1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.08,
    })

    const rubberNormal = getRubberNormal().clone()
    rubberNormal.repeat.set(7, 7)
    rubberNormal.needsUpdate = true
    const rubber = new MeshPhysicalMaterial({
      // virgin rubber: dull broad specular, a dusty sheen that lifts the edges at grazing angles
      color: '#121212',
      metalness: 0,
      roughness: 0.78,
      specularIntensity: 0.55,
      normalMap: rubberNormal,
      normalScale: new Vector2(0.28, 0.28),
      sheen: 0.45,
      sheenRoughness: 0.5,
      sheenColor: '#3b3b3d',
      side: DoubleSide,
    })
    const hub = new MeshPhysicalMaterial({ color: '#8f8e8b', metalness: 1, roughness: 0.46, side: DoubleSide })
    const decal = new MeshStandardMaterial({
      map: getPlateDecal('20'),
      transparent: true,
      opacity: 0.72,
      roughness: 0.62,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      depthWrite: false,
    })
    return { knurled, smoothShaft, chrome, rubber, hub, decal }
  }
}

function createGeometries() {
  {
    // collar + sleeve, profile from inner collar face outwards (y = along bar)
    const sleeve = new LatheGeometry(
      [
        v(0.0001, COLLAR_IN),
        v(0.03, COLLAR_IN),
        v(0.0365, COLLAR_IN + 0.002),
        v(0.0375, COLLAR_IN + 0.005),
        v(0.0375, COLLAR_IN + COLLAR_W - 0.005),
        v(0.0365, COLLAR_IN + COLLAR_W - 0.002),
        v(0.031, COLLAR_IN + COLLAR_W),
        v(SLEEVE_R, COLLAR_IN + COLLAR_W + 0.001),
        v(SLEEVE_R, BAR_HALF - 0.08),
        v(SLEEVE_R - 0.0012, BAR_HALF - 0.079), // machined groove
        v(SLEEVE_R - 0.0012, BAR_HALF - 0.076),
        v(SLEEVE_R, BAR_HALF - 0.075),
        v(SLEEVE_R, BAR_HALF - 0.004),
        v(SLEEVE_R - 0.003, BAR_HALF),
        v(0.0001, BAR_HALF),
      ],
      96,
    )

    const h = 0.027 // half thickness of a 20 kg bumper
    const rubber = new LatheGeometry(
      [
        v(0.081, -h + 0.0035),
        v(0.19, -h + 0.0035),
        v(0.196, -h + 0.001),
        v(0.2, -h),
        v(0.218, -h),
        v(0.2225, -h + 0.0015),
        v(0.2248, -h + 0.0055),
        v(PLATE_R, -h + 0.01),
        v(PLATE_R, h - 0.01),
        v(0.2248, h - 0.0055),
        v(0.2225, h - 0.0015),
        v(0.218, h),
        v(0.2, h),
        v(0.196, h - 0.001),
        v(0.19, h - 0.0035),
        v(0.081, h - 0.0035),
        v(0.081, -h + 0.0035),
      ],
      128,
    )
    const hub = new LatheGeometry(
      [
        v(0.0255, -h - 0.0005),
        v(0.072, -h - 0.0005),
        v(0.078, -h + 0.001),
        v(0.0815, -h + 0.003),
        v(0.0815, h - 0.003),
        v(0.078, h - 0.001),
        v(0.072, h + 0.0005),
        v(0.0255, h + 0.0005),
        v(0.0255, -h - 0.0005),
      ],
      96,
    )
    const decal = new RingGeometry(0.084, PLATE_R - 0.03, 128, 1)
    // RingGeometry UVs map the outer diameter to 0..1; rescale so the canvas spans the full plate
    const uv = decal.attributes.uv
    const pos = decal.attributes.position
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, pos.getX(i) / (PLATE_R * 2) + 0.5, pos.getY(i) / (PLATE_R * 2) + 0.5)
    }
    // spin-on lock collar
    const lock = new LatheGeometry(
      [
        v(SLEEVE_R + 0.0005, -0.02),
        v(0.041, -0.02),
        v(0.043, -0.017),
        v(0.043, 0.017),
        v(0.041, 0.02),
        v(SLEEVE_R + 0.0005, 0.02),
      ],
      64,
    )
    return { sleeve, rubber, hub, decal, lock, h }
  }
}

function Plate({ x, flip, rotation }: { x: number; flip: number; rotation: number }) {
  const m = useMaterials()
  const g = useGeometries()
  const face = g.h - 0.0035 + 0.0004
  return (
    // lathe axis is Y; plates rotate about the bar (X) so each sits at its own angle
    <group position-x={x} rotation-x={rotation}>
      <group rotation-z={-Math.PI / 2}>
        <mesh geometry={g.rubber} material={m.rubber} castShadow receiveShadow />
        <mesh geometry={g.hub} material={m.hub} castShadow receiveShadow />
        <mesh geometry={g.decal} material={m.decal} position-y={face * flip} rotation-x={(flip * -Math.PI) / 2} />
      </group>
    </group>
  )
}

export function Barbell(props: ThreeElements['group']) {
  const m = useMaterials()
  const g = useGeometries()
  const t = g.h * 2
  // knurl pattern: centre knurl, smooth, grip knurl, smooth to collar
  const shaftSegments: Array<[number, number, boolean]> = [
    [-0.08, 0.08, true],
    [0.08, 0.215, false],
    [-0.215, -0.08, false],
    [0.215, 0.625, true],
    [-0.625, -0.215, true],
    [0.625, COLLAR_IN, false],
    [-COLLAR_IN, -0.625, false],
  ]
  return (
    <group {...props}>
      {shaftSegments.map(([a, b, knurled]) => (
        <mesh
          key={a}
          position-x={(a + b) / 2}
          rotation-z={Math.PI / 2}
          material={knurled ? m.knurled : m.smoothShaft}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[SHAFT_R, SHAFT_R, b - a, 48, 1, true]} />
        </mesh>
      ))}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh geometry={g.sleeve} material={m.chrome} rotation-z={(-Math.PI / 2) * side} castShadow receiveShadow />
          <Plate x={side * (COLLAR_IN + COLLAR_W + 0.002 + t / 2)} flip={side} rotation={side * 0.7} />
          <Plate x={side * (COLLAR_IN + COLLAR_W + 0.004 + t * 1.5)} flip={side} rotation={side * 2.1 + 0.4} />
          <mesh
            geometry={g.lock}
            material={m.chrome}
            position-x={side * (COLLAR_IN + COLLAR_W + 0.008 + t * 2 + 0.02)}
            rotation-z={-Math.PI / 2}
            castShadow
          />
        </group>
      ))}
    </group>
  )
}

/** Thickness of one 20 kg bumper. */
export const PLATE_T = 0.054

/** A single bumper lying flat (axis = Y), printed face up — for stacks on the floor. */
export function PlateFlat(props: ThreeElements['group']) {
  const m = useMaterials()
  const g = useGeometries()
  return (
    <group {...props}>
      <mesh geometry={g.rubber} material={m.rubber} castShadow receiveShadow />
      <mesh geometry={g.hub} material={m.hub} castShadow receiveShadow />
      <mesh geometry={g.decal} material={m.decal} position-y={g.h - 0.0035 + 0.0004} rotation-x={-Math.PI / 2} />
    </group>
  )
}

/** Shared steel materials for the other props on the set. */
export const sharedMaterials = () => useMaterials()
