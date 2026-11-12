import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const TABLE_SIZE = 720
const SHAPE_TABLES = {}

function createUnitHeartShape() {
  const shape = new THREE.Shape()
  const s = 1 / 18.5
  shape.moveTo(0, s * 6.5)
  shape.bezierCurveTo(0, s * 10.5, -s * 5.5, s * 15.5, -s * 11, s * 15.5)
  shape.bezierCurveTo(-s * 19, s * 15.5, -s * 19, s * 4.5, -s * 19, s * 4.5)
  shape.bezierCurveTo(-s * 19, -s * 3.5, -s * 10.5, -s * 11, 0, -s * 17.5)
  shape.bezierCurveTo(s * 10.5, -s * 11, s * 19, -s * 3.5, s * 19, s * 4.5)
  shape.bezierCurveTo(s * 19, s * 4.5, s * 19, s * 15.5, s * 11, s * 15.5)
  shape.bezierCurveTo(s * 5.5, s * 15.5, 0, s * 10.5, 0, s * 6.5)
  return shape
}

function buildShapeLookupTable(shape) {
  if (SHAPE_TABLES[shape]) return SHAPE_TABLES[shape]

  const rawPoints = []
  const rawCount = 1440

  if (shape === 'heart') {
    const heartShape = createUnitHeartShape()
    const pts2d = heartShape.getSpacedPoints(rawCount)
    const yShift = 1.0 / 18.5
    for (let i = 0; i < rawCount; i++) {
      const p = pts2d[i]
      rawPoints.push({
        x: p.x,
        z: -(p.y + yShift),
      })
    }
  } else {
    for (let i = 0; i < rawCount; i++) {
      const a = (i / rawCount) * Math.PI * 2
      if (shape === 'square') {
        const half = 0.86
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        const maxAxis = Math.max(Math.abs(cos), Math.abs(sin)) || 1
        const lp = Math.pow(Math.pow(Math.abs(cos), 8) + Math.pow(Math.abs(sin), 8), 1 / 8) || 1
        const denom = maxAxis * 0.78 + lp * 0.22
        rawPoints.push({
          x: (cos / denom) * half,
          z: (sin / denom) * half,
        })
      } else if (shape === 'hexagon') {
        const sector = Math.PI / 3
        const localAngle = ((a % sector) + sector) % sector
        const r = Math.cos(Math.PI / 6) / Math.cos(localAngle - Math.PI / 6)
        rawPoints.push({
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
        })
      } else {
        rawPoints.push({
          x: Math.cos(a),
          z: Math.sin(a),
        })
      }
    }
  }

  // Ensure consistent winding direction matching (cos(a), sin(a)) where signedArea > 0
  let signedArea = 0
  for (let i = 0; i < rawPoints.length; i++) {
    const p0 = rawPoints[i]
    const p1 = rawPoints[(i + 1) % rawPoints.length]
    signedArea += p0.x * p1.z - p0.z * p1.x
  }
  if (signedArea < 0) {
    rawPoints.reverse()
  }

  // Resample to TABLE_SIZE points at equal arc-length intervals
  const cumLen = new Float64Array(rawPoints.length + 1)
  for (let i = 0; i < rawPoints.length; i++) {
    const p0 = rawPoints[i]
    const p1 = rawPoints[(i + 1) % rawPoints.length]
    cumLen[i + 1] = cumLen[i] + Math.hypot(p1.x - p0.x, p1.z - p0.z)
  }
  const totalLen = cumLen[rawPoints.length] || 1

  let spaced = []
  let cursor = 0
  for (let k = 0; k < TABLE_SIZE; k++) {
    const target = (k / TABLE_SIZE) * totalLen
    while (cursor < rawPoints.length - 1 && cumLen[cursor + 1] < target) {
      cursor++
    }
    const segLen = cumLen[cursor + 1] - cumLen[cursor] || 1
    const t = Math.max(0, Math.min(1, (target - cumLen[cursor]) / segLen))
    const p0 = rawPoints[cursor]
    const p1 = rawPoints[(cursor + 1) % rawPoints.length]
    spaced.push({
      x: p0.x + (p1.x - p0.x) * t,
      z: p0.z + (p1.z - p0.z) * t,
    })
  }

  // Gently smooth corners on heart / hexagon / square so frosting, drips & pearls wrap organically
  const smoothPasses = shape === 'heart' ? 4 : shape === 'hexagon' ? 3 : shape === 'square' ? 2 : 0
  for (let pass = 0; pass < smoothPasses; pass++) {
    const next = []
    for (let i = 0; i < TABLE_SIZE; i++) {
      const prevPt = spaced[(i - 1 + TABLE_SIZE) % TABLE_SIZE]
      const currPt = spaced[i]
      const nextPt = spaced[(i + 1) % TABLE_SIZE]
      next.push({
        x: prevPt.x * 0.22 + currPt.x * 0.56 + nextPt.x * 0.22,
        z: prevPt.z * 0.22 + currPt.z * 0.56 + nextPt.z * 0.22,
      })
    }
    spaced = next
  }

  // Align index 0 to angle = 0 (+X axis, z ≈ 0, x > 0) so all shapes share the exact same angular start
  let startIdx = 0
  let bestScore = Infinity
  for (let i = 0; i < TABLE_SIZE; i++) {
    if (spaced[i].x > 0) {
      const score = Math.abs(spaced[i].z)
      if (score < bestScore) {
        bestScore = score
        startIdx = i
      }
    }
  }
  const aligned = []
  for (let i = 0; i < TABLE_SIZE; i++) {
    aligned.push(spaced[(startIdx + i) % TABLE_SIZE])
  }

  // Compute outward unit normal (nx, nz) at every sample
  const table = aligned.map((pt, i) => {
    const prev = aligned[(i - 2 + TABLE_SIZE) % TABLE_SIZE]
    const next = aligned[(i + 2) % TABLE_SIZE]
    const tx = next.x - prev.x
    const tz = next.z - prev.z
    const len = Math.hypot(tx, tz) || 1
    let nx = -tz / len
    let nz = tx / len
    if (nx * pt.x + nz * pt.z < 0) {
      nx = -nx
      nz = -nz
    }
    return { x: pt.x, z: pt.z, nx, nz }
  })

  SHAPE_TABLES[shape] = table
  return table
}

function getShapePerimeterPoint(shape, radius, angle, normalOffset = 0) {
  const table = buildShapeLookupTable(shape)
  const twoPi = Math.PI * 2
  const normAngle = ((angle % twoPi) + twoPi) % twoPi
  const exactIdx = (normAngle / twoPi) * TABLE_SIZE
  const idx0 = Math.floor(exactIdx) % TABLE_SIZE
  const idx1 = (idx0 + 1) % TABLE_SIZE
  const frac = exactIdx - Math.floor(exactIdx)

  const p0 = table[idx0]
  const p1 = table[idx1]
  const ux = p0.x + (p1.x - p0.x) * frac
  const uz = p0.z + (p1.z - p0.z) * frac
  const nLen = Math.hypot(p0.nx + (p1.nx - p0.nx) * frac, p0.nz + (p1.nz - p0.nz) * frac) || 1
  const nx = (p0.nx + (p1.nx - p0.nx) * frac) / nLen
  const nz = (p0.nz + (p1.nz - p0.nz) * frac) / nLen

  return {
    x: ux * radius + nx * normalOffset,
    z: uz * radius + nz * normalOffset,
    nx,
    nz,
  }
}

