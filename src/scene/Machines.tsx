import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { Color, MeshStandardMaterial } from 'three'
import { Barbell, PLATE_T, PlateFlat } from './Barbell'
import { Dumbbell } from './Props'
import { physical } from './quality'
import { StaticBatch } from './StaticBatch'

/**
 * The rest of the floor: racks along the back wall, benches and a dumbbell rack down the
 * left, cardio on the right. Set dressing for the background of every shot — the camera
 * never stops on it, so it is built from simple steel sections, not turned like the bar.
 */

let mats: ReturnType<typeof makeMaterials> | null = null
const useMats = () => (mats ??= makeMaterials())
function makeMaterials() {
  return {
    // matte black powder coat over 3×3" 11-gauge steel
    steel: physical({ color: '#1c1c1e', metalness: 0.6, roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.6 }),
    zinc: new MeshStandardMaterial({ color: '#9b9a97', metalness: 1, roughness: 0.32 }),
    vinyl: physical({ color: '#111112', roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.45, sheen: 0.3, sheenColor: new Color('#2a2a2c') }),
    shroud: new MeshStandardMaterial({ color: '#161617', roughness: 0.62, metalness: 0.1 }),
    belt: new MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.92 }),
    hole: new MeshStandardMaterial({ color: '#050505', roughness: 1 }),
    // console screens: a cool practical glow, the only light the cardio corner makes itself
    screen: new MeshStandardMaterial({ color: '#05080a', emissive: new Color('#3d7fa0'), emissiveIntensity: 0.7, roughness: 0.3 }),
  }
}

type Box = { size: [number, number, number]; at: [number, number, number]; rot?: [number, number, number]; m?: keyof ReturnType<typeof makeMaterials> }
/** A run of steel sections. Most of the floor is boxes. */
function Boxes({ parts }: { parts: Box[] }) {
  const m = useMats()
  return parts.map((p, i) => (
    <mesh key={i} position={p.at} rotation={p.rot ?? [0, 0, 0]} material={m[p.m ?? 'steel']} castShadow receiveShadow>
      <boxGeometry args={p.size} />
    </mesh>
  ))
}

/* ---------------------------------------------------------------
   Power rack: 3×3" uprights, 1.22 m square, 2.29 m tall. No punched holes: at set distance
   they fall under a pixel and shimmer as the camera moves.
   Front faces +z.
   --------------------------------------------------------------- */
const RW = 1.22
const RD = 1.22
const RH = 2.29
const T = 0.076

export function PowerRack({ loaded = true, ...props }: { loaded?: boolean } & ThreeElements['group']) {
  const m = useMats()
  const ux = RW / 2 - T / 2
  const uz = RD / 2 - T / 2

  const parts: Box[] = [
    // uprights
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz): Box => ({ size: [T, RH, T], at: [sx * ux, RH / 2 + 0.05, sz * uz] }))),
    // top crossmembers
    ...[-1, 1].map((sz): Box => ({ size: [RW - 2 * T, T, T * 0.98], at: [0, RH + 0.05 - T / 2 - 0.002, sz * uz] })),
    ...[-1, 1].map((sx): Box => ({ size: [T, T, RD - 2 * T], at: [sx * ux, RH + 0.05 - T / 2, 0] })),
    // feet and the rear base tie
    ...[-1, 1].map((sx): Box => ({ size: [0.1, 0.05, RD + 0.36], at: [sx * ux, 0.025, 0] })),
    { size: [2 * ux - 0.1, 0.045, T], at: [0, 0.0225, -uz] },
    // J-cups, zinc, catching the bar just below shoulder height
    ...[-1, 1].map((sx): Box => ({ size: [0.07, 0.05, 0.11], at: [sx * ux, 1.33, uz + T / 2 + 0.05], m: 'zinc' })),
    ...[-1, 1].map((sx): Box => ({ size: [0.07, 0.04, 0.012], at: [sx * ux, 1.375, uz + T / 2 + 0.1], m: 'zinc' })),
    // spotter arms run front to back inside the uprights
    ...[-1, 1].map((sx): Box => ({ size: [0.05, 0.05, RD + 0.1], at: [sx * (ux - T / 2 - 0.03), 0.62, 0] })),
    // pull-up bar brackets
    ...[-1, 1].map((sx): Box => ({ size: [T, 0.05, 0.16], at: [sx * ux, RH + 0.025, uz + 0.1] })),
  ]
  return (
    <group {...props}>
      <Boxes parts={parts} />
      <mesh position={[0, RH + 0.01, uz + 0.17]} rotation-z={Math.PI / 2} material={m.zinc} castShadow>
        <cylinderGeometry args={[0.016, 0.016, RW + 0.12, 24]} />
      </mesh>
      {/* plate horns on the rear uprights, each carrying a pair */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * (RW / 2), 0.46, -uz]}>
          <mesh position-x={sx * 0.13} rotation-z={Math.PI / 2} material={m.zinc} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.26, 24]} />
          </mesh>
          {[0, 1].map((i) => (
            <PlateFlat key={i} position-x={sx * (0.03 + PLATE_T * (i + 0.5))} rotation={[i * 1.3, 0, Math.PI / 2]} lo />
          ))}
        </group>
      ))}
      {loaded && <Barbell lo position={[0, 1.39, uz + T / 2 + 0.05]} rotation-x={0.4} />}
    </group>
  )
}

