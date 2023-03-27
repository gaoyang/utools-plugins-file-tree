import { FileTreeTextGenerator, TreeOptions } from './fileTreeTextGenerator'

export function generate(path: string, options: TreeOptions): string {
  const generator = new FileTreeTextGenerator(options)
  return generator.generate(path)
}

export async function handlePluginEnter({
  code,
  type,
  payload
}: Parameters<Parameters<typeof utools.onPluginEnter>[0]>[0]) {
  window.dispatchEvent(new CustomEvent('tool-plugin-enter', { detail: 'some thing' }))
}

utools.onPluginEnter(handlePluginEnter)

utools.onPluginOut(async exit => {})
