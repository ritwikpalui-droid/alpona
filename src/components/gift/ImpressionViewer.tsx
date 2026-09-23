'use client'

import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from 'react'

export interface ImpressionViewerProps {
  angleDeg: number
  onAngleChange: (angleDeg: number) => void
  children: ReactNode
  /** Degrees of rotation per pixel of horizontal drag. */
  sensitivity?: number
}

/**
 * The "hold and rotate" gesture, decoupled from what it's rotating — the
 * same drag handler drives a bouquet's full 360° spin or a chocolate box's
 * bounded wobble, whichever the caller's `onAngleChange` chooses to clamp.
 *
 * Batches every pointermove into at most one state update per animation
 * frame — dragging fast fires far more pointermove events than the screen
 * can even repaint, and committing each one straight to React would mean
 * piling up renders faster than they can flush. This is the same "paint
 * once, transform per frame" discipline `rotation.ts` documents for the
 * geometry itself, applied to the input side of the same pipeline.
 */
export default function ImpressionViewer({ angleDeg, onAngleChange, children, sensitivity = 0.4 }: ImpressionViewerProps) {
  const dragRef = useRef<{ startX: number; startAngle: number; pointerId: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const flush = useCallback(() => {
    rafRef.current = null
    if (pendingRef.current !== null) {
      onAngleChange(pendingRef.current)
      pendingRef.current = null
    }
  }, [onAngleChange])

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startAngle: angleDeg, pointerId: e.pointerId }
    setDragging(true)
  }, [angleDeg])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const dx = e.clientX - d.startX
    let next = (d.startAngle + dx * sensitivity) % 360
    if (next < 0) next += 360
    pendingRef.current = next
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(flush)
  }, [sensitivity, flush])

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
    setDragging(false)
  }, [])

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab', display: 'inline-block', userSelect: 'none' }}
    >
      {children}
    </div>
  )
}
