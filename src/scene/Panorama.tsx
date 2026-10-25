import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { BackSide, ImageBitmapLoader, MathUtils, ShaderMaterial, SRGBColorSpace, Texture } from 'three'
import { isSmallScreen, prefersReducedMotion } from '../lib/env'

/**
 * A real 360° photograph of a training floor (Poly Haven, CC0) mapped to the inside
 * of a sphere and graded in-shader to the site's warm monochrome.
 */

/** yaw/pitch in radians; `auto` lets the view drift until the visitor takes over */
export type View = { yaw: number; pitch: number; auto: boolean }

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const frag = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(map, vec2(1.0 - vUv.x, vUv.y)).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // warm monochrome, lifted blacks crushed slightly, highlights rolled off
    vec3 mono = vec3(l) * vec3(1.04, 0.99, 0.92);
    vec3 graded = mono;
    graded = smoothstep(0.03, 1.02, graded);
    graded = pow(graded, vec3(1.12)) * 0.9;
    gl_FragColor = vec4(graded, 1.0);
    #include <colorspace_fragment>
  }
`

function Sphere() {
  // decoded off the main thread: uploading an <img> decodes it synchronously on first draw,
  // a 120ms freeze mid-scroll for the 4k image
  const bitmap = useLoader(ImageBitmapLoader, isSmallScreen ? '/hdri/gym_pano_2k.jpg' : '/hdri/gym_pano_4k.jpg', (l) =>
    l.setOptions({ imageOrientation: 'flipY' }),
  )
  const tex = useMemo(() => new Texture(bitmap), [bitmap])
  const material = useMemo(() => {
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 8
    // ImageBitmaps ignore flipY; the loader already flipped it
    tex.flipY = false
    tex.needsUpdate = true
    return new ShaderMaterial({ uniforms: { map: { value: tex } }, vertexShader: vert, fragmentShader: frag, side: BackSide })
  }, [tex])
  return (
    <mesh material={material}>
      <sphereGeometry args={[10, 96, 64]} />
    </mesh>
  )
}

function Look({ view, dragging }: { view: React.RefObject<View>; dragging: React.RefObject<boolean> }) {
  const camera = useThree((s) => s.camera)
  const current = useRef({ yaw: view.current!.yaw, pitch: view.current!.pitch })
  useFrame((_, dt) => {
    const v = view.current!
    // slow drift until the visitor takes control
    if (!dragging.current && !prefersReducedMotion && v.auto) v.yaw += dt * 0.026
    const k = 1 - Math.exp(-dt * 3.2)
    current.current.yaw = MathUtils.lerp(current.current.yaw, v.yaw, k)
    current.current.pitch = MathUtils.lerp(current.current.pitch, v.pitch, k)
    const { yaw, pitch } = current.current
    camera.lookAt(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
  })
  return null
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

export default function Panorama({
  view,
  dragging,
  onReady,
  active,
}: {
  view: React.RefObject<View>
  dragging: React.RefObject<boolean>
  onReady: () => void
  active: boolean
}) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ fov: isSmallScreen ? 78 : 62, near: 0.1, far: 30, position: [0, 0, 0.001] }}
      gl={{ antialias: true }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Sphere />
        <Look view={view} dragging={dragging} />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
