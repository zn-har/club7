import { useTexture } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector2, type Texture } from 'three'
import { LITE } from './quality'
import { PLATFORM_H, PLATFORM_W, STATIONS } from './state'
import { getRubberNormal } from './textures'
import { FLOOR_OVERLAY_SIZE, getFloorOverlay, getPlatformWoodMaps } from './wear'

/**
 * Rubber-tiled lifting floor and a concrete back wall, both from Poly Haven scans, with an
 * oak-and-rubber Olympic platform under the bar. The floor shader layers on what a scan
 * tiled 17 times cannot: tile-to-tile batch variation, settled tiles catching light at
 * slightly different angles, grime, EPDM flecks, chalk, scuffs and worn painted lines.
 */

function tile(maps: Texture[], repeat: [number, number], srgb = 0) {
  maps.forEach((t, i) => {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(...repeat)
    t.anisotropy = 8
    if (i === srgb) t.colorSpace = SRGBColorSpace
    t.needsUpdate = true
  })
}

/*
 * The floor fills most of every frame, so its noise is the costliest shading on the set.
 * Integrated graphics run three octaves instead of five and a single noise for the chalk grit:
 * the fine octaves are below a pixel at their resolution anyway.
 */
const FLOOR_GLSL = /* glsl */ `
#define FLOOR_OCTAVES ${LITE ? 3 : 5}
varying vec2 vFloorXZ;
uniform sampler2D floorOverlay;
uniform vec3 uEmber;
float fh(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float fn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(fh(i), fh(i + vec2(1, 0)), f.x), mix(fh(i + vec2(0, 1)), fh(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < FLOOR_OCTAVES; i++) { s += a * fn(p); p *= 2.03; a *= 0.5; } return s; }
`

function makeFloorMaterial(maps: Texture[]) {
  const mat = new MeshStandardMaterial({
    map: maps[0],
    normalMap: maps[1],
    roughnessMap: maps[2],
    normalScale: new Vector2(0.32, 0.32),
    color: '#242423',
    roughness: 1,
    envMapIntensity: 0.26,
  })
  const overlay = getFloorOverlay(STATIONS)
  mat.onBeforeCompile = (s) => {
    s.uniforms.floorOverlay = { value: overlay }
    s.uniforms.uEmber = { value: new Color('#9c4f2c') }
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorXZ = (modelMatrix * vec4(transformed, 1.0)).xz;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FLOOR_GLSL)
      .replace(
        '#include <map_fragment>',
        /* glsl */ `#include <map_fragment>
        vec2 fxz = vFloorXZ;
        // which 500 mm tile this is, following the scan's staggered layout (4 columns per repeat)
        vec2 rep = floor(vMapUv), cell = fract(vMapUv);
        float col = floor(cell.x * 4.0);
        float off = col < 0.5 ? 0.0625 : col < 1.5 ? 0.527 : col < 2.5 ? 0.055 : 0.51;
        vec2 tid = rep * 8.0 + vec2(col, floor((1.0 - cell.y) * 4.0 - off));
        float th = fh(tid + 0.37), th2 = fh(tid * 1.7 + 3.1);
        vec3 c = diffuseColor.rgb * (0.93 + 0.13 * th);
        c *= mix(vec3(1.0), vec3(1.025, 1.0, 0.965), th2); // tiles from different batches
        float grime = fbm(fxz * 0.45), fine = fbm(fxz * 3.1);
        c *= 0.7 + 0.55 * grime;
        // EPDM flecks, faded out before they can alias
        vec2 fp = fxz * 320.0;
        float fw = fwidth(fp.x) + fwidth(fp.y);
        float fleck = step(0.984, fh(floor(fp))) * (1.0 - smoothstep(0.35, 1.1, fw));
        c = mix(c, vec3(0.11, 0.105, 0.1), fleck * 0.8);
        vec2 ouv = fxz / ${FLOOR_OVERLAY_SIZE.toFixed(1)} + 0.5;
        vec4 o = texture2D(floorOverlay, clamp(ouv, 0.0, 1.0));
        o *= step(0.0, ouv.x) * step(ouv.x, 1.0) * step(0.0, ouv.y) * step(ouv.y, 1.0);
        // chalk is grain, not haze: break it up hard at a few millimetres
        float grit = ${LITE ? 'fn(fxz * 60.0)' : 'fbm(fxz * 60.0)'};
        float chalk = clamp(o.r * smoothstep(0.35, 0.8, fbm(fxz * 11.0) * 0.6 + grit * 0.55) * 1.6, 0.0, 1.0);
        float paint = o.g * smoothstep(0.42, 0.58, fbm(fxz * 14.0) * 0.6 + fbm(fxz * 2.2) * 0.4 + o.g * 0.12);
        float scuff = o.b * (0.5 + 0.5 * fine);
        c = mix(c, uEmber * (0.85 + 0.3 * fine), paint);
        c *= 1.0 - scuff * 0.5;
        c = mix(c, vec3(0.42, 0.41, 0.39), chalk * 0.45);
        diffuseColor.rgb = c;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
        roughnessFactor *= 0.92 + 0.1 * th;
        roughnessFactor = mix(roughnessFactor, 0.5, paint);
        roughnessFactor = mix(roughnessFactor, 0.68, scuff);
        roughnessFactor = mix(roughnessFactor, 1.0, chalk);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        // tiles never settle perfectly flat: each catches the light at its own angle
        vec3 tilt = vec3(th - 0.5, 0.0, th2 - 0.5) * 0.022 * (1.0 - paint);
        normal = normalize(normal + (viewMatrix * vec4(tilt, 0.0)).xyz);`,
      )
  }
  return mat
}

