import { useEffect, useRef } from 'react'
import { makeBody, computeAccelerations, step, type Body, type OrbitalParams } from '@/engine/orbital'

/**
 * Landing hero: a real three-body Newtonian integration rendered live —
 * the visual is the product, not a decoration.
 */
export function HeroSimulation() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const params: OrbitalParams = { G: 1, dt: 0.35, softening: 4, trailLength: 260 }
    const bodies: Body[] = [
      makeBody({ name: 'A', mass: 90, x: 0, y: 0, vx: 0, vy: 0, color: '#FBBF24' }),
      makeBody({ name: 'B', mass: 1.2, x: 190, y: 0, vx: 0, vy: Math.sqrt(90 / 190), color: '#38BDF8' }),
      makeBody({ name: 'C', mass: 0.8, x: -280, y: 0, vx: 0, vy: -0.78 * Math.sqrt(90 / 280), color: '#818CF8' }),
    ]
    computeAccelerations(bodies, params)

    let raf = 0
    let width = 0
    let height = 0

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      const cx = width * 0.5
      const cy = height * 0.52
      const scale = Math.min(width, height) / 620

      // trails
      for (const b of bodies) {
        if (b.trail.length > 1) {
          ctx.strokeStyle = b.color + '55'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          b.trail.forEach((p, i) => {
            const px = cx + p.x * scale
            const py = cy + p.y * scale
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          })
          ctx.stroke()
        }
      }
      // bodies
      for (const b of bodies) {
        const px = cx + b.x * scale
        const py = cy + b.y * scale
        const r = Math.max(3, Math.cbrt(b.mass) * 3.4 * Math.min(1, scale * 2))
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3)
        grad.addColorStop(0, b.color)
        grad.addColorStop(1, b.color + '00')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, r * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (reduced) {
      for (let i = 0; i < 600; i++) step(bodies, params)
      render()
    } else {
      const loop = () => {
        for (let i = 0; i < 3; i++) step(bodies, params)
        render()
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