// Unified 3D Prism Geometry generator so Round, Heart, Hexagon, and Square share 100% identical perimeter coordinates & UV bands
function createCustomShapePrismGeometry(shape, topRadius, bottomRadius, height, thetaLength = Math.PI * 2) {
  const segments = 180
  const halfH = height / 2
  const positions = []
  const normals = []
  const uvs = []

  // Group 0: Side wall (segments * 6 vertices)
  for (let i = 0; i < segments; i++) {
    const u0 = i / segments
    const u1 = (i + 1) / segments
    const a0 = u0 * thetaLength
    const a1 = u1 * thetaLength

    const top0 = getShapePerimeterPoint(shape, topRadius, a0)
    const top1 = getShapePerimeterPoint(shape, topRadius, a1)
    const bot0 = getShapePerimeterPoint(shape, bottomRadius, a0)
    const bot1 = getShapePerimeterPoint(shape, bottomRadius, a1)

    // Triangle 1: top0 -> top1 -> bot0
    positions.push(
      top0.x, halfH, top0.z,
      top1.x, halfH, top1.z,
      bot0.x, -halfH, bot0.z,
    )
    normals.push(
      top0.nx, 0, top0.nz,
      top1.nx, 0, top1.nz,
      bot0.nx, 0, bot0.nz,
    )
    uvs.push(
      u0, 1,
      u1, 1,
      u0, 0,
    )

    // Triangle 2: bot0 -> top1 -> bot1
    positions.push(
      bot0.x, -halfH, bot0.z,
      top1.x, halfH, top1.z,
      bot1.x, -halfH, bot1.z,
    )
    normals.push(
      bot0.nx, 0, bot0.nz,
      top1.nx, 0, top1.nz,
      bot1.nx, 0, bot1.nz,
    )
    uvs.push(
      u0, 0,
      u1, 1,
      u1, 0,
    )
  }

  const wallVertexCount = segments * 6

  // Group 1: Top & Bottom Caps (segments * 6 vertices)
  for (let i = 0; i < segments; i++) {
    const u0 = i / segments
    const u1 = (i + 1) / segments
    const a0 = u0 * thetaLength
    const a1 = u1 * thetaLength

    const top0 = getShapePerimeterPoint(shape, topRadius, a0)
    const top1 = getShapePerimeterPoint(shape, topRadius, a1)
    const bot0 = getShapePerimeterPoint(shape, bottomRadius, a0)
    const bot1 = getShapePerimeterPoint(shape, bottomRadius, a1)

    // Top Cap Triangle: center -> top1 -> top0
    positions.push(
      0, halfH, 0,
      top1.x, halfH, top1.z,
      top0.x, halfH, top0.z,
    )
    normals.push(
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    )
    uvs.push(
      0.5, 0.5,
      0.5 + top1.x / (topRadius * 2.2), 0.5 + top1.z / (topRadius * 2.2),
      0.5 + top0.x / (topRadius * 2.2), 0.5 + top0.z / (topRadius * 2.2),
    )

    // Bottom Cap Triangle: center -> bot0 -> bot1
    positions.push(
      0, -halfH, 0,
      bot0.x, -halfH, bot0.z,
      bot1.x, -halfH, bot1.z,
    )
    normals.push(
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
    )
    uvs.push(
      0.5, 0.5,
      0.5 + bot0.x / (bottomRadius * 2.2), 0.5 + bot0.z / (bottomRadius * 2.2),
      0.5 + bot1.x / (bottomRadius * 2.2), 0.5 + bot1.z / (bottomRadius * 2.2),
    )
  }

  const capVertexCount = segments * 6

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.addGroup(0, wallVertexCount, 0)
  geo.addGroup(wallVertexCount, capVertexCount, 1)
  return geo
}

