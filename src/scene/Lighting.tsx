import { Environment, Lightformer } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { type Ref, useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  Euler,
  type DirectionalLight,
  type Mesh,
  Object3D,
  type RectAreaLight,
  ShaderMaterial,
  type SpotLight,
  Vector3,
} from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { STATIONS, stage } from './state'

RectAreaLightUniformsLib.init()

const NEUTRAL = new Color('#fff2e6')
const TUNGSTEN = new Color('#ffcf9a')
const FLUORESCENT = new Color('#eef4ff')
const TUBE = FLUORESCENT.clone().multiplyScalar(4) // HDR, so the fitting itself blooms
const ENV_ROTATION = new Euler(0, 1.9, 0)
const DOWN = new Vector3(0, -1, 0)
const keyPos = new Vector3()
const keyDir = new Vector3()

/** Ceiling battens over the set: x, z, rotation-y. Long 1500 mm twin-tube fittings. */
const BATTENS: [number, number, number][] = [
  [0, -0.6, 0],
  [-2.4, 0, Math.PI / 2],
  [2.5, -1.2, 0],
  [0, 2.4, 0],
  // over the rack wall and the cardio corner
  [-2.2, -4.0, 0],
  [4.7, -3.0, Math.PI / 2],
]
const BATTEN_Y = 4.3
/** a batten tube's luminance at full fill (it was a 1.5 × 0.14 m area light at this intensity) */
const BATTEN_L = 14
/** environment intensity at full fill on dedicated graphics */
const ENV_FILL = 0.32
/** the environment is captured from bar height, where the hero kit sits */
const ENV_EYE = 0.3
const HDRI = '/hdri/gym_01_1k.hdr'
/** directional stand-in for the rim strip on the lite tier (3.2 × 0.6 m at 7 nits ≈ this) */
const RIM_LITE = 1.6

/**
 * Light through a little gym air: an open cone hung from the key fixture, brightest along
 * its axis and at the source, gone by the time it reaches the floor so it never draws a line.
 */
