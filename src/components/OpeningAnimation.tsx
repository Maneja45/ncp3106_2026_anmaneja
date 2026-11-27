import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

type Props = {
  onComplete: () => void
}

type FlyingFood = {
  mesh: THREE.Group
  target: THREE.Vector3
  delay: number
  spin: THREE.Vector3
  size: number
}

// ==========================================
// SIZES (world units)
// ==========================================

const W = 3.6 // width  (x)
const D = 2.6 // depth  (z)
const H = 0.95 // height of the walls
const T = 0.12 // wall thickness
const BOTTOM = -0.8 // underside of the lunchbox
const TOP = BOTTOM + H // top edge of the walls
const FLOOR_Y = BOTTOM + 0.32 // inside floor (food sits here)
const DIVIDER_X = -0.15

// ==========================================
// MATERIALS
// ==========================================

// Soft-touch plastic with a light clear coat
function plastic(color: number, roughness = 0.42) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.55,
  })
}

// Matte food surface
function matte(color: number, roughness = 0.75, flatShading = false) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, flatShading, envMapIntensity: 0.5 })
}

// Shiny food surface (tomato skin, sauce, egg yolk)
function glossy(color: number, roughness = 0.28) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.7,
  })
}

function rounded(w: number, h: number, d: number, radius: number, mat: THREE.Material) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, radius), mat)
}

function ball(radius: number, mat: THREE.Material, detail = 32) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, detail, Math.round(detail * 0.7)), mat)
}

// Small repeatable "random" so the scene looks the same every time
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// ==========================================
// FOOD (each group sits on y = 0)
// ==========================================

