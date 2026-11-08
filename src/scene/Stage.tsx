import { ContactShadows, SoftShadows } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import {
  BlendFunction,
  Effect,
  EffectPass,
  NoiseEffect,
  SMAAEffect,
  SMAAPreset,
  ToneMappingMode,
  VignetteEffect,
  type DepthOfFieldEffect,
} from 'postprocessing'
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

/** Dev-only: the renderer, for profiling from the console (gl.info, timer queries). */
function DevHooks() {
  const three = useThree()
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__three = three
  }, [three])
  return null
}

/** Every rig channel the frame depends on: when none of them moves, the frame can't change. */
const RIG_KEYS = Object.keys(stage.cam) as (keyof typeof stage.cam)[]

/**
 * Draw a frame only when it would differ from the last one. The set is static; the picture
 * changes only when scroll moves the rig, the pointer drifts the lens, or the rig is still
 * easing into place (CameraRig asks for those frames itself). Parked on a shot, the GPU does
 * nothing and the browser keeps showing the last frame, so reading, hovering and scrolling
 * the type over the set cost no 3D work at all.
 *
 * While the sand pages fully cover the set nothing of it is visible, so nothing is drawn.
 *
 * Also watches the frame rate while drawing: if the set can't hold a scrollable rate (a weak
 * GPU the startup check missed), hand the page to the photographs rather than stutter through
 * it. Timed off the page's own animation frames, which slow down with a GPU-bound canvas.
 */
function RenderDriver() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const last = new Float64Array(RIG_KEYS.length + 2).fill(NaN)
    let veiled = false
    let drawing = false
    const watch = { warm: 0, time: 0, frames: 0, bad: 0 }

    const tick = (_time: number, deltaMs: number) => {
      const wasDrawing = drawing
      drawing = false
      const nowVeiled = stage.veil > 0.995
      const lifted = veiled && !nowVeiled
      veiled = nowVeiled
      if (veiled) return

      const c = stage.cam
      let changed = lifted
      const n = RIG_KEYS.length
      for (let i = 0; i <= n + 1; i++) {
        const v = i < n ? c[RIG_KEYS[i]] : i === n ? stage.pointer.x : stage.pointer.y
        if (v === last[i]) continue
        last[i] = v
        changed = true
      }
      if (changed) invalidate()
      drawing = changed || stage.settling

      // frame rate, only across runs of consecutive drawn frames: the first frame after a
      // pause, or after a hidden tab, measures the pause, not the GPU
      if (!stage.ready || !wasDrawing || !drawing || deltaMs > 250) return
      const dt = deltaMs / 1000
      if (watch.warm < WARMUP) {
        // late shader compiles and the intro move are allowed to be slow
        watch.warm += dt
        return
      }
      watch.time += dt
      watch.frames++
      if (watch.time < SAMPLE) return
      watch.bad = watch.frames / watch.time < MIN_FPS ? watch.bad + 1 : 0
      watch.time = watch.frames = 0
      // three slow samples in a row, not one bad moment
      if (watch.bad >= 3) stageStruggling()
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [invalidate])
  return null
}
// seconds of drawn frames
const WARMUP = 3
const SAMPLE = 2
const MIN_FPS = 22

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
    <EffectComposer
      ref={import.meta.env.DEV ? (c: unknown) => void ((window as unknown as Record<string, unknown>).__composer = c) : undefined}
      multisampling={tier === 'high' ? 4 : 0}
      enableNormalPass={false}
    >
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
      {tier === 'high' ? (
        <>
          <Vignette offset={VIGNETTE.offset} darkness={VIGNETTE.darkness} />
          <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={GRAIN} />
        </>
      ) : (
        <SmoothedFinish />
      )}
    </EffectComposer>
  )
}
const VIGNETTE = { offset: 0.42, darkness: 0.38 }
const GRAIN = 0.08

/**
 * The lite tier's finish: anti-aliasing, then vignette and grain. Without multisampling every
 * edge stair-steps and the platform's thin steel trim breaks into dashes. SMAA joins them up
 * for about half what 4× multisampling costs (measured), and multisampling's memory traffic is
 * exactly what integrated graphics are short of. It needs the tone-mapped
 * image (its edge detection is tuned for display values), so it starts its own pass after the
 * tone mapping, and goes before the grain so it doesn't smooth the grain away.
 */
function SmoothedFinish() {
  const camera = useThree((s) => s.camera)
  const pass = useMemo(() => {
    const noise = new NoiseEffect({ premultiply: true, blendFunction: BlendFunction.SOFT_LIGHT })
    noise.blendMode.opacity.value = GRAIN
    return new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.MEDIUM }), new VignetteEffect(VIGNETTE), noise)
  }, [camera])
  useEffect(() => () => pass.dispose(), [pass])
  return <primitive object={pass} />
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
 * Pixels drawn per frame, at most. Below the budget the set draws at the screen's own density,
 * so it is as sharp as the type over it (drawing under it and letting the browser upscale is
 * what made the low tier look soft and jagged). Above it — a 1440p or 4K panel — the ratio
 * comes down just enough to fit. Fill cost scales with pixels, not with the ratio.
 */
const PIXEL_BUDGET = { high: 1.5, low: 1.0 } // × a 1920 × 1080 frame

function pickDpr(tier: 'high' | 'low') {
  const native = window.devicePixelRatio || 1
  const css = window.innerWidth * window.innerHeight
  const fit = Math.sqrt((PIXEL_BUDGET[tier] * 1920 * 1080) / css)
  // never above 2: past that nobody can see the difference on a canvas this soft-lit
  return Math.max(1, Math.min(native, 2, fit))
}

/** One persistent canvas behind the whole page. */
export default function Stage() {
  const tier = initialTier
  // fixed for the session: a dpr change resizes every render target mid-scroll, a full-frame flash
  const dpr = useMemo(() => pickDpr(tier), [tier])

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
      frameloop="demand"
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
        <RenderDriver />
        {import.meta.env.DEV && <DevHooks />}
      </Suspense>
    </Canvas>
  )
}
