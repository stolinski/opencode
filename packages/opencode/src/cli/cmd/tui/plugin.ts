import {
  type TuiPlugin as TuiPluginFn,
  type TuiPluginInput,
  type TuiPluginModule,
  type TuiSlotPlugin,
} from "@opencode-ai/plugin/tui"
import type { JSX } from "solid-js"
import "@opentui/solid/preload"

import { Config } from "@/config/config"
import { TuiConfig } from "@/config/tui"
import { Log } from "@/util/log"
import { BunProc } from "@/bun"
import { Instance } from "@/project/instance"
import { registerThemes } from "./context/theme"

export namespace TuiPlugin {
  const log = Log.create({ service: "tui.plugin" })
  let loaded: Promise<void> | undefined

  export async function init(input: TuiPluginInput) {
    if (loaded) return loaded
    loaded = load(input)
    return loaded
  }

  async function resolve(spec: string) {
    if (spec.startsWith("file://")) return spec
    const lastAtIndex = spec.lastIndexOf("@")
    const pkg = lastAtIndex > 0 ? spec.substring(0, lastAtIndex) : spec
    const version = lastAtIndex > 0 ? spec.substring(lastAtIndex + 1) : "latest"
    return BunProc.install(pkg, version)
  }

  function slot(entry: unknown) {
    if (!entry || typeof entry !== "object") return
    if ("id" in entry && typeof entry.id === "string" && "slots" in entry && typeof entry.slots === "object") {
      return entry as TuiSlotPlugin<JSX.Element>
    }
    if (!("slots" in entry)) return
    const value = entry.slots
    if (!value || typeof value !== "object") return
    if (!("id" in value) || typeof value.id !== "string") return
    if (!("slots" in value) || typeof value.slots !== "object") return
    return value as TuiSlotPlugin<JSX.Element>
  }

  async function load(input: TuiPluginInput) {
    const dir = process.cwd()

    await Instance.provide({
      directory: dir,
      fn: async () => {
        const config = await TuiConfig.get()
        const plugins = config.plugin ?? []
        if (plugins.length) await TuiConfig.waitForDependencies()

        for (const item of plugins) {
          const spec = Config.pluginSpecifier(item)
          log.info("loading tui plugin", { path: spec })
          const target = await resolve(spec).catch((error) => {
            log.error("failed to resolve tui plugin", { path: spec, error })
            return
          })
          if (!target) continue

          const mod = await import(target).catch((error) => {
            log.error("failed to load tui plugin", { path: spec, error })
            return
          })
          if (!mod) continue

          const seen = new Set<unknown>()
          for (const entry of Object.values<TuiPluginModule>(mod)) {
            if (seen.has(entry)) continue
            seen.add(entry)

            const themes = (() => {
              if (!entry || typeof entry !== "object") return
              if (!("themes" in entry)) return
              if (!entry.themes || typeof entry.themes !== "object") return
              return entry.themes as Record<string, unknown>
            })()
            if (themes) registerThemes(themes)

            const plugin = slot(entry)
            if (plugin) {
              input.slots.register(plugin)
            }

            const tui = (() => {
              if (!entry || typeof entry !== "object") return
              if (!("tui" in entry)) return
              if (typeof entry.tui !== "function") return
              return entry.tui as TuiPluginFn
            })()
            if (!tui) continue
            await tui(input, Config.pluginOptions(item))
          }
        }
      },
    }).catch((error) => {
      log.error("failed to load tui plugins", { directory: dir, error })
    })
  }
}
