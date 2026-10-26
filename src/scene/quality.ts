import { MeshPhysicalMaterial, MeshStandardMaterial, type MeshPhysicalMaterialParameters } from 'three'
import { initialTier } from '../lib/env'

/** Integrated graphics and tablets: the same set, with the per-pixel extras taken out. */
export const LITE = initialTier === 'low'

// the layers MeshPhysicalMaterial adds over standard PBR, each an extra lobe per pixel
const PHYSICAL_ONLY = [
  'clearcoat', 'clearcoatRoughness', 'clearcoatMap', 'clearcoatNormalMap', 'clearcoatNormalScale', 'clearcoatRoughnessMap',
  'sheen', 'sheenColor', 'sheenRoughness', 'sheenColorMap', 'sheenRoughnessMap',
  'specularIntensity', 'specularColor', 'specularIntensityMap', 'specularColorMap',
  'ior', 'reflectivity', 'iridescence', 'anisotropy', 'transmission', 'thickness', 'dispersion',
] as const

/**
 * Clearcoat on the chrome, sheen on the rubber: physical on dedicated graphics, plain standard
 * PBR on the lite tier, where the extra lobes cost more than they show at that resolution.
 */
export function physical(params: MeshPhysicalMaterialParameters) {
  if (!LITE) return new MeshPhysicalMaterial(params)
  const rest: Record<string, unknown> = { ...params }
  for (const k of PHYSICAL_ONLY) delete rest[k]
  return new MeshStandardMaterial(rest)
}