function makeFood(type: string): THREE.Group {
  const group = new THREE.Group()

  if (type === 'rice') {
    const mound = ball(0.34, matte(0xf3eee0, 0.85))
    mound.scale.set(1.3, 0.7, 1)
    mound.position.y = 0.08
    group.add(mound)

    const grainGeo = new THREE.CapsuleGeometry(0.02, 0.05, 4, 8)
    const grainMat = matte(0xfffdf8, 0.5)

    for (let i = 0; i < 140; i++) {
      const theta = seeded(i + 1) * Math.PI * 2
      const phi = Math.sqrt(seeded(i + 50)) * (Math.PI / 2) * 0.95
      const grain = new THREE.Mesh(grainGeo, grainMat)

      grain.position.set(
        Math.cos(theta) * Math.sin(phi) * 0.34 * 1.3,
        0.08 + Math.cos(phi) * 0.34 * 0.7,
        Math.sin(theta) * Math.sin(phi) * 0.34
      )
      grain.rotation.set(seeded(i + 7) * Math.PI, seeded(i + 9) * Math.PI, seeded(i + 11) * Math.PI)
      group.add(grain)
    }
  }

  if (type === 'egg') {
    const whiteMat = matte(0xfffdf6, 0.5)

    const white = ball(0.3, whiteMat)
    white.scale.set(1.12, 0.12, 1)
    white.position.y = 0.035
    group.add(white)

    // Wavy edge
    ;[
      [0.2, 0.12],
      [-0.18, -0.14],
      [0.05, -0.22],
    ].forEach(([x, z]) => {
      const blob = ball(0.16, whiteMat, 20)
      blob.scale.set(1, 0.18, 1)
      blob.position.set(x, 0.03, z)
      group.add(blob)
    })

    const yolk = ball(0.12, glossy(0xf2a93b, 0.2))
    yolk.scale.y = 0.72
    yolk.position.set(0.03, 0.08, 0.02)
    group.add(yolk)
  }

  if (type === 'broccoli') {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.07, 0.3, 14),
      matte(0xa9c38a, 0.7)
    )
    stem.position.y = 0.15
    group.add(stem)

    const floretGeo = new THREE.IcosahedronGeometry(0.085, 1)
    const dark = matte(0x58864a, 0.95, true)
    const light = matte(0x6e9c58, 0.95, true)

    for (let k = 0; k < 13; k++) {
      const angle = k * 2.399
      const r = 0.15 * Math.sqrt(k / 13)
      const floret = new THREE.Mesh(floretGeo, k % 2 ? dark : light)

      floret.position.set(Math.cos(angle) * r, 0.36 - r * 0.6, Math.sin(angle) * r)
      floret.scale.setScalar(0.9 + seeded(k + 3) * 0.3)
      group.add(floret)
    }
  }

  if (type === 'tomato') {
    const body = ball(0.15, glossy(0xd9483b, 0.22))
    body.scale.y = 0.9
    body.position.y = 0.135
    group.add(body)

    const leafMat = matte(0x5d8b47, 0.8)
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.008, 0.022), leafMat)
      const angle = (i / 5) * Math.PI * 2
      leaf.position.set(Math.cos(angle) * 0.04, 0.268, Math.sin(angle) * 0.04)
      leaf.rotation.y = -angle
      group.add(leaf)
    }

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 6), leafMat)
    stem.position.y = 0.29
    group.add(stem)
  }

  if (type === 'carrot') {
    const mat = matte(0xe8833a, 0.6)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.035, 0.46, 16), mat)
    body.rotation.z = Math.PI / 2
    body.position.y = 0.075
    group.add(body)

    const end = ball(0.075, mat, 16)
    end.scale.x = 0.5
    end.position.set(-0.23, 0.075, 0)
    group.add(end)
  }

  if (type === 'adobo') {
    const sauce = glossy(0x6e3f22, 0.35)
    const piece = rounded(0.38, 0.17, 0.27, 0.07, sauce)
    piece.position.y = 0.085
    group.add(piece)

    const top = rounded(0.24, 0.07, 0.17, 0.03, glossy(0x8a5631, 0.3))
    top.position.set(0.02, 0.18, -0.01)
    top.rotation.y = 0.2
    group.add(top)
  }

  if (type === 'salmon') {
    const body = rounded(0.5, 0.16, 0.28, 0.05, glossy(0xf08a6a, 0.45))
    body.position.y = 0.08
    group.add(body)

    const stripeMat = matte(0xffe2d4, 0.6)
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.01, 0.27), stripeMat)
      stripe.position.set(-0.17 + i * 0.11, 0.163, 0)
      stripe.rotation.y = 0.35
      group.add(stripe)
    }
  }

  if (type === 'strawberry') {
    const body = ball(0.15, glossy(0xd8353f, 0.3))
    body.scale.set(0.9, 1.15, 0.9)
    body.position.y = 0.17
    group.add(body)

    const leafMat = matte(0x5d8b47, 0.8)
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 4), leafMat)
      const angle = (i / 6) * Math.PI * 2
      leaf.position.set(Math.cos(angle) * 0.05, 0.33, Math.sin(angle) * 0.05)
      leaf.rotation.set(Math.sin(angle) * 1.2, 0, -Math.cos(angle) * 1.2)
      group.add(leaf)
    }
  }

  if (type === 'avocado') {
    const skin = ball(0.26, matte(0x3f5a2a, 0.65))
    skin.scale.set(0.85, 1.15, 0.5)
    skin.position.y = 0.3
    group.add(skin)

    const flesh = ball(0.22, matte(0xd9e3a0, 0.7))
    flesh.scale.set(0.85, 1.15, 0.18)
    flesh.position.set(0, 0.3, 0.09)
    group.add(flesh)

    const seed = ball(0.1, glossy(0x8a5a3a, 0.35))
    seed.position.set(0, 0.24, 0.12)
    group.add(seed)
  }

  return group
}

// ==========================================
// LUNCHBOX
// ==========================================

