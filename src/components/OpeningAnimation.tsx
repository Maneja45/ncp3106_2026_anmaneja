
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import * as THREE from 'three'

type Props = {
  onComplete: () => void
}

type FlyingFood = {
  mesh: THREE.Group
  direction: THREE.Vector3
  spin: THREE.Vector3
}

const SAGE = 0x9fb99c
const CREAM = 0xfff9ec
const GLASS = 0xe8f5e9

function material(color: number, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
  })
}

function sphere(
  radius: number,
  color: number,
  width = 20,
  height = 14
) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, width, height),
    material(color)
  )
}

function box(
  width: number,
  height: number,
  depth: number,
  color: number
) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material(color)
  )
}

function makeFood(type: string) {
  const group = new THREE.Group()

  if (type === 'rice') {
    const mound = sphere(0.27, 0xfff6df)
    mound.scale.set(1.3, 0.65, 1)
    group.add(mound)

    for (let i = 0; i < 16; i++) {
      const grain = sphere(0.034, 0xffffff, 10, 8)
      const angle = i * 2.399
      const radius = Math.sqrt(i / 16) * 0.25

      grain.position.set(
        Math.cos(angle) * radius,
        0.12,
        Math.sin(angle) * radius
      )

      grain.scale.set(1.5, 0.5, 0.7)
      grain.rotation.y = angle
      group.add(grain)
    }
  }

  if (type === 'broccoli') {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.075, 0.25, 10),
      material(0x9ebc7d)
    )

    stem.position.y = -0.1
    group.add(stem)

    const positions = [
      [0, 0.12, 0],
      [-0.14, 0.08, 0],
      [0.14, 0.08, 0],
      [0, 0.08, 0.14],
      [0, 0.08, -0.14],
    ]

    positions.forEach(([x, y, z], i) => {
      const top = sphere(
        i === 0 ? 0.18 : 0.15,
        i % 2 ? 0x729b6a : 0x8bad7b
      )

      top.position.set(x, y, z)
      group.add(top)
    })
  }

  if (type === 'tomato') {
    const body = sphere(0.22, 0xe68b7c)
    group.add(body)

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.09, 5),
      material(0x739b6a)
    )

    crown.position.y = 0.22
    crown.rotation.z = Math.PI
    group.add(crown)
  }

  if (type === 'egg') {
    const white = sphere(0.28, 0xfffdf2)
    white.scale.set(1.25, 0.3, 1)
    group.add(white)

    const yolk = sphere(0.135, 0xf4c36e)
    yolk.scale.y = 0.7
    yolk.position.y = 0.09
    group.add(yolk)
  }

  if (type === 'carrot') {
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.47, 12),
      material(0xf0b17e)
    )

    body.rotation.z = Math.PI
    group.add(body)

    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.2, 6),
      material(0x8cad80)
    )

    leaf.position.y = 0.28
    group.add(leaf)
  }

  if (type === 'avocado') {
    const body = sphere(0.27, 0x8eac82)
    body.scale.set(0.85, 1.2, 0.55)
    group.add(body)

    const flesh = sphere(0.22, 0xdce6ae)
    flesh.scale.set(0.85, 1.2, 0.2)
    flesh.position.z = 0.13
    group.add(flesh)

    const seed = sphere(0.11, 0xb78a68)
    seed.position.set(0, -0.07, 0.19)
    group.add(seed)
  }

  if (type === 'salmon') {
    const body = box(
      0.5,
      0.16,
      0.28,
      0xf0a48f
    )

    group.add(body)

    for (let i = 0; i < 3; i++) {
      const stripe = box(
        0.035,
        0.012,
        0.25,
        0xffdfcf
      )

      stripe.position.set(
        -0.13 + i * 0.13,
        0.09,
        0
      )

      group.add(stripe)
    }
  }

  if (type === 'strawberry') {
    const body = sphere(0.21, 0xe98f8c)
    body.scale.set(0.85, 1.15, 0.85)
    group.add(body)

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.12, 5),
      material(0x7ca574)
    )

    crown.position.y = 0.25
    group.add(crown)
  }

  return group
}

