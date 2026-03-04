import type { createOpencodeClient as createOpencodeClientV2, Event as TuiEvent } from "@opencode-ai/sdk/v2"
import type { CliRenderer } from "@opentui/core"
import type { Plugin, PluginOptions } from "./index"

export type { CliRenderer } from "@opentui/core"

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

export type SlotMode = "append" | "replace" | "single_winner"

type SlotRenderer<Node, Props, Context extends object = object> = (ctx: Readonly<Context>, props: Props) => Node

type SlotPlugin<Node, Slots extends object, Context extends object = object> = {
  id: string
  order?: number
  setup?: (ctx: Readonly<Context>, renderer: CliRenderer) => void
  dispose?: () => void
  slots: {
    [K in keyof Slots]?: SlotRenderer<Node, Slots[K], Context>
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

export type TuiSlotPlugin<Node = unknown> = SlotPlugin<Node, TuiSlotMap, TuiSlotContext>

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

export type TuiPluginModule<Renderer = CliRenderer> =
  | TuiPlugin<Renderer>
  | {
      server?: Plugin
      tui?: TuiPlugin<Renderer>
      slots?: TuiSlotPlugin
      themes?: Record<string, ThemeJson>
    }
