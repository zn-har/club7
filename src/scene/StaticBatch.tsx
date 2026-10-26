import type { ThreeElements } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { type BufferGeometry, type Group, type Material, Matrix4, Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Static kit, drawn as one mesh per material. The set is built the readable way, part by part
 * (a rack is twenty-odd steel sections), which costs a draw call per part — and another per
 * part in the shadow pass. Nothing in here ever moves, so once it has mounted the parts are
 * baked into merged geometry and the originals hidden.
 *
 * `shadows={false}` drops casting and receiving for everything inside: background kit sits
 * outside the key light's cone, where its shadow map work buys nothing on screen.
 */
export function StaticBatch({ shadows = true, children, ...props }: { shadows?: boolean } & ThreeElements['group']) {
  const ref = useRef<Group>(null)

  useLayoutEffect(() => {
    const root = ref.current!
    root.updateWorldMatrix(true, true)
    const toLocal = new Matrix4().copy(root.matrixWorld).invert()
    const buckets = new Map<string, { material: Material; cast: boolean; receive: boolean; parts: BufferGeometry[] }>()
    const sources: Mesh[] = []

    root.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material) || !mesh.visible) return
      const cast = shadows && mesh.castShadow
      const receive = shadows && mesh.receiveShadow
      const key = `${mesh.material.uuid}|${cast}|${receive}`
      let b = buckets.get(key)
      if (!b) buckets.set(key, (b = { material: mesh.material, cast, receive, parts: [] }))
      const g = mesh.geometry.clone()
      // only what every part has: drei and three geometries all carry position, normal and uv
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
      g.morphAttributes = {}
      g.clearGroups()
      g.applyMatrix4(new Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld))
      b.parts.push(g)
      sources.push(mesh)
    })

    const merged: Mesh[] = []
    for (const b of buckets.values()) {
      // indexed and non-indexed parts can't share a buffer: unroll the indexed ones
      const mixed = b.parts.some((g) => g.index) && b.parts.some((g) => !g.index)
      const parts = mixed ? b.parts.map((g) => (g.index ? g.toNonIndexed() : g)) : b.parts
      const geometry = mergeGeometries(parts)
      b.parts.forEach((g) => g.dispose())
      if (mixed) parts.forEach((g) => g.dispose())
      if (!geometry) continue
      const mesh = new Mesh(geometry, b.material)
      mesh.castShadow = b.cast
      mesh.receiveShadow = b.receive
      mesh.matrixAutoUpdate = false
      merged.push(mesh)
    }
    // only swap once every bucket merged: a failed merge leaves the parts drawing as before
    if (merged.length === buckets.size) {
      sources.forEach((m) => (m.visible = false))
      merged.forEach((m) => root.add(m))
    } else merged.forEach((m) => m.geometry.dispose())

    return () => {
      merged.forEach((m) => {
        root.remove(m)
        m.geometry.dispose()
      })
      sources.forEach((m) => (m.visible = true))
    }
  }, [shadows])

  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  )
}
