import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Fog, MathUtils, Vector3 } from 'three'
import { stage } from './state'

const pos = new Vector3()
const target = new Vector3()
const smoothTarget = new Vector3()
const WORLD_UP = new Vector3(0, 1, 0)
const viewDir = new Vector3()

/**
 * Slider + jib camera. GSAP writes the shot into `stage.cam`; this rig follows it with
 * critically damped smoothing (so scroll jitter never reaches the lens) and adds a few
 * centimetres of pointer parallax — the drift of an operator's hand on a fluid head.
 */
export function CameraRig({ parallax }: { parallax: boolean }) {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const state = useRef({ x: 0, y: 0, init: false })

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = state.current
    const c = stage.cam
    const k = 1 - Math.exp(-dt * 2.2)
    s.x = MathUtils.lerp(s.x, parallax ? stage.pointer.x : 0, k)
    s.y = MathUtils.lerp(s.y, parallax ? stage.pointer.y : 0, k)

    // parallax scales with distance to subject: a hand drift, not an orbit
    pos.set(c.px, c.py, c.pz)
    target.set(c.tx, c.ty, c.tz)
    const dist = pos.distanceTo(target)
    pos.x += s.x * 0.018 * dist
    pos.y -= s.y * 0.009 * dist

    if (!s.init) {
      camera.position.copy(pos)
      smoothTarget.copy(target)
      s.init = true
    } else {
      const f = 1 - Math.exp(-dt * 5)
      camera.position.lerp(pos, f)
      smoothTarget.lerp(target, f)
    }
    // overhead: keep a stable up-vector, then roll around the view axis
    // only a near-vertical view needs the substitute up-vector
    const pitch = -viewDir.subVectors(smoothTarget, camera.position).normalize().y
    const overhead = MathUtils.smoothstep(pitch, 0.9, 0.985)
    camera.up
      .set(Math.sin(stage.camRoll), 0, -Math.cos(stage.camRoll))
      .lerp(WORLD_UP, 1 - overhead)
      .normalize()
    camera.lookAt(smoothTarget)

    const fog = scene.fog as Fog | null
    if (fog) {
      fog.near = c.fogNear
      fog.far = c.fogFar
    }
  })
  return null
}