function buildLunchbox() {
  const root = new THREE.Group() // drop + bounce
  const body = new THREE.Group() // slow turn
  root.add(body)

  const shell = plastic(0x86aa80)
  const liner = plastic(0xebe5d3, 0.6)

  // Base and walls
  const base = rounded(W, 0.16, D, 0.07, shell)
  base.position.y = BOTTOM + 0.08
  body.add(base)

  ;[
    { w: W, d: T, x: 0, z: D / 2 - T / 2 },
    { w: W, d: T, x: 0, z: -(D / 2 - T / 2) },
    { w: T, d: D, x: W / 2 - T / 2, z: 0 },
    { w: T, d: D, x: -(W / 2 - T / 2), z: 0 },
  ].forEach(({ w, d, x, z }) => {
    const wall = rounded(w, H, d, 0.05, shell)
    wall.position.set(x, BOTTOM + H / 2, z)
    body.add(wall)
  })

  // Inside floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * T, 0.04, D - 2 * T), liner)
  floor.position.y = FLOOR_Y - 0.02
  body.add(floor)

  // Dividers: one long, one short (3 compartments)
  const dividerHeight = 0.52

  const longDivider = rounded(0.08, dividerHeight, D - 2 * T, 0.03, liner)
  longDivider.position.set(DIVIDER_X, FLOOR_Y + dividerHeight / 2, 0)
  body.add(longDivider)

  const innerRight = W / 2 - T
  const shortLength = innerRight - DIVIDER_X
  const shortDivider = rounded(shortLength, dividerHeight, 0.08, 0.03, liner)
  shortDivider.position.set(DIVIDER_X + shortLength / 2, FLOOR_Y + dividerHeight / 2, 0)
  body.add(shortDivider)

  // Food inside
  const leftX = (-(W / 2 - T) + DIVIDER_X) / 2
  const rightX = (DIVIDER_X + innerRight) / 2

  const inside: [string, number, number, number, number][] = [
    // type, x, z, scale, rotation
    ['rice', leftX, -0.42, 2.05, 0],
    ['egg', leftX + 0.04, 0.62, 1.55, 0.4],
    ['adobo', rightX - 0.48, -0.6, 1.45, 0.3],
    ['adobo', rightX + 0.02, -0.8, 1.35, -0.5],
    ['adobo', rightX + 0.48, -0.55, 1.4, 1.1],
    ['adobo', rightX - 0.05, -0.35, 1.25, 2.2],
    ['broccoli', rightX - 0.5, 0.55, 1.45, 0],
    ['broccoli', rightX - 0.15, 0.82, 1.25, 1],
    ['tomato', rightX + 0.3, 0.42, 1.35, 0],
    ['tomato', rightX + 0.6, 0.78, 1.25, 2],
    ['carrot', rightX + 0.2, 0.85, 1.2, 0.5],
  ]

  inside.forEach(([type, x, z, scale, rotation]) => {
    const food = makeFood(type)
    food.position.set(x, FLOOR_Y, z)
    food.scale.setScalar(scale)
    food.rotation.y = rotation
    body.add(food)
  })

  // Lid on a hinge at the back edge
  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, TOP, -D / 2)
  body.add(lidPivot)

  const lid = rounded(W + 0.06, 0.2, D + 0.06, 0.09, plastic(0x7c9f78, 0.38))
  lid.position.set(0, 0.1, D / 2)
  lidPivot.add(lid)

  const badge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.03, 48),
    plastic(0x9dbb98, 0.45)
  )
  badge.scale.x = 1.7
  badge.position.set(0, 0.21, D / 2)
  lidPivot.add(badge)

  const gasket = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.12, 0.02, D - 0.12),
    plastic(0xdfe8d8, 0.6)
  )
  gasket.position.set(0, -0.005, D / 2)
  lidPivot.add(gasket)

  const lidLiner = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.4, 0.02, D - 0.4),
    plastic(0xdde6d6, 0.6)
  )
  lidLiner.position.set(0, -0.02, D / 2)
  lidPivot.add(lidLiner)

  // Snap clips (front + sides)
  const clipMat = plastic(0xeee7d4, 0.45)

  const frontClip = rounded(0.75, 0.42, 0.07, 0.03, clipMat)
  frontClip.position.set(0, -0.12, D + 0.065)
  lidPivot.add(frontClip)

  ;[-1, 1].forEach((side) => {
    const clip = rounded(0.07, 0.42, 0.75, 0.03, clipMat)
    clip.position.set(side * (W / 2 + 0.065), -0.12, D / 2)
    lidPivot.add(clip)
  })

  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  return { root, body, lidPivot }
}