/* ---------------------------------------------------------------
   Benches. Flat: 1.2 m pad at 430 mm. Incline: seat + back at ~30°. Length runs along z.
   --------------------------------------------------------------- */
export function Bench({ incline = 0, ...props }: { incline?: number } & ThreeElements['group']) {
  const m = useMats()
  const frame: Box[] = [
    { size: [0.08, 0.05, 1.0], at: [0, 0.36, 0] },
    { size: [0.07, 0.34, 0.07], at: [0, 0.19, 0.45] },
    { size: [0.07, 0.34, 0.07], at: [0, 0.19, -0.45] },
    { size: [0.5, 0.05, 0.07], at: [0, 0.025, 0.45] },
    { size: [0.42, 0.05, 0.07], at: [0, 0.025, -0.45] },
  ]
  return (
    <group {...props}>
      <Boxes parts={frame} />
      {incline === 0 ? (
        <RoundedBox args={[0.28, 0.065, 1.18]} radius={0.025} smoothness={3} position-y={0.42} material={m.vinyl} castShadow receiveShadow />
      ) : (
        <>
          <RoundedBox args={[0.3, 0.065, 0.36]} radius={0.025} smoothness={3} position={[0, 0.42, 0.36]} material={m.vinyl} castShadow receiveShadow />
          <group position={[0, 0.42, 0.16]} rotation-x={incline}>
            <RoundedBox args={[0.28, 0.065, 0.86]} radius={0.025} smoothness={3} position-z={-0.45} material={m.vinyl} castShadow receiveShadow />
          </group>
          {/* ladder strut under the back pad */}
          <Boxes parts={[{ size: [0.06, 0.05, 0.5], at: [0, 0.5, -0.32], rot: [incline * 1.4, 0, 0] }]} />
        </>
      )}
    </group>
  )
}

/* ---------------------------------------------------------------
   Two-tier dumbbell rack, 2.2 m. Pairs climb in weight left to right. Front faces +z.
   --------------------------------------------------------------- */