/** Olympic platform: oak centre where the lifter stands, thick rubber either side for the plates. */
function LiftingPlatform() {
  const wood = getPlatformWoodMaps()
  const side = useMemo(() => {
    const n = getRubberNormal().clone()
    n.repeat.set(3, 6)
    n.needsUpdate = true
    return n
  }, [])
  const half = PLATFORM_W / 2
  const strip = PLATFORM_W / 4 // rubber strips 610 mm wide, oak sheet 1220 mm
  return (
    <group position-y={PLATFORM_H / 2}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[half, PLATFORM_H, PLATFORM_W]} />
        <meshStandardMaterial
          map={wood.map}
          roughnessMap={wood.orm}
          normalMap={wood.normal}
          normalScale={new Vector2(0.5, 0.5)}
          color="#4d443c"
          roughness={1}
          envMapIntensity={0.3}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position-x={s * (half / 2 + strip / 2)} receiveShadow castShadow>
          <boxGeometry args={[strip, PLATFORM_H - 0.002, PLATFORM_W]} />
          <meshStandardMaterial color="#1b1a19" roughness={0.92} normalMap={side} normalScale={new Vector2(0.5, 0.5)} envMapIntensity={0.15} />
        </mesh>
      ))}
      {/* steel angle round the perimeter */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position-z={s * (half + 0.006)} castShadow receiveShadow>
            <boxGeometry args={[PLATFORM_W + 0.024, PLATFORM_H + 0.002, 0.012]} />
            <meshStandardMaterial color="#2a2928" metalness={0.8} roughness={0.55} />
          </mesh>
          <mesh position-x={s * (half + 0.006)} castShadow receiveShadow>
            <boxGeometry args={[0.012, PLATFORM_H + 0.002, PLATFORM_W]} />
            <meshStandardMaterial color="#2a2928" metalness={0.8} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Platform() {
  const floor = useTexture(['/tex/rubber_diff.jpg', '/tex/rubber_nor_gl.jpg', '/tex/rubber_rough.jpg'])
  const wall = useTexture(['/tex/concrete_diff.jpg', '/tex/concrete_nor_gl.jpg', '/tex/concrete_rough.jpg'])
  const floorMat = useMemo(() => makeFloorMaterial(floor), [floor])

  useLayoutEffect(() => {
    tile(floor, [17, 17])
    tile(wall, [8.5, 2])
  }, [floor, wall])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={floorMat}>
        <planeGeometry args={[34, 34]} />
      </mesh>
      <LiftingPlatform />
      <mesh position={[0, 4, -7]} receiveShadow>
        <planeGeometry args={[34, 8]} />
        <meshStandardMaterial
          map={wall[0]}
          normalMap={wall[1]}
          roughnessMap={wall[2]}
          color="#2c2a27"
          roughness={1}
          envMapIntensity={0.05}
        />
      </mesh>
    </group>
  )
}
