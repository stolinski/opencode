import { expect, mock, spyOn, test } from "bun:test"
import fs from "fs/promises"
import path from "path"
import { pathToFileURL } from "url"
import type { TuiPluginInput } from "@opencode-ai/plugin/tui"
import { tmpdir } from "../../fixture/fixture"
import { Log } from "../../../src/util/log"

mock.module("@opentui/solid/preload", () => ({}))
mock.module("@opentui/solid/jsx-runtime", () => ({
  Fragment: Symbol.for("Fragment"),
  jsx: () => null,
  jsxs: () => null,
  jsxDEV: () => null,
}))
const { TuiPlugin } = await import("../../../src/cli/cmd/tui/plugin")

async function waitForLog(text: string, timeout = 1000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const file = Log.file()
    if (file) {
      const content = await Bun.file(file)
        .text()
        .catch(() => "")
      if (content.includes(text)) return content
    }
    await Bun.sleep(25)
  }
  return Bun.file(Log.file())
    .text()
    .catch(() => "")
}

test("ignores function-only tui exports and loads object exports", async () => {
  await using tmp = await tmpdir({
    init: async (dir) => {
      const pluginPath = path.join(dir, "plugin.ts")
      const fnMarker = path.join(dir, "function-called.txt")
      const objMarker = path.join(dir, "object-called.txt")
      const configPath = path.join(dir, "tui.json")

      await Bun.write(
        pluginPath,
        [
          "export default async (_input, options) => {",
          "  if (!options?.fn_marker) return",
          "  await Bun.write(options.fn_marker, 'called')",
          "}",
          "",
          "export const object_plugin = {",
          "  tui: async (_input, options) => {",
          "    if (!options?.obj_marker) return",
          "    await Bun.write(options.obj_marker, 'called')",
          "  },",
          "}",
          "",
        ].join("\n"),
      )

      await Bun.write(
        configPath,
        JSON.stringify(
          {
            plugin: [[pathToFileURL(pluginPath).href, { fn_marker: fnMarker, obj_marker: objMarker }]],
          },
          null,
          2,
        ),
      )

      return {
        configPath,
        fnMarker,
        objMarker,
      }
    },
  })

  process.env.OPENCODE_TUI_CONFIG = tmp.extra.configPath
  const cwd = spyOn(process, "cwd").mockImplementation(() => tmp.path)

  try {
    const input = {
      client: {} as TuiPluginInput["client"],
      event: {
        on: () => () => {},
      },
      renderer: {} as TuiPluginInput["renderer"],
      slots: {
        register: () => () => {},
      },
    } satisfies TuiPluginInput

    await TuiPlugin.init(input)

    expect(await fs.readFile(tmp.extra.objMarker, "utf8")).toBe("called")
    await expect(fs.readFile(tmp.extra.fnMarker, "utf8")).rejects.toThrow()

    const log = await waitForLog("ignoring non-object tui plugin export")
    expect(log).toContain("ignoring non-object tui plugin export")
    expect(log).toContain("name=default")
    expect(log).toContain("type=function")
  } finally {
    cwd.mockRestore()
    delete process.env.OPENCODE_TUI_CONFIG
  }
})
