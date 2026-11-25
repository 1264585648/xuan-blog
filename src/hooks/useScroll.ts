import { useEffect, useState } from 'react'

/** Subscribe to window scroll/resize, throttled to one call per animation frame. */
function useRafScroll(callback: () => void, deps: readonly unknown[]): void {
  useEffect(() => {
    let frame = 0
    const run = () => {
      frame = 0
      callback()
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }
    run()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, deps)
}

/**
 * Returns the id of the last element (in document order) whose top edge has
 * scrolled past `offset` px from the viewport top. At the very bottom of the
 * page the last id wins, so short trailing sections can still activate.
 */
export function useScrollSpy(
  ids: readonly string[],
  offset = 140,
  enabled = true,
): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')

  useRafScroll(() => {
    if (!enabled || ids.length === 0) {
      setActive(null)
      return
    }
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
    if (atBottom && window.scrollY > 0) {
      setActive(ids[ids.length - 1])
      return
    }
    let current: string | null = null
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top - offset <= 0) current = id
    }
    setActive(current)
  }, [key, offset, enabled])

  return active
}

/** Page scroll progress in the range [0, 1]. */
export function useScrollProgress(enabled = true): number {
  const [progress, setProgress] = useState(0)
  useRafScroll(() => {
    if (!enabled) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
  }, [enabled])
  return progress
}

/** True once the page has scrolled beyond `threshold` px. */
export function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false)
  useRafScroll(() => setPast(window.scrollY > threshold), [threshold])
  return past
}