export function DumbbellRack(props: ThreeElements['group']) {
  const L = 2.2
  const tiers = [
    { y: 0.5, z: 0.12, tilt: 0.22, from: 0.62, to: 0.82 },
    { y: 0.82, z: -0.12, tilt: 0.3, from: 0.84, to: 1.05 },
  ]
  const frame: Box[] = [
    ...[-1, 0, 1].map((s): Box => ({ size: [0.05, 0.86, 0.12], at: [s * (L / 2 - 0.03), 0.43, 0], rot: [0.12, 0, 0] })),
    ...[-1, 0, 1].map((s): Box => ({ size: [0.06, 0.05, 0.62], at: [s * (L / 2 - 0.03), 0.025, 0] })),
    ...tiers.flatMap((t): Box[] =>
      [-1, 1].map((e) => ({ size: [L, 0.035, 0.035], at: [0, t.y, t.z + e * 0.1], rot: [t.tilt, 0, 0] })),
    ),
  ]
  return (
    <group {...props}>
      <Boxes parts={frame} />
      {tiers.map((t, ti) => {
        const pairs = 7
        const out = []
        let x = -L / 2 + 0.1
        for (let i = 0; i < pairs; i++) {
          const s = t.from + ((t.to - t.from) * i) / (pairs - 1)
          const w = 0.15 * s
          for (let k = 0; k < 2; k++) {
            out.push(
              <Dumbbell
                key={`${ti}-${i}-${k}`}
                position={[x + w / 2, t.y + 0.018, t.z]}
                rotation={[t.tilt, Math.PI / 2, 0]}
                scale={s}
                lo
              />,
            )
            x += w + 0.008
          }
          x += 0.035
        }
        return out
      })}
    </group>
  )
}

/* ---------------------------------------------------------------
   Cardio. All face +x.
   --------------------------------------------------------------- */
export function Rower(props: ThreeElements['group']) {
  const m = useMats()
  return (
    <group {...props}>
      <Boxes
        parts={[
          // monorail, rising gently to the flywheel
          { size: [1.75, 0.055, 0.07], at: [-0.25, 0.34, 0], rot: [0, 0, 0.05] },
          { size: [0.06, 0.3, 0.38], at: [-1.1, 0.15, 0] },
          { size: [0.08, 0.06, 0.55], at: [0.95, 0.03, 0] },
          { size: [0.16, 0.38, 0.1], at: [0.82, 0.2, 0], rot: [0, 0, -0.35] },
          // footplates, splayed
          ...[-1, 1].map((s): Box => ({ size: [0.24, 0.015, 0.12], at: [0.48, 0.3, s * 0.08], rot: [s * 0.15, 0, 0.75], m: 'shroud' })),
          // monitor arm
          { size: [0.03, 0.62, 0.03], at: [0.86, 0.85, 0], rot: [0, 0, 0.35] },
        ]}
      />
      <mesh position={[0.92, 0.5, 0]} rotation-x={Math.PI / 2} material={m.shroud} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.14, 48]} />
      </mesh>
      <RoundedBox args={[0.3, 0.06, 0.3]} radius={0.02} smoothness={3} position={[-0.25, 0.42, 0]} material={m.vinyl} castShadow />
      <mesh position={[0.7, 0.55, 0]} rotation-x={Math.PI / 2} material={m.shroud} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.5, 16]} />
      </mesh>
      <group position={[0.74, 1.14, 0]} rotation-z={0.5}>
        <mesh material={m.shroud} castShadow>
          <boxGeometry args={[0.03, 0.15, 0.2]} />
        </mesh>
        <mesh position-x={-0.016} rotation-y={-Math.PI / 2} material={m.screen}>
          <planeGeometry args={[0.15, 0.1]} />
        </mesh>
      </group>
    </group>
  )
}

export function AirBike(props: ThreeElements['group']) {
  const m = useMats()
  return (
    <group {...props}>
      <Boxes
        parts={[
          { size: [0.08, 0.06, 0.6], at: [0.62, 0.03, 0] },
          { size: [0.08, 0.06, 0.55], at: [-0.5, 0.03, 0] },
          { size: [1.05, 0.07, 0.07], at: [0.05, 0.1, 0] },
          { size: [0.07, 0.95, 0.07], at: [-0.28, 0.5, 0], rot: [0, 0, -0.32] },
          { size: [0.07, 0.6, 0.07], at: [0.32, 0.4, 0], rot: [0, 0, 0.4] },
          // swing arms
          ...[-1, 1].map((s): Box => ({ size: [0.035, 0.95, 0.035], at: [0.2, 0.86, s * 0.27], rot: [s * 0.08, 0, -0.18] })),
        ]}
      />
      {/* the fan: shrouded drum and its grille face */}
      <mesh position={[0.48, 0.47, 0]} rotation-x={Math.PI / 2} material={m.shroud} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.2, 48]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.48, 0.47, s * 0.102]} material={m.hole}>
          <circleGeometry args={[0.3, 48]} />
        </mesh>
      ))}
      <RoundedBox args={[0.28, 0.07, 0.22]} radius={0.03} smoothness={3} position={[-0.42, 1.0, 0]} material={m.vinyl} castShadow />
      <group position={[0.42, 1.12, 0]} rotation-z={0.6}>
        <mesh material={m.shroud}>
          <boxGeometry args={[0.03, 0.13, 0.17]} />
        </mesh>
        <mesh position-x={-0.016} rotation-y={-Math.PI / 2} material={m.screen}>
          <planeGeometry args={[0.13, 0.08]} />
        </mesh>
      </group>
    </group>
  )
}

