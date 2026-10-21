import { useEffect, useRef } from 'react'
import katex from 'katex'

export function MathBlock({ tex, className = '' }: { tex: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, { displayMode: true, throwOnError: false })
    } catch {
      ref.current.textContent = tex
    }
  }, [tex])
  return <div ref={ref} className={`overflow-x-auto ${className}`} />
}

export function MathInline({ tex }: { tex: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, { displayMode: false, throwOnError: false })
    } catch {
      ref.current.textContent = tex
    }
  }, [tex])
  return <span ref={ref} />
}
