// Environment capabilities, resolved once at startup.

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 820

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return !!gl
  } catch {
    return false
  }
}

export const hasWebGL = typeof window !== 'undefined' && detectWebGL()

/**
 * Photo cards and membership tier cards. Off for now so the set carries the page; flip back
 * to true to restore them — the content is all still in the sections.
 */
export const SHOW_CARDS = false

/** Quality tier used to scale DPR, shadows and post. */
export const initialTier: 'high' | 'low' = isSmallScreen || isCoarsePointer ? 'low' : 'high'