export function Treadmill(props: ThreeElements['group']) {
  const m = useMats()
  return (
    <group {...props}>
      <Boxes
        parts={[
          { size: [2.0, 0.2, 0.84], at: [0, 0.14, 0], m: 'shroud' },
          { size: [1.62, 0.012, 0.56], at: [-0.12, 0.246, 0], m: 'belt' },
          { size: [0.34, 0.26, 0.82], at: [0.86, 0.172, 0], m: 'shroud' },
          ...[-1, 1].map((s): Box => ({ size: [0.07, 1.18, 0.07], at: [0.84, 0.82, s * 0.39], rot: [0, 0, 0.22] })),
          ...[-1, 1].map((s): Box => ({ size: [0.5, 0.035, 0.035], at: [0.55, 1.08, s * 0.39], rot: [0, 0, 0.12] })),
          { size: [0.26, 0.34, 0.86], at: [0.72, 1.38, 0], rot: [0, 0, -0.62], m: 'shroud' },
        ]}
      />
      <mesh position={[0.6, 1.36, 0]} rotation={[0, -Math.PI / 2, 0.95]} material={m.screen}>
        <planeGeometry args={[0.5, 0.2]} />
      </mesh>
    </group>
  )
}

/**
 * Where everything stands. The bar's platform is the origin; the back wall is at z = -7.
 * All of it sits outside the key light's cone, so none of it takes part in the shadow pass,
 * and it never moves, so it draws merged: a handful of calls instead of a few hundred. One
 * batch per corner of the room, so the corners out of shot are still culled.
 */
export function Machines() {
  return (
    <group>
      <StaticBatch shadows={false}>
      {/* rack wall: three racks behind the platform, one with a bench set in it */}
      <PowerRack position={[-3.3, 0, -4.4]} />
      <PowerRack position={[-1.15, 0, -4.4]} />
      <PowerRack position={[1.0, 0, -4.4]} loaded={false} />
      <Bench position={[-1.15, 0, -4.15]} />
      </StaticBatch>

      <StaticBatch shadows={false}>
      {/* free weights down the left */}
      <DumbbellRack position={[-5.7, 0, -1.6]} rotation-y={Math.PI / 2} />
      <Bench position={[-4.35, 0, -2.2]} incline={0.5} rotation-y={-Math.PI / 2 + 0.15} />
      <Bench position={[-4.4, 0, -0.6]} rotation-y={Math.PI / 2 - 0.1} />
      </StaticBatch>

      <StaticBatch shadows={false}>
      {/* cardio corner, back right: treadmills facing the wall, rowers and bikes in front */}
      {[3.7, 4.75, 5.8].map((x) => (
        <Treadmill key={x} position={[x, 0, -4.6]} rotation-y={Math.PI / 2} />
      ))}
      {[-2.7, -1.75, -0.8].map((z) => (
        <Rower key={z} position={[5.4, 0, z]} />
      ))}
      <AirBike position={[5.3, 0, 0.5]} rotation-y={-0.2} />
      <AirBike position={[5.4, 0, 1.45]} rotation-y={-0.35} />
      </StaticBatch>
    </group>
  )
}