function buildLunchbox() {
  const root = new THREE.Group()
  const body = new THREE.Group()

  root.add(body)

  // Solid flat base
  const base = box(
    3.7,
    0.25,
    2.75,
    CREAM
  )

  base.position.y = -0.72
  body.add(base)

  // Thin bottom trim
  const trim = box(
    3.72,
    0.08,
    2.77,
    SAGE
  )

  trim.position.y = -0.87
  body.add(trim)

  // Transparent walls
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: GLASS,
    transparent: true,
    opacity: 0.24,
    transmission: 0.65,
    roughness: 0.12,
    metalness: 0,
    thickness: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const wallData = [
    [3.55, 1.25, 0.06, 0, 0.02, 1.3],
    [3.55, 1.25, 0.06, 0, 0.02, -1.3],
    [0.06, 1.25, 2.55, -1.75, 0.02, 0],
    [0.06, 1.25, 2.55, 1.75, 0.02, 0],
  ]

  wallData.forEach(([w, h, d, x, y, z]) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      glassMaterial
    )

    wall.position.set(x, y, z)
    body.add(wall)
  })

  // Smooth sage top rim
  const rimPieces = [
    [3.65, 0.1, 0.1, 0, 0.69, -1.34],
    [3.65, 0.1, 0.1, 0, 0.69, 1.34],
    [0.1, 0.1, 2.65, -1.8, 0.69, 0],
    [0.1, 0.1, 2.65, 1.8, 0.69, 0],
  ]

  rimPieces.forEach(([w, h, d, x, y, z]) => {
    const piece = box(w, h, d, SAGE)
    piece.position.set(x, y, z)
    body.add(piece)
  })

  // Three compartments
  const trayPositions = [
    [-0.87, 0],
    [0.91, -0.65],
    [0.91, 0.65],
  ]

  trayPositions.forEach(([x, z], index) => {
    const tray = box(
      1.65,
      0.09,
      index === 0 ? 2.35 : 1.08,
      0xe7e9d9
    )

    tray.position.set(x, -0.4, z)
    body.add(tray)
  })

  // Food inside compartments
  const insideFood = [
    ['rice', -0.95, -0.65],
    ['egg', -0.85, 0.25],
    ['broccoli', -1.2, 0.83],
    ['salmon', 0.7, -0.7],
    ['tomato', 1.2, -0.65],
    ['broccoli', 0.7, 0.65],
    ['carrot', 1.2, 0.65],
  ] as const

  insideFood.forEach(([type, x, z]) => {
    const food = makeFood(type)

    food.position.set(x, -0.15, z)
    food.scale.setScalar(
      type === 'rice' ? 1.15 : 0.85
    )

    body.add(food)
  })

  // Hinged lid
  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, 0.7, -1.34)
  body.add(lidPivot)

  const lid = box(
    3.8,
    0.16,
    2.8,
    0xf8f5eb
  )

  lid.position.set(0, 0.08, 1.34)
  lidPivot.add(lid)

  const inset = box(
    3.22,
    0.025,
    2.2,
    0xdcead9
  )

  inset.position.set(0, 0.175, 1.34)
  lidPivot.add(inset)

  const border = box(
    3.58,
    0.035,
    2.6,
    0xb3c9ac
  )

  border.position.set(0, 0.155, 1.34)
  lidPivot.add(border)

  const clasp = box(
    0.42,
    0.16,
    0.12,
    0xd6c49f
  )

  clasp.position.set(0, 0.04, 2.72)
  lidPivot.add(clasp)

  return { root, body, lidPivot }
}

