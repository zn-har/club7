import { ContactShadows, SoftShadows } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, Effect, EffectPass, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { NoToneMapping, Vector3, WebGLRenderTarget } from 'three'
import { initialTier, isCoarsePointer, prefersReducedMotion, stageStruggling } from '../lib/env'
import { gsap } from '../motion/scroll'
import { Barbell, PLATE_R } from './Barbell'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { Machines } from './Machines'
import { Platform } from './Platform'
import { Dumbbell, Kettlebell, PlateStack } from './Props'
import { PLATFORM_H, STATIONS, stage } from './state'
import { StaticBatch } from './StaticBatch'

const focusPoint = new Vector3()

function Ready() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let fired = false
    const fire = () => {
      if (fired) return
      fired = true
      stage.ready = true
      window.dispatchEvent(new Event('stage:ready'))
    }
    // compile the set's shaders off the main thread while the loader is still up, so nothing
    // compiles mid-scroll; never wait on it for long.
    // The scene draws into the composer's linear buffer, not the screen, and output colour space
    // is part of a program's key: compile against a linear target or every material compiles a
    // second time, synchronously, when it first comes into shot (a 1s freeze at the barbell)
    const target = new WebGLRenderTarget(1, 1)
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(target)
    const compiling = gl.compileAsync(scene, camera)
    gl.setRenderTarget(prev)
    compiling.then(fire, fire).finally(() => target.dispose())
    const t = window.setTimeout(fire, 1500)
    return () => window.clearTimeout(t)
  }, [gl, scene, camera])
  return null
}

/**
 * One NaN or Inf pixel (a degenerate shadow or specular sample) is invisible on its own, but
 * depth of field and bloom blur it across the frame: bloom's coarsest mips turn it into a black
 * block over most of the frame for one frame. Scrub it before each blur.
 * The test is on the raw bits: D3D's shader compiler assumes floats are never NaN and strips
 * isnan()/isinf() (warning X3577).
 */
class SanitizeEffect extends Effect {
  constructor() {
    super(
      'Sanitize',
      /* glsl */ `
      // exponent bits all set = NaN or Inf
      bool notFinite(float x) { return (floatBitsToUint(x) & 0x7f800000u) == 0x7f800000u; }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = inputColor.rgb;
        if (notFinite(c.r) || notFinite(c.g) || notFinite(c.b)) c = vec3(0.0);
        float a = notFinite(inputColor.a) ? 1.0 : inputColor.a;
        outputColor = vec4(clamp(c, 0.0, 32.0), a);
      }`,
      // SRC writes the result as-is; the default NORMAL is mix(input, result, 1), which is
      // input + (result - input) on the GPU and so hands the NaN straight back
      { blendFunction: BlendFunction.SRC },
    )
  }
}

function SanitizePass() {
  const camera = useThree((s) => s.camera)
  // its own pass, so the blur effects after it read the scrubbed buffer
  const pass = useMemo(() => new EffectPass(camera, new SanitizeEffect()), [camera])
  useEffect(() => () => pass.dispose(), [pass])
  return <primitive object={pass} />
}

/**
 * While the sand pages fully cover the set nothing of it is visible, so stop drawing: the GPU
 * idles through the middle of the page and the take resumes the moment the veil lifts.
 */
function VeilPause() {
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    let paused = false
    const tick = () => {
      const next = stage.veil > 0.995
      if (next === paused) return
      paused = next
      // demand, not never: a resize or first layout still draws a correctly sized frame
      setFrameloop(paused ? 'demand' : 'always')
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [setFrameloop])
  return null
}

/** Built once for the startup tier: rebuilding the chain mid-scroll renders a raw frame (a flash). */
function Effects({ tier }: { tier: 'high' | 'low' }) {
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    const e = dof.current
    if (!e) return
    const c = stage.cam
    // long-lens look by default; macro shots open right up
    e.bokehScale = 0.6 + c.blur * 6
    e.target = focusPoint.set(c.fx, c.fy, c.fz)
  })
  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 0} enableNormalPass={false}>
      {/* contact occlusion only: a wide radius paints game-y halos round everything.
          Integrated graphics skip it: it is the costliest pass, and the contact shadows carry the look */}
      {tier === 'high' ? <N8AO aoRadius={0.18} intensity={1.3} distanceFalloff={0.4} quality="medium" /> : <></>}
      <SanitizePass />
      {tier === 'high' ? <DepthOfField ref={dof} worldFocusRange={0.7} bokehScale={2} resolutionScale={0.5} /> : <></>}
      {/* the bokeh blur itself emits NaN at the frame edge now and then (traced per pass): scrub
          again before bloom, whose mip chain would spread it into a black block for a frame */}
      {tier === 'high' ? <SanitizePass /> : <></>}
      {/* only true highlights bloom: battens, chrome streaks, the sleeve catching the key */}
      <Bloom mipmapBlur luminanceThreshold={1.5} luminanceSmoothing={0.3} intensity={0.45} radius={0.7} />
      {/* ACES keeps the blacks black and the speculars hot; AgX flattened the set to grey */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.42} darkness={0.38} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} />
    </EffectComposer>
  )
}