function makeHaze() {
  const geo = new ConeGeometry(1, 1, 48, 1, true)
  geo.translate(0, -0.5, 0) // apex at the origin, opening down -y
  const mat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uColor: { value: new Color() }, uStrength: { value: 0 } },
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying float vFacing;
      varying float vWorldY;
      void main() {
        vAlong = -position.y;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldY = wp.y;
        vec3 n = normalize(normalMatrix * normal);
        vec3 v = normalize(-(viewMatrix * wp).xyz);
        vFacing = abs(dot(n, v));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vAlong;
      varying float vFacing;
      varying float vWorldY;
      void main() {
        float a = pow(vFacing, 2.5);                       // soft edges, dense core
        // clamp: interpolation can push vAlong a hair past 1, and pow() of a negative is NaN on D3D
        a *= smoothstep(0.0, 0.08, vAlong) * pow(clamp(1.0 - vAlong, 0.0, 1.0), 1.6);
        a *= smoothstep(0.05, 1.1, vWorldY);               // dissolve before the floor
        gl_FragColor = vec4(uColor * a * uStrength, 1.0);
      }`,
  })
  return { geo, mat }
}

/**
 * Motivated lighting, the way the room is actually lit: fluorescent battens on the ceiling
 * (soft top fill and the long streaks you see in the chrome), one tracked spot over the
 * station in shot (the key), a cool rim strip behind, a grazing wash on the back wall, and
 * the real gym HDRI under it all. A faint haze cone hangs off the key.
 */
export function Lighting({ shadowSize, lite = false }: { shadowSize: number; lite?: boolean }) {
  const key = useRef<SpotLight>(null)
  const wall = useRef<SpotLight>(null)
  const rim = useRef<RectAreaLight | DirectionalLight>(null)
  const keyTarget = useRef(new Object3D())
  const pools = useRef<SpotLight[]>([])
  const haze = useRef<Mesh>(null)
  const hazeParts = useMemo(makeHaze, [])

  useLayoutEffect(() => {
    key.current!.target = keyTarget.current
    key.current!.parent?.add(keyTarget.current)
    const wt = new Object3D()
    wt.position.set(-1.2, 1.2, -7)
    wall.current!.target = wt
    wall.current!.parent?.add(wt)
    const r = rim.current!
    if ('isDirectionalLight' in r) {
      r.target.position.set(0, 0.2, 0)
      r.target.updateMatrixWorld()
    } else r.lookAt(0, 0.2, 0)
  }, [])

  // Everything on the set stands still, so the key's shadow map only changes when the key itself
  // moves or opens up: redraw it then, not every frame
  const getThree = useThree((s) => s.get)
  const shadowAt = useRef(new Float64Array(7).fill(NaN))
  useLayoutEffect(() => {
    const { shadowMap } = getThree().gl
    shadowMap.autoUpdate = false
    shadowMap.needsUpdate = true
    return () => void (shadowMap.autoUpdate = true)
  }, [getThree])

  useFrame(({ scene, gl }) => {
    const c = stage.cam
    const at = shadowAt.current
    if (at[0] !== c.lx || at[1] !== c.ly || at[2] !== c.lz || at[3] !== c.ltx || at[4] !== c.lty || at[5] !== c.ltz || at[6] !== c.cone) {
      at[0] = c.lx; at[1] = c.ly; at[2] = c.lz; at[3] = c.ltx; at[4] = c.lty; at[5] = c.ltz; at[6] = c.cone
      gl.shadowMap.needsUpdate = true
    }
    const k = key.current!
    k.position.set(c.lx, c.ly, c.lz)
    keyTarget.current.position.set(c.ltx, c.lty, c.ltz)
    k.intensity = c.key * 110 * (1 + (c.cone - 0.5) * 2.5)
    k.angle = c.cone
    k.color.copy(NEUTRAL).lerp(TUNGSTEN, c.warm)
    rim.current!.intensity = c.rim * (lite ? RIM_LITE : 7)
    wall.current!.intensity = c.wall * 55
    // the battens are part of the environment, so they track the fill with it. Without them
    // (lite) the room's HDRI alone carries the top fill
    scene.environmentIntensity = c.fill * (lite ? 0.5 : ENV_FILL)
    for (const p of pools.current) p.intensity = c.pools * 80

    // haze follows the key: apex at the fixture, axis down to its target
    const h = haze.current!
    keyPos.set(c.lx, c.ly, c.lz)
    keyDir.set(c.ltx, c.lty, c.ltz).sub(keyPos)
    const len = keyDir.length() * 1.15
    const r = len * Math.tan(c.cone) * 0.85
    h.position.copy(keyPos)
    h.quaternion.setFromUnitVectors(DOWN, keyDir.normalize())
    h.scale.set(r, len, r)
    hazeParts.mat.uniforms.uColor.value.copy(k.color)
    hazeParts.mat.uniforms.uStrength.value = c.key * 0.045
    h.visible = c.key > 0.01
  })

  return (
    <>
      {lite ? (
        <Environment files={HDRI} environmentRotation={ENV_ROTATION} />
      ) : (
        /* The battens' light, baked: each tube drawn once into the environment map at startup,
           so the chrome still carries their streaks and the top fill still comes from overhead,
           but no surface pays for them per pixel per frame. As six area lights they were the
           costliest thing on the set, about half the frame on dedicated graphics */
        <Environment files={HDRI} environmentRotation={ENV_ROTATION}>
          {/* the map is looked up through the inverse of ENV_ROTATION (WebGLMaterials), so lay the
              tubes out pre-rotated, around the capture point at bar height */}
          <group rotation-y={-ENV_ROTATION.y} position-y={-ENV_EYE}>
            {BATTENS.map(([x, z, ry], i) => (
              <group key={i} position={[x, BATTEN_Y, z]} rotation-y={ry}>
                <Lightformer form="rect" rotation-x={Math.PI / 2} scale={[1.5, 0.14, 1]} color={FLUORESCENT} intensity={BATTEN_L / ENV_FILL} />
              </group>
            ))}
          </group>
        </Environment>
      )}
      <spotLight
        ref={key}
        angle={0.5}
        penumbra={0.75}
        decay={2}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.00012}
        shadow-normalBias={0.015}
      />
      <mesh ref={haze} geometry={hazeParts.geo} material={hazeParts.mat} renderOrder={10} frustumCulled={false} />
      {/* area lights are priced per pixel on every lit surface: integrated graphics get the rim
          from a plain directional in the same place, which reads the same along the bar's edges */}
      {lite ? (
        <directionalLight ref={rim as Ref<DirectionalLight>} position={[-1.6, 1.3, -2.2]} color="#dfe8f2" />
      ) : (
        <rectAreaLight ref={rim as Ref<RectAreaLight>} position={[-1.6, 1.3, -2.2]} width={3.2} height={0.6} color="#dfe8f2" />
      )}
      {/* fluorescent battens: the fitting itself, bright enough to bloom */}
      {BATTENS.map(([x, z, ry], i) => (
        <mesh key={i} position={[x, BATTEN_Y + 0.02, z]} rotation-y={ry}>
          <boxGeometry args={[1.52, 0.035, 0.16]} />
          <meshBasicMaterial color={TUBE} toneMapped={false} />
        </mesh>
      ))}
      {/* practicals over the other stations: no shadows, just enough to find them in the dark.
          Integrated graphics skip them: the key already follows whichever station is in shot */}
      {!lite && [STATIONS.bells, STATIONS.dumbbells, STATIONS.stacks].map((p, i) => (
        <spotLight
          key={i}
          ref={(l) => {
            if (!l) return
            pools.current[i] = l
            // static target outside the scene graph: place it once by hand
            l.target.position.set(p.x, 0, p.z)
            l.target.updateMatrixWorld()
          }}
          position={[p.x, 3.2, p.z - 0.3]}
          angle={0.42}
          penumbra={0.9}
          decay={2}
          color="#ffeedd"
        />
      ))}
      <spotLight ref={wall} position={[1.5, 5.6, -4.5]} angle={0.55} penumbra={1} decay={2} color="#f3d9bd" />
    </>
  )
}
