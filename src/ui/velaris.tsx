import { useEffect, useRef, type ReactNode } from 'react'

const vertexShaderGLSL = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragmentShaderGLSL = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3 u_colors[4];
uniform vec3 u_bg;
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = uv - 0.5;
  p.x *= ratio;
  float t = u_time * 0.1;
  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);
  vec3 col = u_bg;
  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);
  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);
  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;
  col = mix(col * 0.2, col, vignette);
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;
  gl_FragColor = vec4(col, 1.0);
}`

export interface VelarisProps {
  bg?: string
  colors?: string[]
  speed?: number
  grain?: number
  height?: string
  className?: string
  children?: ReactNode
  overlay?: boolean
}

const DEFAULT_COLORS = ['#45634D', '#78947A', '#253F30', '#101E16']

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}

export default function Velaris({
  bg = '#14251C',
  colors = DEFAULT_COLORS,
  speed = 1.1,
  grain = 0.18,
  height = '100%',
  className = '',
  children,
  overlay = false,
}: VelarisProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const palette = colors.slice(0, 4)
  while (palette.length < 4) palette.push(DEFAULT_COLORS[palette.length])
  const paletteKey = palette.join(',')

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const gl = canvas.getContext('webgl', { alpha: false })
    if (!gl) return // Solid CSS fallback remains visible.

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Velaris shader compilation failed:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexShaderGLSL)
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShaderGLSL)
    if (!vertex || !fragment) return
    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Velaris program linking failed:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      return
    }
    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const time = gl.getUniformLocation(program, 'u_time')
    const grainLoc = gl.getUniformLocation(program, 'u_grain')
    const colorLoc = gl.getUniformLocation(program, 'u_colors')
    const bgLoc = gl.getUniformLocation(program, 'u_bg')
    const rgb = new Float32Array(paletteKey.split(',').flatMap(hexToRgb))
    gl.uniform3fv(colorLoc, rgb)
    gl.uniform3f(bgLoc, ...hexToRgb(bg))
    gl.uniform1f(grainLoc, grain)
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(container.clientWidth * dpr))
      canvas.height = Math.max(1, Math.round(container.clientHeight * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    const start = performance.now()
    const render = (now: number) => {
      gl.uniform2f(resolution, canvas.width, canvas.height)
      gl.uniform1f(time, reduced.matches ? 0 : (now - start) * 0.001 * speed)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      if (!reduced.matches && !document.hidden) raf = requestAnimationFrame(render)
    }
    const visibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(render)
    }
    document.addEventListener('visibilitychange', visibility)
    raf = requestAnimationFrame(render)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      cancelAnimationFrame(raf)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [bg, paletteKey, speed, grain])

  return (
    <div ref={containerRef} className={className} style={{ position: overlay ? 'absolute' : 'relative', inset: overlay ? 0 : undefined, width: '100%', height, overflow: 'hidden', background: bg }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>{children}</div>
    </div>
  )
}
