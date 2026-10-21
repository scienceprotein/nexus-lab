import { useEffect, useRef } from 'react'
import { fieldAt, makeSource } from '@/engine/waves'
import { rk4Step, LORENZ_CLASSIC, type Vec3 } from '@/engine/lorenz'

/**
 * Thumbnails are rendered from the actual governing equations of each model
 * (not stock imagery), so the preview is scientifically meaningful.
 */
export function SimThumbnail({ slug, className = '' }: { slug: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const w = 320
    const h = 180
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#0B1020'
    ctx.fillRect(0, 0, w, h)

    if (slug === 'orbital-mechanics') {
      // Real Kepler ellipse: star at focus, a=110, e=0.55
      const cx = w / 2
      const cy = h / 2
      const a = 105
      const e = 0.55
      const b = a * Math.sqrt(1 - e * e)
      const fx = cx - a * e // star at left focus
      const grad = ctx.createRadialGradient(fx, cy, 0, fx, cy, 26)
      grad.addColorStop(0, '#FDE68A')
      grad.addColorStop(1, 'rgba(253, 230, 138, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(fx, cy, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FBBF24'
      ctx.beginPath()
      ctx.arc(fx, cy, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#38BDF8'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const t = (i / 200) * Math.PI * 2
        const px = cx + a * Math.cos(t)
        const py = cy + b * Math.sin(t)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.fillStyle = '#38BDF8'
      ctx.beginPath()
      ctx.arc(cx + a * Math.cos(0.9), cy + b * Math.sin(0.9), 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (slug === 'wave-interference') {
      // Actual superposition field of two sources
      const s1 = makeSource({ x: -42, y: 0, frequency: 0.9 })
      const s2 = makeSource({ x: 42, y: 0, frequency: 0.9 })
      const img = ctx.createImageData(w, h)
      const t = 2.1
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const x = (px - w / 2) * 0.9
          const y = (py - h / 2) * 0.9
          const v = fieldAt([s1, s2], x, y, t) / 2
          const i = (py * w + px) * 4
          if (v >= 0) {
            img.data[i] = 56 + v * 90
            img.data[i + 1] = 130 + v * 100
            img.data[i + 2] = 200 + v * 55
          } else {
            img.data[i] = 20
            img.data[i + 1] = 40 - v * 60
            img.data[i + 2] = 90 - v * 110
          }
          img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    } else if (slug === 'lorenz-attractor') {
      // Integrate the real system and project
      let s: Vec3 = { x: 0.1, y: 0, z: 20 }
      for (let i = 0; i < 600; i++) s = rk4Step(s, LORENZ_CLASSIC) // transient
      ctx.strokeStyle = '#818CF8'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < 2600; i++) {
        s = rk4Step(s, LORENZ_CLASSIC)
        const px = w / 2 + s.x * 5.4
        const py = h - 16 - s.z * 2.9
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    } else if (slug === 'neural-network') {
      // Neural network graph motif: layered nodes with weighted connections
      const layers = [3, 5, 5, 2]
      const xs = layers.map((_, l) => 24 + ((w - 48) * l) / (layers.length - 1))
      const pos: { x: number; y: number }[][] = layers.map((n, l) =>
        Array.from({ length: n }, (_, i) => ({
          x: xs[l],
          y: h / 2 + (i - (n - 1) / 2) * Math.min(26, (h * 0.7) / n),
        })),
      )
      let seed = 7
      const rnd = () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
      }
      for (let l = 0; l < layers.length - 1; l++) {
        for (const a of pos[l]) {
          for (const b of pos[l + 1]) {
            const wgt = rnd() * 2 - 1
            const alpha = 0.06 + Math.abs(wgt) * 0.4
            ctx.strokeStyle = wgt >= 0 ? `rgba(56,189,248,${alpha})` : `rgba(248,113,113,${alpha})`
            ctx.lineWidth = 0.6 + Math.abs(wgt) * 1.2
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      for (const layer of pos) {
        for (const n of layer) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 7)
          g.addColorStop(0, '#7DD3FC')
          g.addColorStop(1, 'rgba(56,189,248,0.1)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(n.x, n.y, 6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    } else {
      ctx.strokeStyle = '#232E47'
      ctx.lineWidth = 1
      for (let gx = 0; gx <= w; gx += 32) {
        ctx.beginPath()
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, h)
        ctx.stroke()
      }
      for (let gy = 0; gy <= h; gy += 32) {
        ctx.beginPath()
        ctx.moveTo(0, gy)
        ctx.lineTo(w, gy)
        ctx.stroke()
      }
      ctx.strokeStyle = '#3A4763'
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const x = (i / 200) * w
        const y = h / 2 + Math.sin(i / 9) * 26 * Math.exp(-((i - 100) ** 2) / 9000)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }, [slug])

  return <canvas ref={ref} className={className} style={{ width: '100%', aspectRatio: '16/9', display: 'block' }} />
}