// Soft dark blob under the box (contact shadow)
function contactShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(40, 60, 40, 0.55)')
  gradient.addColorStop(0.6, 'rgba(40, 60, 40, 0.18)')
  gradient.addColorStop(1, 'rgba(40, 60, 40, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

// ==========================================
// EASING
// ==========================================

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInCubic = (t: number) => t * t * t
const easeInOut = (t: number) => t * t * (3 - 2 * t)
const easeOutBack = (t: number) => {
  const c = 1.4
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

// ==========================================
// COMPONENT
// ==========================================

export default function OpeningAnimation({ onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showBrand, setShowBrand] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      setShowBrand(true)
      const timer = window.setTimeout(onComplete, 1200)
      return () => window.clearTimeout(timer)
    }

    let disposed = false
    let frameId = 0

    // ---------- renderer ----------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'
    container.appendChild(renderer.domElement)

    // ---------- scene + soft studio reflections ----------
    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    const lookAt = new THREE.Vector3(0, 0.15, 0)

    // ---------- lights ----------
    scene.add(new THREE.HemisphereLight(0xfffdf5, 0xdfe6d6, 0.6))

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2)
    sun.position.set(-3.5, 9, 5)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -8
    sun.shadow.camera.right = 8
    sun.shadow.camera.top = 8
    sun.shadow.camera.bottom = -8
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 30
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.02
    sun.shadow.radius = 5
    scene.add(sun)

    const rim = new THREE.DirectionalLight(0xdcefdc, 0.8)
    rim.position.set(5, 4, -6)
    scene.add(rim)

    // ---------- ground (only shows shadows, so the page background stays seamless) ----------
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.12 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = BOTTOM
    ground.receiveShadow = true
    scene.add(ground)

    const blobTexture = contactShadowTexture()
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false })
    )
    blob.rotation.x = -Math.PI / 2
    blob.position.y = BOTTOM + 0.002
    scene.add(blob)

    // ---------- lunchbox ----------
    const { root, body, lidPivot } = buildLunchbox()
    scene.add(root)

    // ---------- food that pops out ----------
    const flying: FlyingFood[] = [
      // left side
      ['broccoli', -3.8, 1.7, -0.5, 1.6],
      ['tomato', -2.7, 2.9, -1.5, 1.7],
      ['salmon', -4.4, 0.5, 1.2, 1.4],
      ['egg', -2.3, 3.4, 0.7, 1.4],
      ['strawberry', -1.9, 0.5, 2.7, 1.5],
      // right side
      ['avocado', 4.0, 1.7, -0.2, 1.3],
      ['carrot', 3.2, 3.0, -1.6, 1.6],
      ['adobo', 3.0, 0.3, 2.0, 1.5],
      ['tomato', 4.5, 0.6, 1.3, 1.5],
      ['broccoli', 4.4, 2.8, 0.7, 1.3],
    ].map(([type, x, y, z, size], index) => {
      const mesh = makeFood(type as string)
      mesh.visible = false
      mesh.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true
      })
      scene.add(mesh)

      return {
        mesh,
        target: new THREE.Vector3(x as number, y as number, z as number),
        delay: index * 0.06,
        size: size as number,
        spin: new THREE.Vector3(
          0.6 + seeded(index + 1) * 0.8,
          0.8 + seeded(index + 2) * 1.2,
          0.4 + seeded(index + 3) * 0.6
        ),
      }
    })

    const start = new THREE.Vector3(0, TOP - 0.1, 0)

    // ---------- resize (camera moves back on narrow screens) ----------
    let cameraDistance = 1

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return

      camera.aspect = width / height
      cameraDistance = camera.aspect < 1.25 ? 1.25 / camera.aspect : 1
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    // ---------- animation ----------
    const startTime = performance.now()
    const from = new THREE.Vector3(8.6, 7.4, 14.8)
    const to = new THREE.Vector3(6.5, 5.5, 11.6)

    const animate = (now: number) => {
      if (disposed) return
      frameId = requestAnimationFrame(animate)

      const t = (now - startTime) / 1000

      // Camera glides in slowly
      const glide = easeOutCubic(clamp01(t / 3.6))
      camera.position.lerpVectors(from, to, glide).multiplyScalar(cameraDistance)
      camera.lookAt(lookAt)

      // 0 – 1.0s: drop  |  1.0 – 1.55s: small bounce
      if (t < 1) {
        const p = easeInCubic(clamp01(t / 1))
        root.position.y = 6 * (1 - p)
        root.rotation.z = -0.08 * (1 - p)
        root.scale.setScalar(1)
      } else if (t < 1.55) {
        const p = (t - 1) / 0.55
        root.position.y = Math.sin(p * Math.PI) * (1 - p) * 0.28
        root.rotation.z = Math.sin(p * Math.PI * 2) * 0.012
        const squash = Math.sin(p * Math.PI) * (1 - p) * 0.06
        root.scale.set(1 + squash, 1 - squash, 1 + squash)
      } else {
        root.position.y = 0
        root.rotation.z = 0
        root.scale.setScalar(1)
      }

      // Contact shadow grows as the box lands
      const height = Math.max(root.position.y, 0)
      const closeness = 1 - clamp01(height / 6)
      blob.scale.set(W * 1.55 * (0.6 + 0.4 * closeness), D * 1.7 * (0.6 + 0.4 * closeness), 1)
      ;(blob.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.75 * closeness

      // Slow turn so you can see inside
      body.rotation.y = 0.55 - easeInOut(clamp01(t / 5.5)) * 0.75

      // 1.7 – 2.6s: lid opens backward with a little settle
      const lidProgress = clamp01((t - 1.7) / 0.9)
      lidPivot.rotation.x = -1.95 * easeOutBack(lidProgress)

      // 2.3s+: food pops out, arcs, then floats
      flying.forEach((item, index) => {
        const local = t - 2.3 - item.delay
        if (local < 0) return

        item.mesh.visible = true
        const p = easeOutCubic(clamp01(local / 1.3))

        item.mesh.position.lerpVectors(start, item.target, p)
        item.mesh.position.y += Math.sin(p * Math.PI) * 1.1

        // gentle bobbing once it has arrived
        const settled = clamp01((local - 1.3) / 0.6)
        item.mesh.position.y += Math.sin(t * 1.6 + index) * 0.07 * settled

        item.mesh.scale.setScalar(item.size * (0.25 + 0.75 * p))
        item.mesh.rotation.set(
          item.spin.x * (p * 2 + local * 0.25),
          item.spin.y * (p * 2 + local * 0.3),
          item.spin.z * (p * 1.5 + local * 0.2)
        )
      })

      renderer.render(scene, camera)
    }

    frameId = requestAnimationFrame(animate)

    const brandTimer = window.setTimeout(() => setShowBrand(true), 3300)
    const completeTimer = window.setTimeout(onComplete, 6500)

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      window.clearTimeout(brandTimer)
      window.clearTimeout(completeTimer)
      observer.disconnect()

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((mat) => mat.dispose())
        }
      })

      blobTexture.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 50% 38%, #fbfaf3 0%, #f3f2e8 45%, #e4ebdc 100%)',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Skip */}
      <button
        type="button"
        onClick={onComplete}
        style={{
          position: 'absolute',
          top: 22,
          right: 24,
          zIndex: 2,
          padding: '8px 16px',
          border: '1px solid rgba(69, 99, 77, 0.25)',
          borderRadius: 99,
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          color: '#45634d',
          font: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Skip
      </button>

      {/* Brand reveal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={showBrand ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          bottom: '6%',
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
          padding: '0 20px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(36px, 5vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            color: '#3f5f47',
            textShadow: '0 2px 24px rgba(255, 255, 255, 0.9)',
          }}
        >
          SustansyaBox.
        </h1>

        <p
          style={{
            margin: '10px 0 22px',
            color: '#6f8673',
            fontSize: 'clamp(13px, 1.3vw, 17px)',
          }}
        >
          Smart Nutrition for a Healthier You
        </p>

        <div
          style={{
            width: 'min(240px, 60vw)',
            height: 4,
            margin: '0 auto',
            background: 'rgba(69, 99, 77, 0.14)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: showBrand ? '100%' : '0%' }}
            transition={{ duration: 2.9, ease: 'easeInOut' }}
            style={{ height: '100%', background: '#6f9470', borderRadius: 99 }}
          />
        </div>

        <p
          style={{
            margin: '10px 0 0',
            color: '#8a9a8c',
            fontSize: 12,
            letterSpacing: '0.04em',
          }}
        >
          Preparing your lunchbox…
        </p>
      </motion.div>
    </motion.div>
  )
}