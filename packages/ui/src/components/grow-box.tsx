import { createEffect, on, type JSX, onMount, onCleanup } from "solid-js"
import { animate, springValue, type AnimationPlaybackControls, FADE_SPRING, HEIGHT_SPRING } from "./motion"

export interface GrowBoxProps {
  children: JSX.Element
  /** Enable animation. When false, content shows immediately at full height. */
  animate?: boolean
  /** Animate height from 0 to content height. Default: true. */
  grow?: boolean
  /** Keep watching body size and animate subsequent height changes. Default: false. */
  watch?: boolean
  /** Fade in body content (opacity + blur). Default: true. */
  fade?: boolean
  /** Top padding in px on the body wrapper. Default: 0. */
  gap?: number
  /** Reset to height:auto after grow completes, or stay at fixed px. Default: true. */
  autoHeight?: boolean
  /** Controlled visibility for animating open/close without unmounting children. */
  open?: boolean
  /** Animate controlled open/close changes after mount. Default: true. */
  animateToggle?: boolean
  /** data-slot attribute on the root div. */
  slot?: string
  /** CSS class on the root div. */
  class?: string
}

/**
 * Wraps children in a container that animates from zero height on mount.
 *
 * Includes a ResizeObserver so content changes after mount are also spring-animated.
 * Used for timeline turns, assistant part groups, and user messages.
 */
export function GrowBox(props: GrowBoxProps) {
  let root: HTMLDivElement | undefined
  let body: HTMLDivElement | undefined
  let fadeAnim: AnimationPlaybackControls | undefined
  let mountFrame: number | undefined
  let resizeFrame: number | undefined
  let observer: ResizeObserver | undefined
  let springTarget = -1
  const height = springValue<number>(0, HEIGHT_SPRING)

  const gap = () => Math.max(0, props.gap ?? 0)
  const grow = () => props.grow !== false
  const watch = () => props.watch === true
  const open = () => props.open !== false
  const animateToggle = () => props.animateToggle !== false

  const hideBody = () => {
    if (!body) return
    body.style.opacity = "0"
    body.style.filter = "blur(2px)"
  }

  const clearBody = () => {
    if (!body) return
    body.style.opacity = ""
    body.style.filter = ""
  }

  const fadeBodyIn = () => {
    if (props.fade === false || !body) return
    hideBody()
    fadeAnim?.stop()
    fadeAnim = animate(body, { opacity: 1, filter: "blur(0px)" }, FADE_SPRING)
    fadeAnim.finished.then(() => {
      if (!body || !open()) return
      clearBody()
    })
  }

  const setInstant = (visible: boolean) => {
    root!.style.height = visible ? "" : "0px"
    root!.style.overflow = visible ? "" : "clip"
    if (visible || props.fade === false) clearBody()
    else hideBody()
  }

  const currentHeight = () => {
    if (!root) return 0
    const v = root.style.height
    if (v && v !== "auto") {
      const n = Number.parseFloat(v)
      if (!Number.isNaN(n)) return n
    }
    return Math.max(0, root.getBoundingClientRect().height)
  }

  const targetHeight = () => Math.max(0, Math.ceil(body?.getBoundingClientRect().height ?? 0))

  const setHeight = () => {
    if (!root || !open()) return
    const next = targetHeight()
    if (next === springTarget) return
    const prev = currentHeight()
    if (Math.abs(next - prev) < 1) {
      springTarget = next
      if (props.autoHeight === false || watch()) {
        root.style.height = `${next}px`
        root.style.overflow = next > 0 ? "visible" : "clip"
      }
      return
    }
    root.style.overflow = "clip"
    springTarget = next
    height.set(next)
  }

  onMount(() => {
    if (!root || !body) return

    const offChange = height.on("change", (next) => {
      if (!root) return
      root.style.height = `${Math.max(0, next)}px`
    })
    const offStart = height.on("animationStart", () => {
      if (!root) return
      root.style.overflow = "clip"
      root.style.willChange = "height"
      root.style.contain = "layout style"
    })
    const offComplete = height.on("animationComplete", () => {
      if (!root) return
      root.style.willChange = ""
      root.style.contain = ""
      if (!open()) {
        springTarget = 0
        root.style.height = "0px"
        root.style.overflow = "clip"
        return
      }
      const next = targetHeight()
      springTarget = next
      if (props.autoHeight === false || watch()) {
        root.style.height = `${next}px`
        root.style.overflow = next > 0 ? "visible" : "clip"
        return
      }
      root.style.height = "auto"
      root.style.overflow = "visible"
    })

    onCleanup(() => {
      offComplete()
      offStart()
      offChange()
    })

    if (!props.animate) {
      setInstant(open())
      return
    }

    if (props.fade !== false) hideBody()

    if (!open()) {
      root.style.height = "0px"
      root.style.overflow = "clip"
    } else {
      if (grow()) {
        root.style.height = "0px"
        root.style.overflow = "clip"
      } else {
        root.style.height = "auto"
        root.style.overflow = "visible"
      }
      mountFrame = requestAnimationFrame(() => {
        mountFrame = undefined
        fadeBodyIn()
        if (grow()) setHeight()
      })
    }
    if (watch()) {
      observer = new ResizeObserver(() => {
        if (!open()) return
        if (resizeFrame !== undefined) return
        resizeFrame = requestAnimationFrame(() => {
          resizeFrame = undefined
          setHeight()
        })
      })
      observer.observe(body)
    }
  })

  createEffect(
    on(
      () => props.open,
      (value) => {
        if (value === undefined) return
        if (!root || !body) return
        if (!animateToggle()) {
          setInstant(value)
          return
        }
        fadeAnim?.stop()
        if (!value) {
          const next = currentHeight()
          if (Math.abs(next - height.get()) >= 1) {
            springTarget = next
            height.jump(next)
            root.style.height = `${next}px`
          }
          if (props.fade !== false) {
            fadeAnim = animate(body, { opacity: 0, filter: "blur(2px)" }, FADE_SPRING)
          }
          root.style.overflow = "clip"
          springTarget = 0
          height.set(0)
          return
        }
        fadeBodyIn()
        setHeight()
      },
      { defer: true },
    ),
  )

  onCleanup(() => {
    if (mountFrame !== undefined) cancelAnimationFrame(mountFrame)
    if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame)
    observer?.disconnect()
    height.destroy()
    fadeAnim?.stop()
  })

  return (
    <div ref={root} data-slot={props.slot} class={props.class} style={{ transform: "translateZ(0)" }}>
      <div ref={body} style={{ "padding-top": gap() > 0 ? `${gap()}px` : undefined }}>
        {props.children}
      </div>
    </div>
  )
}
