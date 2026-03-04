export { animate, springValue } from "motion"
export type { AnimationPlaybackControls } from "motion"

const HEIGHT_DURATION = 0.5
const FADE_DURATION = 0.5
const COLLAPSIBLE_CONTENT_HEIGHT_DURATION = 0.3
const COLLAPSIBLE_CONTENT_FADE_DURATION = COLLAPSIBLE_CONTENT_HEIGHT_DURATION

export const HEIGHT_SPRING = {
  type: "spring" as const,
  visualDuration: HEIGHT_DURATION,
  bounce: 0,
}

export const COLLAPSIBLE_CONTENT_HEIGHT_SPRING = {
  type: "spring" as const,
  visualDuration: COLLAPSIBLE_CONTENT_HEIGHT_DURATION,
  bounce: 0,
}

export const FADE_SPRING = {
  type: "spring" as const,
  visualDuration: FADE_DURATION,
  bounce: 0,
}

export const COLLAPSIBLE_CONTENT_FADE_SPRING = {
  type: "spring" as const,
  visualDuration: COLLAPSIBLE_CONTENT_FADE_DURATION,
  bounce: 0,
}

export const FAST_SPRING = {
  type: "spring" as const,
  visualDuration: 0.35,
  bounce: 0,
}

export const GLOW_SPRING = {
  type: "spring" as const,
  visualDuration: 0.4,
  bounce: 0.15,
}

export const WIPE_MASK =
  "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0) 100%)"

export const clearMaskStyles = (el: HTMLElement) => {
  el.style.maskImage = ""
  el.style.webkitMaskImage = ""
  el.style.maskSize = ""
  el.style.webkitMaskSize = ""
  el.style.maskRepeat = ""
  el.style.webkitMaskRepeat = ""
  el.style.maskPosition = ""
  el.style.webkitMaskPosition = ""
}

export const clearFadeStyles = (el: HTMLElement) => {
  el.style.opacity = ""
  el.style.filter = ""
  el.style.transform = ""
}
