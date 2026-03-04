import type { createOpencodeClient as createOpencodeClientV2, Event as TuiEvent } from "@opencode-ai/sdk/v2"
import type { CliRenderer, Plugin as CorePlugin } from "@opentui/core"
import type { Plugin as ServerPlugin, PluginOptions } from "./index"

export type { CliRenderer, SlotMode } from "@opentui/core"

type HexColor = `#${string}`
type RefName = string
type Variant = {
  dark: HexColor | RefName | number
  light: HexColor | RefName | number
}
type ThemeColorValue = HexColor | RefName | number | Variant

export type ThemeJson = {
  $schema?: string
  defs?: Record<string, HexColor | RefName>
  theme: Record<string, ThemeColorValue> & {
    selectedListItemText?: ThemeColorValue
    backgroundMenu?: ThemeColorValue
    thinkingOpacity?: number
  }
}

export type TuiSlotMap = {
  home_hint: {}
  home_footer: {}
  session_footer: {
    session_id: string
  }
}

export type TuiSlotContext = {}

export type TuiSlotPlugin<Node = unknown> = CorePlugin<Node, TuiSlotMap, TuiSlotContext>

export type TuiSlots = {
  register: (plugin: TuiSlotPlugin) => () => void
}

export type TuiEventBus = {
  on: <Type extends TuiEvent["type"]>(
    type: Type,
    handler: (event: Extract<TuiEvent, { type: Type }>) => void,
  ) => () => void
}

export type TuiPluginInput<Renderer = CliRenderer> = {
  client: ReturnType<typeof createOpencodeClientV2>
  event: TuiEventBus
  renderer: Renderer
  slots: TuiSlots
}

export type TuiPlugin<Renderer = CliRenderer> = (
  input: TuiPluginInput<Renderer>,
  options?: PluginOptions,
) => Promise<void>

export type TuiPluginModule<Renderer = CliRenderer> = {
  server?: ServerPlugin
  tui?: TuiPlugin<Renderer>
  slots?: TuiSlotPlugin
  themes?: Record<string, ThemeJson>
}