// Unified 3D Puffy Frosting Blanket Geometry (Marshmallow Scalloped Drape as in Reference Images 1, 2, 3)
function createPuffyFrostingBlanketGeometry(shape, radius, tierHeight, tierIndex, thetaLength = Math.PI * 2) {
  const segments = 240
  const numLobes = tierIndex === 0 ? 8 : 6
  const positions = []
  const normals = []
  const uvs = []

  const rings = []
  const ringCount = 6

  for (let s = 0; s <= segments; s++) {
    const u = s / segments
    const angle = u * thetaLength

    // Scalloped wave formula: smooth rounded U-shaped lobes with organic height variation
    const wave = 0.5 - 0.5 * Math.cos(angle * numLobes)
    const uLobe = Math.pow(wave, 0.74)
    const variance = 0.82 + 0.18 * Math.sin(angle * 2 + tierIndex * 1.6)
    const minHang = tierHeight * 0.12
    const maxHang = tierHeight * (tierIndex === 0 ? 0.54 : 0.46)
    const dripDepth = minHang + (maxHang - minHang) * uLobe * variance

    // 6 profile rings from inner top cap down to rounded bottom lobe bead
    const r0 = getShapePerimeterPoint(shape, radius * 0.85, angle, 0)
    const r1 = getShapePerimeterPoint(shape, radius * 0.98, angle, 0.012)
    const r2 = getShapePerimeterPoint(shape, radius, angle, 0.038)
    const r3 = getShapePerimeterPoint(shape, radius, angle, 0.046)
    const r4 = getShapePerimeterPoint(shape, radius, angle, 0.036)
    const r5 = getShapePerimeterPoint(shape, radius, angle, 0.008)

    rings.push([
      { x: r0.x, y: tierHeight + 0.02, z: r0.z },
      { x: r1.x, y: tierHeight + 0.018, z: r1.z },
      { x: r2.x, y: tierHeight + 0.006, z: r2.z },
      { x: r3.x, y: tierHeight - dripDepth * 0.52, z: r3.z },
      { x: r4.x, y: tierHeight - dripDepth, z: r4.z },
      { x: r5.x, y: tierHeight - dripDepth + 0.018, z: r5.z },
    ])
  }

  // Triangulate center top cap
  const topY = tierHeight + 0.02
  for (let s = 0; s < segments; s++) {
    const p0 = rings[s][0]
    const p1 = rings[s + 1][0]
    positions.push(
      0, topY, 0,
      p1.x, p1.y, p1.z,
      p0.x, p0.y, p0.z,
    )
    uvs.push(
      0.5, 0.5,
      0.5 + p1.x / (radius * 2.2), 0.5 + p1.z / (radius * 2.2),
      0.5 + p0.x / (radius * 2.2), 0.5 + p0.z / (radius * 2.2),
    )
  }

  // Triangulate the 5 quad rings along the scalloped draped curtain
  for (let r = 0; r < ringCount - 1; r++) {
    for (let s = 0; s < segments; s++) {
      const a = rings[s][r]
      const b = rings[s + 1][r]
      const c = rings[s + 1][r + 1]
      const d = rings[s][r + 1]

      // Triangle 1: a -> b -> d
      positions.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        d.x, d.y, d.z,
      )
      uvs.push(
        s / segments, r / ringCount,
        (s + 1) / segments, r / ringCount,
        s / segments, (r + 1) / ringCount,
      )

      // Triangle 2: b -> c -> d
      positions.push(
        b.x, b.y, b.z,
        c.x, c.y, c.z,
        d.x, d.y, d.z,
      )
      uvs.push(
        (s + 1) / segments, r / ringCount,
        (s + 1) / segments, (r + 1) / ringCount,
        s / segments, (r + 1) / ringCount,
      )
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.computeVertexNormals()
  return geo
}

// Fluted Swirled Whipped Cream Rosette / Meringue Kiss Geometry (Matching Image 2 & Image 3!)
function createWhippedCreamRosetteGeometry(baseRadius = 0.088, height = 0.125, flutes = 7) {
  const vSteps = 14
  const hSteps = 28
  const positions = []
  const uvs = []
  const indices = []

  for (let j = 0; j <= vSteps; j++) {
    const v = j / vSteps
    const y = v * height
    const bell = Math.sin((1 - v) * Math.PI * 0.5)
    const rBase = baseRadius * Math.pow(bell, 0.78)
    const twist = v * 2.7
    const xCurl = Math.pow(v, 3.2) * 0.032
    const zCurl = Math.pow(v, 3.2) * 0.018

    for (let i = 0; i <= hSteps; i++) {
      const u = (i / hSteps) * Math.PI * 2
      const fluteMod = 1 + 0.28 * Math.cos(flutes * u + twist)
      const r = rBase * fluteMod
      const x = Math.cos(u) * r + xCurl
      const z = Math.sin(u) * r + zCurl
      positions.push(x, y, z)
      uvs.push(i / hSteps, v)
    }
  }

  for (let j = 0; j < vSteps; j++) {
    for (let i = 0; i < hSteps; i++) {
      const a = j * (hSteps + 1) + i
      const b = (j + 1) * (hSteps + 1) + i
      const c = (j + 1) * (hSteps + 1) + (i + 1)
      const d = j * (hSteps + 1) + (i + 1)
      indices.push(a, b, d)
      indices.push(d, b, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// Pastel Ceramic Cake Plate Geometry with smooth raised curved rim (Like Reference Image 1)
function createCeramicPlateGeometry(radius = 2.15, height = 0.16) {
  const segments = 64
  const profileSteps = 7
  const rProfile = [
    { r: 0, y: 0 },
    { r: radius * 0.65, y: 0.005 },
    { r: radius * 0.85, y: 0.03 },
    { r: radius * 0.98, y: height * 0.85 },
    { r: radius, y: height },
    { r: radius * 1.02, y: height * 0.88 },
    { r: radius * 0.96, y: -0.04 },
  ]

  const positions = []
  const uvs = []
  const indices = []

  for (let j = 0; j < profileSteps; j++) {
    const pt = rProfile[j]
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      positions.push(Math.cos(a) * pt.r, pt.y, Math.sin(a) * pt.r)
      uvs.push(i / segments, j / (profileSteps - 1))
    }
  }

  for (let j = 0; j < profileSteps - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i
      const b = (j + 1) * (segments + 1) + i
      const c = (j + 1) * (segments + 1) + (i + 1)
      const d = j * (segments + 1) + (i + 1)
      indices.push(a, b, d)
      indices.push(d, b, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// Creates a cute candy-striped texture for birthday candles
function createStripedCandleTexture(stripeHex = '#4cd964') {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 128, 256)

  ctx.fillStyle = stripeHex
  const stripeCount = 5
  const bandH = 256 / (stripeCount * 2)
  for (let i = 0; i < stripeCount * 2; i += 2) {
    ctx.beginPath()
    ctx.moveTo(0, i * bandH)
    ctx.lineTo(128, i * bandH - 18)
    ctx.lineTo(128, (i + 1) * bandH - 18)
    ctx.lineTo(0, (i + 1) * bandH)
    ctx.closePath()
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createMessageTexture(text, style = 'topper') {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 192
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  if (style === 'topper') {
    const grad = ctx.createLinearGradient(0, 0, 512, 192)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#f9f1e4')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(6, 6, 500, 180, 28)
    ctx.fill()

    ctx.lineWidth = 8
    ctx.strokeStyle = '#d4af37'
    ctx.stroke()

    ctx.lineWidth = 2
    ctx.strokeStyle = '#e8d084'
    ctx.beginPath()
    ctx.roundRect(18, 18, 476, 156, 20)
    ctx.stroke()

    ctx.fillStyle = '#7c2d3a'
    ctx.font = 'italic bold 40px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.slice(0, 28), 256, 98, 450)
  } else {
    ctx.fillStyle = '#4a281d'
    ctx.beginPath()
    ctx.roundRect(10, 24, 492, 144, 36)
    ctx.fill()

    ctx.lineWidth = 5
    ctx.strokeStyle = '#f5d77f'
    ctx.stroke()

    ctx.fillStyle = '#fff8eb'
    ctx.font = 'italic bold 38px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.slice(0, 28), 256, 96, 440)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createCrossSectionTexture(spongeColor, fillingColor) {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const totalSlices = 7
  const sliceH = canvas.height / totalSlices
  for (let i = 0; i < totalSlices; i++) {
    const isFilling = i % 2 === 1
    ctx.fillStyle = isFilling ? fillingColor : spongeColor
    ctx.fillRect(0, i * sliceH, canvas.width, sliceH + 1)

    if (!isFilling) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      for (let d = 0; d < 45; d++) {
        const rx = (Math.sin(i * 37 + d * 13) * 0.5 + 0.5) * canvas.width
        const ry = (i + (Math.cos(i * 19 + d * 29) * 0.5 + 0.5)) * sliceH
        ctx.beginPath()
        ctx.arc(rx, ry, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

const SPRINKLE_COLORS = [0xff7eb9, 0xffe066, 0x66d9e8, 0xb197fc, 0x63e6be, 0xff922b]

export default function ThreeCakeCanvas({
  config,
  spongeColor = '#f6e3ba',
  fillingColor = '#e04f6b',
  showCrossSection = false,
  autoRotate = true,
  compact = false,
  onCaptureReady,
}) {
  const canvasHolderRef = useRef(null)
  const defaultDistanceRef = useRef(7.6)
  const targetYRef = useRef(1.35)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const cakeGroupRef = useRef(null)
  const isDraggingRef = useRef(false)
  const prevMousePosRef = useRef({ x: 0, y: 0 })
  const autoRotateRef = useRef(autoRotate)
  const onCaptureReadyRef = useRef(onCaptureReady)
  // Soft front-3/4 angle with distance and target framing the entire cake model comfortably
  const orbitRef = useRef({
    azimuth: 0.42,
    polar: 0.22,
    distance: 7.6,
    targetY: 1.35,
  })

  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  useEffect(() => {
    onCaptureReadyRef.current = onCaptureReady
  }, [onCaptureReady])

  useEffect(() => {
    const container = canvasHolderRef.current
    if (!container) return

    const width = container.clientWidth || 540
    const height = container.clientHeight || 420

    // 1. Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 2. Camera with flattering portrait lens (33 deg FOV)
    const camera = new THREE.PerspectiveCamera(33, width / height, 0.1, 100)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    container.replaceChildren(renderer.domElement)
    rendererRef.current = renderer

    // 4. Soft Clay-Render Patisserie Studio Lighting (High key, soft pastel shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.65)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf7e8f0, 0.85)
    hemiLight.position.set(0, 12, 0)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xfffdf9, 1.75)
    keyLight.position.set(4.5, 8.5, 7.0)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.bias = -0.0005
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffeef6, 1.05)
    fillLight.position.set(-6, 4.0, 5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xe8f4ff, 0.95)
    rimLight.position.set(0, 6, -6)
    scene.add(rimLight)

    // Soft Shadow Catching Table Plane
    const floorGeo = new THREE.PlaneGeometry(24, 24)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.1 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.18
    floor.receiveShadow = true
    scene.add(floor)

    // 5. Cake Root Group
    const cakeGroup = new THREE.Group()
    scene.add(cakeGroup)
    cakeGroupRef.current = cakeGroup

    // Animation Loop
    let animId
    const currentOrbit = {
      azimuth: orbitRef.current.azimuth,
      polar: orbitRef.current.polar,
      distance: orbitRef.current.distance,
      targetY: orbitRef.current.targetY,
    }

    const animate = () => {
      animId = requestAnimationFrame(animate)

      if (autoRotateRef.current && !isDraggingRef.current) {
        orbitRef.current.azimuth += 0.0055
      }

      currentOrbit.azimuth += (orbitRef.current.azimuth - currentOrbit.azimuth) * 0.12
      currentOrbit.polar += (orbitRef.current.polar - currentOrbit.polar) * 0.12
      currentOrbit.distance += (orbitRef.current.distance - currentOrbit.distance) * 0.12
      currentOrbit.targetY += (orbitRef.current.targetY - currentOrbit.targetY) * 0.12

      if (cakeGroup) {
        cakeGroup.rotation.y = currentOrbit.azimuth
      }

      const camY = currentOrbit.targetY + Math.sin(currentOrbit.polar) * currentOrbit.distance
      const camZ = Math.cos(currentOrbit.polar) * currentOrbit.distance
      camera.position.set(0, camY, camZ)
      camera.lookAt(0, currentOrbit.targetY, 0)

      renderer.render(scene, camera)
    }
    animate()

    if (onCaptureReadyRef.current) {
      onCaptureReadyRef.current(() => {
        try {
          if (!renderer || !scene) return null
          const prevY = cakeGroup ? cakeGroup.rotation.y : 0
          if (cakeGroup) {
            cakeGroup.rotation.y = 0.38
          }

          // Dedicated photo capture camera with wide safe margins so the cake is never clipped
          const snapWidth = 720
          const snapHeight = 560
          const snapCamera = new THREE.PerspectiveCamera(30, snapWidth / snapHeight, 0.1, 100)
          const snapTargetY = targetYRef.current || 1.35
          const snapDist = Math.max(8.6, (defaultDistanceRef.current || 7.6) * 1.15)
          const snapPolar = 0.22
          snapCamera.position.set(0, snapTargetY + Math.sin(snapPolar) * snapDist, Math.cos(snapPolar) * snapDist)
          snapCamera.lookAt(0, snapTargetY, 0)

          // Temporarily set renderer to clean snapshot dimensions
          const currSize = new THREE.Vector2()
          renderer.getSize(currSize)
          renderer.setSize(snapWidth, snapHeight, false)
          renderer.render(scene, snapCamera)

          const srcCanvas = renderer.domElement
          const outCanvas = document.createElement('canvas')
          outCanvas.width = snapWidth
          outCanvas.height = snapHeight
          const ctx = outCanvas.getContext('2d')
          const grad = ctx.createRadialGradient(
            snapWidth * 0.5,
            snapHeight * 0.44,
            30,
            snapWidth * 0.5,
            snapHeight * 0.5,
            snapWidth * 0.75,
          )
          grad.addColorStop(0, '#ffffff')
          grad.addColorStop(0.65, '#fdf7f4')
          grad.addColorStop(1, '#f3e6de')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, snapWidth, snapHeight)
          ctx.drawImage(srcCanvas, 0, 0, snapWidth, snapHeight)

          // Restore live viewport size and rotation
          renderer.setSize(currSize.x, currSize.y, false)
          if (cakeGroup) {
            cakeGroup.rotation.y = prevY
          }
          if (camera) {
            renderer.render(scene, camera)
          }

          return outCanvas.toDataURL('image/png')
        } catch {
          return null
        }
      })
    }

    // Native non-passive wheel zoom so e.preventDefault() stops the web page from scrolling
    const handleWheelNative = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const zoomStep = e.deltaY * 0.0055
      orbitRef.current.distance = Math.max(
        3.5,
        Math.min(14.0, orbitRef.current.distance + zoomStep),
      )
    }

    // Touch pinch-to-zoom for trackpads & mobile screens
    let touchStartDist = 0
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        touchStartDist = Math.hypot(dx, dy)
      }
    }
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const newDist = Math.hypot(dx, dy)
        const pinchDelta = (touchStartDist - newDist) * 0.015
        orbitRef.current.distance = Math.max(3.5, Math.min(14.0, orbitRef.current.distance + pinchDelta))
        touchStartDist = newDist
      }
    }

    container.addEventListener('wheel', handleWheelNative, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return
      const w = Math.max(container.clientWidth, 280)
      const h = Math.max(container.clientHeight, 300)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
      container.removeEventListener('wheel', handleWheelNative)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      renderer.dispose()
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Build / Rebuild 3D Cake Geometry on Config Change
  useEffect(() => {
    const cakeGroup = cakeGroupRef.current
    if (!cakeGroup) return

    const disposeNode = (node) => {
      if (node.geometry) node.geometry.dispose()
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material]
        mats.forEach((m) => {
          if (m.map) m.map.dispose()
          m.dispose()
        })
      }
      if (node.children) {
        node.children.forEach(disposeNode)
      }
    }
    while (cakeGroup.children.length > 0) {
      const child = cakeGroup.children[0]
      disposeNode(child)
      cakeGroup.remove(child)
    }

    const {
      tiers = 2,
      shape = 'round',
      size = '18cm',
      heightStyle = 'classic',
      finish = 'smooth',
      tierColors = ['#6ec1f6', '#f49cbb', '#b39ddb'],
      drip = 'white_choco',
      piping = 'shell',
      pipingColor = '#e6daf8',
      toppings = [],
      candles = 'twisted',
      messageText = '',
      messagePosition = 'topper',
    } = config

    const sizeScaleMap = {
      '14cm': 0.86,
      '18cm': 1.0,
      '22cm': 1.12,
      '26cm': 1.22,
    }
    const sizeScale = sizeScaleMap[size] || 1.0
    const heightScale = heightStyle === 'tall' ? 1.22 : 1.0

    // 1. Ceramic Cake Plate with Raised Curved Rim (Matching Reference Image 1 & 2)
    const plateRadius = 2.16 * Math.max(0.92, sizeScale * 0.96)
    const plateHeight = 0.16
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0xb5def6, // Pastel sky blue ceramic plate
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
    })
    const plateGeo = createCeramicPlateGeometry(plateRadius, plateHeight)
    const plateMesh = new THREE.Mesh(plateGeo, plateMat)
    plateMesh.position.y = -0.04
    plateMesh.receiveShadow = true
    plateMesh.castShadow = true
    cakeGroup.add(plateMesh)

    const getFinishProps = (fin) => {
      if (fin === 'glossy') return { roughness: 0.12, metalness: 0.04, clearcoat: 0.95 }
      if (fin === 'fondant') return { roughness: 0.38, metalness: 0.0, clearcoat: 0.18 }
      if (fin === 'vintage') return { roughness: 0.45, metalness: 0.01, clearcoat: 0.12 }
      return { roughness: 0.32, metalness: 0.0, clearcoat: 0.28 }
    }

    const baseTierSpecs = [
      { radius: 1.54 * sizeScale, height: 0.96 * heightScale },
      { radius: 1.08 * sizeScale, height: 0.82 * heightScale },
      { radius: 0.74 * sizeScale, height: 0.72 * heightScale },
    ].slice(0, tiers)

    const crossTexture = showCrossSection
      ? createCrossSectionTexture(spongeColor, fillingColor)
      : null

    const baseY = 0.04
    let currentY = baseY
    const cutAngle = Math.PI * 1.58

    baseTierSpecs.forEach((spec, index) => {
      // In reference images, tiers have clean, velvety soft pastel clay solid colors
      const colorHex = tierColors[index] || tierColors[0] || (index === 0 ? '#ceb0ec' : '#bee3f8')
      const tierColor = new THREE.Color(colorHex)
      const finishProps = getFinishProps(finish)

      const wallMat = new THREE.MeshPhysicalMaterial({
        color: tierColor,
        roughness: finishProps.roughness,
        metalness: finishProps.metalness,
        clearcoat: finishProps.clearcoat,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide,
      })

      const topCapMat = new THREE.MeshPhysicalMaterial({
        color: tierColor.clone().lerp(new THREE.Color('#ffffff'), 0.2),
        roughness: finishProps.roughness,
        metalness: finishProps.metalness,
        clearcoat: finishProps.clearcoat,
        side: THREE.DoubleSide,
      })

      const thetaLength = showCrossSection ? cutAngle : Math.PI * 2

      // Create Tier Mesh by Shape (Unified across Round, Heart, Hexagon, Square)
      const tierGeo = createCustomShapePrismGeometry(
        shape,
        spec.radius,
        spec.radius,
        spec.height,
        thetaLength,
      )
      const tierMesh = new THREE.Mesh(tierGeo, [wallMat, topCapMat])
      tierMesh.position.y = currentY + spec.height / 2
      tierMesh.castShadow = true
      tierMesh.receiveShadow = true
      cakeGroup.add(tierMesh)

      // True Layered Cross-Section Cutaway View
      if (showCrossSection && crossTexture) {
        const sliceMat = new THREE.MeshStandardMaterial({
          map: crossTexture,
          roughness: 0.55,
          side: THREE.DoubleSide,
        })

        const pt0 = getShapePerimeterPoint(shape, spec.radius, 0)
        const len0 = Math.hypot(pt0.x, pt0.z)
        const ang0 = Math.atan2(pt0.z, pt0.x)
        const wall1 = new THREE.Mesh(new THREE.PlaneGeometry(len0, spec.height), sliceMat)
        wall1.position.set(pt0.x / 2, currentY + spec.height / 2, pt0.z / 2)
        wall1.rotation.y = -ang0
        cakeGroup.add(wall1)

        const ptCut = getShapePerimeterPoint(shape, spec.radius, cutAngle)
        const lenCut = Math.hypot(ptCut.x, ptCut.z)
        const angCut = Math.atan2(ptCut.z, ptCut.x)
        const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(lenCut, spec.height), sliceMat)
        wall2.position.set(ptCut.x / 2, currentY + spec.height / 2, ptCut.z / 2)
        wall2.rotation.y = -angCut
        cakeGroup.add(wall2)
      }

      // 2. Thick Puffy Frosting Blanket with Scalloped Drooping Waves (As in Reference Images 1, 2, 3)
      const activeDrip = drip && drip !== 'none' ? drip : null
      const dripColors = {
        white_choco: index === 0 && tiers > 1 && tierColors[0] === '#ceb0ec' ? '#f5d8ee' : '#f8fbff',
        strawberry: '#ff8fb1',
        lavender_cream: '#ebd7f5',
        dark_choco: '#382015',
        caramel: '#d4822a',
        gold_glaze: '#e6be4c',
      }
      const glazeColor = activeDrip ? dripColors[activeDrip] || 0xf8fbff : 0xf8fbff
      const glazeMat = new THREE.MeshPhysicalMaterial({
        color: glazeColor,
        roughness: activeDrip === 'gold_glaze' ? 0.18 : 0.22,
        metalness: activeDrip === 'gold_glaze' ? 0.72 : 0.01,
        clearcoat: 0.75,
        clearcoatRoughness: 0.15,
        side: THREE.DoubleSide,
      })

      if (activeDrip) {
        const blanketGeo = createPuffyFrostingBlanketGeometry(
          shape,
          spec.radius,
          spec.height,
          index,
          thetaLength,
        )
        const blanketMesh = new THREE.Mesh(blanketGeo, glazeMat)
        blanketMesh.position.y = currentY
        blanketMesh.receiveShadow = true
        blanketMesh.castShadow = true
        cakeGroup.add(blanketMesh)
      }

      // Cute Polka Dots on Tier Side Wall (Matching Reference Image 1)
      if (toppings.includes('confetti_dots') || toppings.length === 0 || toppings.includes('strawberries')) {
        const dotColors = [0xff8fa3, 0x74c0fc, 0xffe066, 0xb197fc, 0xffa87d]
        const dotCount = index === 0 ? 12 : 8
        for (let d = 0; d < dotCount; d++) {
          const dotAngle = (d * 137.5 * Math.PI) / 180
          if (showCrossSection && dotAngle % (Math.PI * 2) > cutAngle - 0.1) continue
          const normYFrac = 0.24 + ((d * 31) % 52) / 100
          const dotPt = getShapePerimeterPoint(shape, spec.radius, dotAngle, 0.008)
          const dotMat = new THREE.MeshStandardMaterial({
            color: dotColors[d % dotColors.length],
            roughness: 0.35,
          })
          const dotMesh = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), dotMat)
          dotMesh.position.set(dotPt.x, currentY + spec.height * normYFrac, dotPt.z)
          dotMesh.rotation.y = Math.atan2(dotPt.nx, dotPt.nz)
          cakeGroup.add(dotMesh)
        }
      }

      // 3. Cute Pastel Confetti Sprinkles on the Glaze Surface of Each Tier
      const sprinkleGeo = new THREE.CapsuleGeometry(0.018, 0.065, 6, 8)
      const innerBound = index < baseTierSpecs.length - 1 ? baseTierSpecs[index + 1].radius * 1.08 : 0.12
      const outerBound = spec.radius * 0.88
      const sprinkleCount = index < baseTierSpecs.length - 1 ? 26 : 38

      for (let s = 0; s < sprinkleCount; s++) {
        const sAngle = (s * 137.5 * Math.PI) / 180
        if (showCrossSection && sAngle % (Math.PI * 2) > cutAngle - 0.1) {
          continue
        }
        const fracR = ((s * 29) % 100) / 100
        const r = innerBound + fracR * Math.max(0.15, outerBound - innerBound)
        const pt = getShapePerimeterPoint(shape, r, sAngle)

        const spMat = new THREE.MeshStandardMaterial({
          color: SPRINKLE_COLORS[s % SPRINKLE_COLORS.length],
          roughness: 0.25,
        })
        const spMesh = new THREE.Mesh(sprinkleGeo, spMat)
        spMesh.position.set(pt.x, currentY + spec.height + 0.024, pt.z)
        spMesh.rotation.x = Math.PI / 2
        spMesh.rotation.z = s * 1.15
        cakeGroup.add(spMesh)
      }

      // 4. Whipped Cream Rosettes on Tier Ledge (Matching Reference Image 2 & 3!)
      if (piping === 'whipped_swirls' || toppings.includes('whipped_kisses')) {
        const rosetteCount = index === 0 ? 12 : 8
        const rosetteMat = new THREE.MeshPhysicalMaterial({
          color: pipingColor && pipingColor !== 'match_tier' && pipingColor !== '#e6daf8' ? pipingColor : 0xff2d6e,
          roughness: 0.18,
          clearcoat: 0.85,
        })
        const rosetteGeo = createWhippedCreamRosetteGeometry(0.082, 0.12, 7)
        for (let w = 0; w < rosetteCount; w++) {
          const angle = (w / rosetteCount) * (showCrossSection ? cutAngle : Math.PI * 2) + 0.1
          const pt = getShapePerimeterPoint(shape, spec.radius * 0.94, angle, 0.015)
          const rMesh = new THREE.Mesh(rosetteGeo, rosetteMat)
          rMesh.position.set(pt.x, currentY + spec.height + 0.018, pt.z)
          rMesh.rotation.y = angle
          cakeGroup.add(rMesh)
        }
      }

      // 5. Smooth Pearl Border / Ribbon around Bottom of Each Tier (Matching Reference Image 1!)
      if (piping && piping !== 'none' && piping !== 'whipped_swirls') {
        const resolvedPipeColor =
          pipingColor && pipingColor !== 'match_tier'
            ? new THREE.Color(pipingColor)
            : new THREE.Color('#cca9ea')

        const pipeMat = new THREE.MeshPhysicalMaterial({
          color: resolvedPipeColor,
          roughness: 0.26,
          metalness: pipingColor === '#d4af37' ? 0.65 : 0.01,
          clearcoat: 0.4,
        })

        const maxAngle = showCrossSection ? cutAngle : Math.PI * 2
        const waveSteps = Math.floor(spec.radius * 68)

        for (let b = 0; b < waveSteps; b++) {
          const angle = (b / waveSteps) * maxAngle
          const pt = getShapePerimeterPoint(shape, spec.radius, angle, 0.038)

          if (piping === 'pearl' || piping === 'shell') {
            const beadRadius = 0.052
            const beadMesh = new THREE.Mesh(new THREE.SphereGeometry(beadRadius, 14, 14), pipeMat)
            beadMesh.position.set(pt.x, currentY + 0.045, pt.z)
            cakeGroup.add(beadMesh)
          } else {
            const waveY = Math.sin(angle * 12) * 0.026
            const waveR = 0.056 + Math.cos(angle * 12) * 0.01
            const waveBead = new THREE.Mesh(new THREE.SphereGeometry(waveR, 12, 12), pipeMat)
            waveBead.position.set(pt.x, currentY + 0.055 + waveY, pt.z)
            cakeGroup.add(waveBead)
          }
        }
      }

      currentY += spec.height
    })

    // Toppings on Top Tier & Ledges
    const topTierSpec = baseTierSpecs[baseTierSpecs.length - 1]
    const topSurfaceY = currentY + (drip && drip !== 'none' ? 0.055 : 0.01)

    if (toppings && toppings.length > 0) {
      // 1. Plump Glossy Red Cherries / Berries (Placed on Top Tier AND Tier 1 Ledge like Image 3!)
      if (toppings.includes('strawberries')) {
        const berryMat = new THREE.MeshPhysicalMaterial({
          color: 0xe62e42,
          roughness: 0.14,
          clearcoat: 0.9,
        })
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x378b29, roughness: 0.45 })
        const berryGeo = new THREE.SphereGeometry(0.095, 18, 16)

        // Place berries on lower tier ledge if multi-tier (like Image 3!)
        if (baseTierSpecs.length > 1) {
          const ledgeTier = baseTierSpecs[0]
          const ledgeY = baseY + ledgeTier.height + (drip && drip !== 'none' ? 0.055 : 0.01)
          const ledgeRadius = (ledgeTier.radius + baseTierSpecs[1].radius) * 0.52
          const ledgeCount = 8
          for (let i = 0; i < ledgeCount; i++) {
            const angle = (i / ledgeCount) * Math.PI * 2 + 0.35
            const pt = getShapePerimeterPoint(shape, ledgeRadius, angle)
            const bMesh = new THREE.Mesh(berryGeo, berryMat)
            bMesh.scale.set(1.05, 0.9, 1.05)
            bMesh.position.set(pt.x, ledgeY + 0.075, pt.z)
            cakeGroup.add(bMesh)
          }
        }

        // Place plump berries on top tier
        const topCount = 6
        for (let i = 0; i < topCount; i++) {
          const angle = (i / topCount) * Math.PI * 2 + 0.2
          const pt = getShapePerimeterPoint(shape, topTierSpec.radius * 0.66, angle)
          const bGroup = new THREE.Group()

          const bMesh = new THREE.Mesh(berryGeo, berryMat)
          bMesh.scale.set(1.08, 0.92, 1.08)
          bMesh.position.y = 0.08
          bGroup.add(bMesh)

          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 6), leafMat)
          stem.position.y = 0.17
          stem.rotation.z = 0.25
          bGroup.add(stem)

          bGroup.position.set(pt.x, topSurfaceY, pt.z)
          cakeGroup.add(bGroup)
        }
      }

      // 2. Pastel French Macarons
      if (toppings.includes('macarons')) {
        const macColors = [0xff8fb1, 0x80ed99, 0xffe066, 0x74c0fc]
        const macCreamMat = new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.25 })
        const shellGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 20)
        const creamGeo = new THREE.CylinderGeometry(0.122, 0.122, 0.03, 20)

        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + 0.75
          const pt = getShapePerimeterPoint(shape, topTierSpec.radius * 0.7, angle)
          const macMat = new THREE.MeshStandardMaterial({
            color: macColors[i % macColors.length],
            roughness: 0.3,
          })
          const mGroup = new THREE.Group()

          const shell1 = new THREE.Mesh(shellGeo, macMat)
          shell1.position.y = 0.04
          const cream = new THREE.Mesh(creamGeo, macCreamMat)
          const shell2 = new THREE.Mesh(shellGeo, macMat)
          shell2.position.y = -0.04

          mGroup.add(shell1, cream, shell2)
          mGroup.rotation.z = 0.32
          mGroup.rotation.y = -angle
          mGroup.position.set(pt.x, topSurfaceY + 0.09, pt.z)
          cakeGroup.add(mGroup)
        }
      }

      // 3. 3D Buttercream Roses
      if (toppings.includes('roses')) {
        const roseColors = [0xff85a2, 0xffc2d1, 0xf26a8d]
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + 0.5
          const pt = getShapePerimeterPoint(shape, topTierSpec.radius * 0.74, angle)
          const roseMat = new THREE.MeshStandardMaterial({
            color: roseColors[i % roseColors.length],
            roughness: 0.28,
          })
          const roseGroup = new THREE.Group()
          const bud = new THREE.Mesh(new THREE.TorusKnotGeometry(0.065, 0.026, 36, 8, 2, 3), roseMat)
          bud.rotation.x = Math.PI / 2
          roseGroup.add(bud)
          roseGroup.position.set(pt.x, topSurfaceY + 0.06, pt.z)
          cakeGroup.add(roseGroup)
        }
      }

      // 4. Coquette Ribbon Bows around Tier Side
      if (toppings.includes('bows')) {
        const bowMat = new THREE.MeshStandardMaterial({ color: 0xe63963, roughness: 0.35 })
        const bowCount = 4
        const bowTierSpec = baseTierSpecs[0]
        for (let i = 0; i < bowCount; i++) {
          const angle = (i / bowCount) * Math.PI * 2 + 0.4
          const pt = getShapePerimeterPoint(shape, bowTierSpec.radius, angle, 0.038)
          const bowGroup = new THREE.Group()

          const loopGeo = new THREE.TorusGeometry(0.08, 0.026, 10, 20)
          const leftLoop = new THREE.Mesh(loopGeo, bowMat)
          leftLoop.position.set(-0.07, 0.02, 0)
          leftLoop.rotation.z = 0.3

          const rightLoop = new THREE.Mesh(loopGeo, bowMat)
          rightLoop.position.set(0.07, 0.02, 0)
          rightLoop.rotation.z = -0.3

          const tailGeo = new THREE.BoxGeometry(0.035, 0.18, 0.015)
          const leftTail = new THREE.Mesh(tailGeo, bowMat)
          leftTail.position.set(-0.05, -0.1, 0)
          leftTail.rotation.z = 0.25

          const rightTail = new THREE.Mesh(tailGeo, bowMat)
          rightTail.position.set(0.05, -0.1, 0)
          rightTail.rotation.z = -0.25

          bowGroup.add(leftLoop, rightLoop, leftTail, rightTail)
          bowGroup.position.set(pt.x, 0.12 + bowTierSpec.height * 0.62, pt.z)
          bowGroup.rotation.y = Math.atan2(pt.nx, pt.nz)
          cakeGroup.add(bowGroup)
        }
      }

      // 5. 24K Gold Leaf Flakes
      if (toppings.includes('gold_leaf')) {
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xf7d046,
          metalness: 0.95,
          roughness: 0.14,
          side: THREE.DoubleSide,
        })
        const flakeGeo = new THREE.PlaneGeometry(0.08, 0.08)
        for (let f = 0; f < 12; f++) {
          const fMesh = new THREE.Mesh(flakeGeo, goldMat)
          const a = (f / 12) * Math.PI * 2
          const r = (0.25 + ((f * 7) % 10) * 0.05) * topTierSpec.radius
          const pt = getShapePerimeterPoint(shape, r, a)
          fMesh.position.set(pt.x, topSurfaceY + 0.012, pt.z)
          fMesh.rotation.x = -Math.PI / 2
          fMesh.rotation.z = f * 0.7
          cakeGroup.add(fMesh)
        }
      }

      // 6. Royal Gold Crown Topper
      if (toppings.includes('crown')) {
        const crownMat = new THREE.MeshStandardMaterial({
          color: 0xe5bc42,
          metalness: 0.88,
          roughness: 0.18,
          side: THREE.DoubleSide,
        })
        const jewelMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.05,
          metalness: 0.2,
          clearcoat: 1.0,
        })
        const crownRad = topTierSpec.radius * 0.44
        const crownBaseGeo = new THREE.CylinderGeometry(crownRad, crownRad * 0.92, 0.14, 32, 1, true)
        const crownMesh = new THREE.Mesh(crownBaseGeo, crownMat)
        crownMesh.position.set(0, topSurfaceY + 0.08, 0)
        cakeGroup.add(crownMesh)

        const points = 8
        for (let p = 0; p < points; p++) {
          const a = (p / points) * Math.PI * 2
          const pointGeo = new THREE.ConeGeometry(0.065, 0.22, 12)
          const pointMesh = new THREE.Mesh(pointGeo, crownMat)
          pointMesh.position.set(Math.cos(a) * crownRad, topSurfaceY + 0.24, Math.sin(a) * crownRad)
          cakeGroup.add(pointMesh)

          const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), jewelMat)
          pearl.position.set(Math.cos(a) * crownRad, topSurfaceY + 0.36, Math.sin(a) * crownRad)
          cakeGroup.add(pearl)
        }
      }
    }

    // 5. Stylized Birthday Candles with Glowing Flames & Warm Light (Matching Images 1, 2, 3, 4)
    if (candles && candles !== 'none') {
      const isRoyalBlue = tierColors.some((c) => c === '#2f66d4' || c === '#3b5bdb')
      const centerStripe = isRoyalBlue ? '#2f66d4' : '#ff7597'
      const sideStripe = isRoyalBlue ? '#ff7597' : '#9d6ef0'

      const centerTex = createStripedCandleTexture(centerStripe)
      const sideTex = createStripedCandleTexture(sideStripe)
      const goldTex = createStripedCandleTexture('#e5b83b')

      const centerMat = new THREE.MeshStandardMaterial({ map: centerTex, roughness: 0.22, metalness: 0.04 })
      const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.22, metalness: 0.04 })
      const goldMat = new THREE.MeshStandardMaterial({ map: goldTex, roughness: 0.18, metalness: 0.55 })
      const wickMat = new THREE.MeshBasicMaterial({ color: 0x221812 })

      const outerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffa000 })
      const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xfffee4 })

      // Warm candle flame point light casting soft glow onto the top of the cake
      const flameLight = new THREE.PointLight(0xffab38, 1.4, 4.2)
      flameLight.position.set(0, topSurfaceY + 1.05, 0.08)
      cakeGroup.add(flameLight)

      if (candles === 'single_wish') {
        // 1 tall sweet candle in center (Image 3)
        const cGroup = new THREE.Group()
        cGroup.position.set(0, topSurfaceY, 0)

        const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.68, 20), centerMat)
        cMesh.position.y = 0.34
        cMesh.castShadow = true
        cGroup.add(cMesh)

        const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.06, 6), wickMat)
        wick.position.y = 0.71
        cGroup.add(wick)

        const flameGroup = new THREE.Group()
        flameGroup.position.set(0, 0.82, 0)
        const outerBase = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 14), outerFlameMat)
        outerBase.scale.set(1.0, 1.35, 0.72)
        const outerTip = new THREE.Mesh(new THREE.ConeGeometry(0.064, 0.16, 16), outerFlameMat)
        outerTip.position.y = 0.085
        outerTip.scale.set(1.0, 1.0, 0.72)
        const innerBase = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 12), innerFlameMat)
        innerBase.position.set(0, -0.01, 0.01)
        innerBase.scale.set(1.0, 1.25, 0.72)
        flameGroup.add(outerBase, outerTip, innerBase)
        cGroup.add(flameGroup)

        cakeGroup.add(cGroup)
      } else if (candles === 'party_ring') {
        // Ring of 9 birthday candles around top rim (Image 4)
        const ringCount = 8
        for (let i = 0; i < ringCount; i++) {
          const a = (i / ringCount) * Math.PI * 2
          const pt = getShapePerimeterPoint(shape, topTierSpec.radius * 0.74, a)
          const cGroup = new THREE.Group()
          cGroup.position.set(pt.x, topSurfaceY, pt.z)

          const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.52, 16), i % 2 === 0 ? centerMat : sideMat)
          cMesh.position.y = 0.26
          cMesh.castShadow = true
          cGroup.add(cMesh)

          const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), wickMat)
          wick.position.y = 0.54
          cGroup.add(wick)

          const flameGroup = new THREE.Group()
          flameGroup.position.set(0, 0.64, 0)
          const outerBase = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 12), outerFlameMat)
          outerBase.scale.set(1.0, 1.35, 0.72)
          const outerTip = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.14, 14), outerFlameMat)
          outerTip.position.y = 0.075
          outerTip.scale.set(1.0, 1.0, 0.72)
          const innerBase = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), innerFlameMat)
          innerBase.position.set(0, -0.01, 0.01)
          flameGroup.add(outerBase, outerTip, innerBase)
          cGroup.add(flameGroup)

          cakeGroup.add(cGroup)
        }
      } else {
        // 3 candles: Thick prominent center candle + 2 slightly tilted side candles (Image 1 & 2!)
        const isGold = candles === 'gold_tall'
        const cSpecs = [
          { x: -topTierSpec.radius * 0.36, z: -0.04, tilt: 0.08, r: 0.042, h: 0.54, mat: isGold ? goldMat : sideMat },
          { x: 0, z: 0, tilt: 0.0, r: 0.062, h: 0.72, mat: isGold ? goldMat : centerMat },
          { x: topTierSpec.radius * 0.36, z: -0.04, tilt: -0.08, r: 0.042, h: 0.54, mat: isGold ? goldMat : sideMat },
        ]

        cSpecs.forEach((spec) => {
          const cGroup = new THREE.Group()
          cGroup.position.set(spec.x, topSurfaceY, spec.z)
          cGroup.rotation.z = spec.tilt

          const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(spec.r, spec.r, spec.h, 20), spec.mat)
          cMesh.position.y = spec.h / 2
          cMesh.castShadow = true
          cGroup.add(cMesh)

          const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.06, 6), wickMat)
          wick.position.y = spec.h + 0.03
          cGroup.add(wick)

          const flameGroup = new THREE.Group()
          flameGroup.position.set(0, spec.h + 0.14, 0)
          flameGroup.rotation.z = -0.18

          const flameScale = spec.r > 0.05 ? 1.15 : 0.95
          const outerBase = new THREE.Mesh(new THREE.SphereGeometry(0.068 * flameScale, 16, 14), outerFlameMat)
          outerBase.scale.set(1.0, 1.35, 0.72)
          const outerTip = new THREE.Mesh(new THREE.ConeGeometry(0.064 * flameScale, 0.16 * flameScale, 16), outerFlameMat)
          outerTip.position.y = 0.085 * flameScale
          outerTip.scale.set(1.0, 1.0, 0.72)

          const innerBase = new THREE.Mesh(new THREE.SphereGeometry(0.042 * flameScale, 14, 12), innerFlameMat)
          innerBase.position.set(0, -0.01, 0.015)
          innerBase.scale.set(1.0, 1.25, 0.72)

          flameGroup.add(outerBase, outerTip, innerBase)
          cGroup.add(flameGroup)

          cakeGroup.add(cGroup)
        })
      }
    }

    // Custom Message Banner (Topper or Surface Plaque)
    const cleanText = String(messageText || '').trim()
    if (cleanText) {
      const msgTexture = createMessageTexture(cleanText, messagePosition)
      const bannerFrontMat = new THREE.MeshStandardMaterial({
        map: msgTexture,
        roughness: 0.18,
        metalness: 0.05,
      })
      const bannerSideMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.75,
        roughness: 0.25,
      })
      const bannerMats = [
        bannerSideMat,
        bannerSideMat,
        bannerSideMat,
        bannerSideMat,
        bannerFrontMat,
        bannerFrontMat,
      ]

      if (messagePosition === 'surface') {
        const plaqueGeo = new THREE.BoxGeometry(1.1, 0.38, 0.035)
        const plaqueMesh = new THREE.Mesh(plaqueGeo, bannerMats)
        plaqueMesh.rotation.x = -Math.PI / 2.6
        plaqueMesh.position.set(0, topSurfaceY + 0.08, topTierSpec.radius * 0.42)
        cakeGroup.add(plaqueMesh)
      } else {
        const textGroup = new THREE.Group()
        const stickGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.52, 10)
        const stick1 = new THREE.Mesh(stickGeo, bannerSideMat)
        stick1.position.set(-0.34, topSurfaceY + 0.26, -0.22)
        const stick2 = new THREE.Mesh(stickGeo, bannerSideMat)
        stick2.position.set(0.34, topSurfaceY + 0.26, -0.22)
        textGroup.add(stick1, stick2)

        const bannerGeo = new THREE.BoxGeometry(1.24, 0.44, 0.036)
        const bannerMesh = new THREE.Mesh(bannerGeo, bannerMats)
        bannerMesh.position.set(0, topSurfaceY + 0.58, -0.22)
        textGroup.add(bannerMesh)

        cakeGroup.add(textGroup)
      }
    }

    // Automatically adjust camera targetY & distance so the entire cake (plate to candle flames) is comfortably framed without clipping
    const candleHeight = candles && candles !== 'none' ? (candles === 'party_ring' ? 0.82 : 1.05) : 0
    const bannerHeight = cleanText && messagePosition === 'topper' ? 0.78 : 0
    const extraTop = Math.max(candleHeight, bannerHeight, 0.25)
    const cakeTopY = topSurfaceY + extraTop
    const cakeBottomY = -0.06

    // Target the true vertical center of the cake model
    const calculatedTargetY = (cakeTopY + cakeBottomY) * 0.52
    targetYRef.current = calculatedTargetY
    orbitRef.current.targetY = calculatedTargetY

    // Calculate comfortable distance with safe margins to prevent clipping top flames or bottom plate
    const baseDistance = 6.4 + tiers * 0.75 + (sizeScale - 1) * 1.6 + (compact ? 0.8 : 0)
    const targetDistance = Math.max(7.4, baseDistance)
    defaultDistanceRef.current = targetDistance
    orbitRef.current.distance = targetDistance
  }, [config, spongeColor, fillingColor, showCrossSection, compact])

  // Mouse & Touch Orbit Controls Handler
  const handlePointerDown = (e) => {
    isDraggingRef.current = true
    prevMousePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - prevMousePosRef.current.x
    const dy = e.clientY - prevMousePosRef.current.y
    prevMousePosRef.current = { x: e.clientX, y: e.clientY }

    orbitRef.current.azimuth += dx * 0.01
    orbitRef.current.polar = Math.max(
      0.06,
      Math.min(0.78, orbitRef.current.polar + dy * 0.007),
    )
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  return (
    <div
      className={`w-full ${
        compact ? 'h-[280px] sm:h-[320px]' : 'h-[350px] sm:h-[390px] lg:h-[420px]'
      } select-none relative overflow-hidden rounded-2xl group`}
    >
      <div
        ref={canvasHolderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 1-Click Zoom In (+), Zoom Out (−) and Reset (⟲) Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1.5 shadow-md border border-stone-200/80 backdrop-blur-md">
        <button
          type="button"
          title="Phóng to bánh (Zoom in)"
          onClick={(e) => {
            e.stopPropagation()
            orbitRef.current.distance = Math.max(3.2, orbitRef.current.distance - 0.95)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 font-bold text-base cursor-pointer shadow-2xs transition-all"
        >
          +
        </button>
        <button
          type="button"
          title="Thu nhỏ bánh ra xa (Zoom out)"
          onClick={(e) => {
            e.stopPropagation()
            orbitRef.current.distance = Math.min(16.0, orbitRef.current.distance + 0.95)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 font-bold text-base cursor-pointer shadow-2xs transition-all"
        >
          −
        </button>
        <div className="h-3.5 w-px bg-stone-300 mx-0.5" />
        <button
          type="button"
          title="Đặt lại góc nhìn chuẩn (Reset View)"
          onClick={(e) => {
            e.stopPropagation()
            orbitRef.current.distance = defaultDistanceRef.current || 7.6
            orbitRef.current.polar = 0.22
            orbitRef.current.azimuth = 0.42
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs cursor-pointer shadow-2xs transition-all"
        >
          ⟲
        </button>
      </div>
    </div>
  )
}
