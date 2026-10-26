// Environment capabilities, resolved once at startup.

import { useSyncExternalStore } from 'react'

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 820

type Tier = 'high' | 'low' | 'none'

// no driver at all: the browser draws WebGL on the CPU
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i
// graphics built into the CPU: draws the set, but not with AO, depth of field and soft shadows
const INTEGRATED = /intel(?!.*\barc\b)|radeon(\(tm\))? (graphics|vega|r[4-7])|vega \d|mali|adreno|powervr|videocore/i

function detectGPU(): Tier {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return 'none'
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // the browser itself says this context would be slow: it is falling back to the CPU
    const probe = document.createElement('canvas')
    const caveat = { failIfMajorPerformanceCaveat: true }
    const fast = (probe.getContext('webgl2', caveat) || probe.getContext('webgl', caveat)) as WebGLRenderingContext | null
    fast?.getExtension('WEBGL_lose_context')?.loseContext()
    if (!fast || SOFTWARE.test(renderer)) return 'none'
    const nav = navigator as Navigator & { deviceMemory?: number }
    const weakHost = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
    if (INTEGRATED.test(renderer) || weakHost || isSmallScreen || isCoarsePointer) return 'low'
    return 'high'
  } catch {
    return 'none'
  }
}

const TIERS: Tier[] = ['high', 'low', 'none']
const TIER_KEY = 'c7-stage-tier'

/** A tier this browser has already stepped down to on an earlier visit (see stageStruggling). */
function rememberedTier(): Tier | null {
  try {
    const t = localStorage.getItem(TIER_KEY) as Tier | null
    return t && TIERS.includes(t) ? t : null
  } catch {
    return null
  }
}

function lowerOf(a: Tier, b: Tier | null): Tier {
  return b && TIERS.indexOf(b) > TIERS.indexOf(a) ? b : a
}

// phones get the photographs: the set costs battery and data for a frame they barely see
const gpuTier: Tier =
  typeof window === 'undefined' || isSmallScreen ? 'none' : lowerOf(detectGPU(), rememberedTier())

/** The 3D set runs at all; without it the hero and finale fall back to photographs. */
export const hasWebGL = gpuTier !== 'none'

/** Quality tier used to scale DPR, shadows and post. */
export const initialTier: 'high' | 'low' = gpuTier === 'high' ? 'high' : 'low'

/*
 * The set can still be switched off after startup, if the frame rate stays too low to scroll
 * smoothly. The photographs take its place for the rest of the visit.
 */
let stageOn = hasWebGL
const listeners = new Set<() => void>()

export function stageStruggling() {
  if (!stageOn) return
  stageOn = false
  // next visit starts one tier down instead of finding out the hard way again
  try {
    localStorage.setItem(TIER_KEY, initialTier === 'high' ? 'low' : 'none')
  } catch {
    /* storage blocked: decide again next time */
  }
  // never leave the loader waiting on a set that is gone
  window.dispatchEvent(new Event('stage:ready'))
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStageOn() {
  return useSyncExternalStore(subscribe, () => stageOn, () => stageOn)
}

/**
 * Photo cards and membership tier cards. Off for now so the set carries the page; flip back
 * to true to restore them — the content is all still in the sections.
 */
export const SHOW_CARDS = false