export default function OpeningAnimation({
  onComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showBrand, setShowBrand] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (reducedMotion) {
      const timer = window.setTimeout(onComplete, 500)
      return () => window.clearTimeout(timer)
    }

    let disposed = false
    let frameId = 0

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      35,
      1,
      0.1,
      100
    )

    camera.position.set(6, 4.5, 11)
    camera.lookAt(0, 0.4, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    )
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)

    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    container.appendChild(renderer.domElement)

    // Softer studio lighting
    const ambient = new THREE.AmbientLight(
      0xffffff,
      1.4
    )
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(
      0xfff7e6,
      2.5
    )
    keyLight.position.set(-4, 9, 8)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(
      0xdcefdc,
      1.2
    )
    fillLight.position.set(5, 5, -5)
    scene.add(fillLight)

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: 0xf1eee3,
        roughness: 0.95,
      })
    )

    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.5
    scene.add(floor)

    // Soft shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 48),
      new THREE.MeshBasicMaterial({
        color: 0x71836c,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    )

    shadow.rotation.x = -Math.PI / 2
    shadow.scale.set(1.35, 0.85, 1)
    shadow.position.y = -1.48
    scene.add(shadow)

    // Lunchbox
    const { root, body, lidPivot } = buildLunchbox()
    scene.add(root)

    // Floating food
    const flyingFoods: FlyingFood[] = []

    const foodTypes = [
      'broccoli',
      'egg',
      'tomato',
      'rice',
      'carrot',
      'avocado',
      'salmon',
      'strawberry',
      'broccoli',
      'tomato',
      'egg',
      'carrot',
      'avocado',
      'salmon',
      'rice',
      'strawberry',
      'broccoli',
      'egg',
      'tomato',
      'carrot',
    ]

    foodTypes.forEach((type, index) => {
      const food = makeFood(type)

      food.visible = false
      food.position.set(0, 0.5, 0)
      food.scale.setScalar(
        0.8 + (index % 3) * 0.13
      )

      scene.add(food)

      const angle =
        (index / foodTypes.length) * Math.PI * 2

      const speed =
        2.3 + (index % 5) * 0.35

      flyingFoods.push({
        mesh: food,
        direction: new THREE.Vector3(
          Math.cos(angle) * speed,
          3.4 + (index % 4) * 0.65,
          Math.sin(angle) * speed
        ),
        spin: new THREE.Vector3(
          0.9 + index * 0.04,
          1.2 + index * 0.06,
          0.7 + index * 0.03
        ),
      })
    })

    const resize = () => {
      if (!container.clientWidth || !container.clientHeight) {
        return
      }

      camera.aspect =
        container.clientWidth / container.clientHeight

      camera.updateProjectionMatrix()

      renderer.setSize(
        container.clientWidth,
        container.clientHeight,
        false
      )
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const start = performance.now()

    const animate = (now: number) => {
      if (disposed) return

      frameId = requestAnimationFrame(animate)

      const elapsed = (now - start) / 1000

      // Smooth fall and soft bounce
      if (elapsed < 1.2) {
        const t = elapsed / 1.2
        const eased = t * t * t

        root.position.y = 7 * (1 - eased)
        root.rotation.z = -0.12 * (1 - eased)
        root.scale.setScalar(1)
      } else if (elapsed < 1.75) {
        const t = (elapsed - 1.2) / 0.55

        root.position.y =
          Math.sin(t * Math.PI) * (1 - t) * 0.35

        root.rotation.z =
          Math.sin(t * Math.PI * 2) * 0.025

        const squash =
          Math.sin(t * Math.PI) * 0.045

        root.scale.set(
          1 + squash,
          1 - squash,
          1 + squash
        )
      } else {
        root.position.y = 0
        root.rotation.z = 0
        root.scale.setScalar(1)
      }

      // Natural lid opening
      if (elapsed > 1.85) {
        const t = Math.min(
          (elapsed - 1.85) / 0.9,
          1
        )

        const eased =
          1 - Math.pow(1 - t, 3)

        lidPivot.rotation.x =
          -eased * 1.85 +
          Math.sin(t * Math.PI) * 0.07
      }

      // Food burst and float
      if (elapsed > 2.45) {
        flyingFoods.forEach((item, index) => {
          const activationTime =
            2.45 + index * 0.035

          if (elapsed < activationTime) return

          item.mesh.visible = true

          const flightTime =
            elapsed - activationTime

          const spread = Math.min(
            flightTime / 1.25,
            1
          )

          const eased =
            1 - Math.pow(1 - spread, 4)

          item.mesh.position.set(
            item.direction.x * eased * 1.6,
            0.6 +
              item.direction.y * eased * 0.65,
            item.direction.z * eased * 1.1
          )

          item.mesh.rotation.x =
            item.spin.x * eased * 0.7

          item.mesh.rotation.y =
            item.spin.y * eased * 0.9

          item.mesh.rotation.z =
            item.spin.z * eased * 0.65
        })
      }

      // Smooth rightward rotation
      if (elapsed > 1.8) {
        const turnProgress = Math.min(
          Math.max((elapsed - 1.8) / 1.5, 0),
          1
        )

        const smoothTurn =
          turnProgress * turnProgress *
          (3 - 2 * turnProgress)

        body.rotation.y =
          -smoothTurn * 0.45
      }

      renderer.render(scene, camera)
    }

    frameId = requestAnimationFrame(animate)

    const brandTimer = window.setTimeout(() => {
      setShowBrand(true)
    }, 3400)

    const completeTimer = window.setTimeout(
      onComplete,
      6800
    )

    return () => {
      disposed = true

      cancelAnimationFrame(frameId)
      window.clearTimeout(brandTimer)
      window.clearTimeout(completeTimer)

      observer.disconnect()

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]

          materials.forEach((mat) => mat.dispose())
        }
      })

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
          'linear-gradient(135deg, #faf7ef 0%, #eef1e7 100%)',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Brand reveal */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={
          showBrand
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 35 }
        }
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '8%',
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
            fontSize: 'clamp(34px, 5vw, 74px)',
            fontWeight: 650,
            letterSpacing: '-0.055em',
            color: '#45634d',
          }}
        >
          SustansyaBox.
        </h1>

        <p
          style={{
            margin: '12px 0 25px',
            color: '#83967e',
            fontSize: 'clamp(13px, 1.4vw, 18px)',
          }}
        >
          Smart Nutrition for a Healthier You
        </p>

        <div
          style={{
            width: 'min(280px, 70vw)',
            height: 6,
            margin: '0 auto',
            background: '#dce6d6',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: showBrand ? '100%' : '0%',
            }}
            transition={{
              duration: 2.4,
              ease: 'easeInOut',
            }}
            style={{
              height: '100%',
              background: '#8eaa88',
              borderRadius: 99,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