/** The set: kit laid out on a rubber floor the way a strength coach would leave it. */
function Set() {
  const { bells, dumbbells, stacks } = STATIONS
  return (
    <>
      <Platform />
      <Machines />
      {/* the hero kit keeps its shadows but draws merged, one call per material; one batch per
          station, so the stations out of shot are still culled */}
      <StaticBatch>
        <Barbell position-y={PLATE_R + PLATFORM_H} />
      </StaticBatch>
      <StaticBatch position={bells}>
        {/* front bell turned so its weight faces the conditioning shot; the others set down any old way */}
        <Kettlebell rotation-y={0.9} />
        <Kettlebell position={[-0.34, 0, 0.12]} rotation-y={0.25} />
        <Kettlebell position={[-0.12, 0, -0.38]} rotation-y={2.5} />
      </StaticBatch>
      <StaticBatch position={dumbbells}>
        <Dumbbell position={[0, 0, 0.13]} rotation-y={0.12} />
        <Dumbbell position={[0.03, 0, -0.16]} rotation-y={-0.06} />
      </StaticBatch>
      <StaticBatch position={stacks}>
        <PlateStack count={1} position={[-0.55, 0, 0.08]} />
        <PlateStack count={2} position={[0, 0, -0.04]} />
        <PlateStack count={3} position={[0.55, 0, 0.06]} />
      </StaticBatch>

      {/* outside the batch: each renders its own depth pass once, from under the floor */}
      <ContactShadows position-y={PLATFORM_H + 0.002} scale={3.2} blur={2.4} far={0.5} opacity={0.75} resolution={512} frames={1} color="#000000" />
      <ContactShadows position={[bells.x, 0.002, bells.z]} scale={1.6} blur={2} far={0.35} opacity={0.8} resolution={256} frames={1} color="#000000" />
      <ContactShadows position={[dumbbells.x, 0.002, dumbbells.z]} scale={1.4} blur={2} far={0.25} opacity={0.8} resolution={256} frames={1} color="#000000" />
      <ContactShadows position={[stacks.x, 0.002, stacks.z]} scale={2} blur={2} far={0.3} opacity={0.8} resolution={256} frames={1} color="#000000" />
    </>
  )
}

/**
 * If the set can't hold a scrollable frame rate (a weak GPU the startup check missed), hand the
 * page to the photographs rather than stutter through it. Measured only once the loader is
 * gone and only while frames are actually being drawn.
 */
function FrameWatch() {
  const w = useRef({ warm: 0, time: 0, frames: 0, bad: 0 })
  useFrame((_, delta) => {
    const s = w.current
    // the first frame back from a paused loop or a hidden tab isn't the GPU's fault
    if (!stage.ready || delta > 1) return
    // warm-up: late shader compiles and the intro move are allowed to be slow
    if (s.warm < WARMUP) {
      s.warm += delta
      return
    }
    s.time += delta
    s.frames++
    if (s.time < SAMPLE) return
    s.bad = s.frames / s.time < MIN_FPS ? s.bad + 1 : 0
    s.time = s.frames = 0
    // three slow samples in a row, not one bad moment
    if (s.bad >= 3) stageStruggling()
  })
  return null
}
const WARMUP = 3
const SAMPLE = 2
const MIN_FPS = 22

/** One persistent canvas behind the whole page. */
export default function Stage() {
  const tier = initialTier
  // fixed for the session: a dpr change resizes every render target mid-scroll, a full-frame flash.
  // Laptops on integrated graphics draw at 1:1; phones keep a little extra for their dense screens
  const dpr = tier === 'high' ? 1.5 : isCoarsePointer ? 1.25 : 1

  useEffect(() => {
    if (isCoarsePointer || prefersReducedMotion) return
    const onMove = (e: PointerEvent) => {
      stage.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      stage.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const c = stage.cam
  return (
    <Canvas
      className="stage-canvas"
      shadows
      dpr={dpr}
      gl={{
        antialias: false,
        toneMapping: NoToneMapping,
        powerPreference: 'high-performance',
        stencil: false,
        // dev frame grabs need the buffer kept after compositing
        preserveDrawingBuffer: import.meta.env.DEV,
      }}
      camera={{ fov: 22, near: 0.05, far: 40, position: [c.px, c.py, c.pz] }}
      aria-hidden
    >
      {/* a little lifted from black: gym air, not a void */}
      <color attach="background" args={['#100f0e']} />
      <fog attach="fog" args={['#100f0e', 4.5, 15]} />
      {/* PCSS: contact-hardening shadows, the way a real overhead source falls off */}
      {/* fixed at startup: toggling it later recompiles every shadowed material mid-scroll */}
      {initialTier === 'high' && <SoftShadows size={46} samples={14} focus={0.35} />}
      <Suspense fallback={null}>
        <Lighting shadowSize={tier === 'high' ? 2048 : 1024} lite={tier === 'low'} />
        <Set />
        <CameraRig parallax={!isCoarsePointer && !prefersReducedMotion} />
        <Effects tier={tier} />
        <Ready />
        <VeilPause />
        <FrameWatch />
      </Suspense>
    </Canvas>
  )
}
