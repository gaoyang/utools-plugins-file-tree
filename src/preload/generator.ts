import fs from 'fs'
import nodePath from 'path'
import prettyBytes from 'pretty-bytes'

const DEFAULT_OPTIONS: TreeOptions = {
  allFiles: false,
  dirsFirst: false,
  dirsOnly: false,
  sizes: false,
  exclude: [],
  maxDepth: Number.POSITIVE_INFINITY,
  reverse: false,
  trailingSlash: false,
  ascii: false
}

const SYMBOLS_ANSI = {
  BRANCH: '├── ',
  EMPTY: '',
  INDENT: '    ',
  LAST_BRANCH: '└── ',
  VERTICAL: '│   '
}

const SYMBOLS_ASCII = {
  BRANCH: '|-- ',
  EMPTY: '',
  INDENT: '    ',
  LAST_BRANCH: '`-- ',
  VERTICAL: '|   '
}

const EXCLUDED_PATTERNS = [/\.DS_Store/]

export class FileTreeTextGenerator {
  constructor(options: TreeOptions) {
    this.options = options
  }

  options: TreeOptions

  public generate(path: string): string {
    const combinedOptions = Object.assign({}, DEFAULT_OPTIONS, this.options)
    return this.print(nodePath.basename(nodePath.join(process.cwd(), path)), path, 0, '', combinedOptions).join('\n')
  }

  isHiddenFile(filename: string) {
    return filename[0] === '.'
  }

  print(
    filename: string,
    path: string,
    currentDepth: number = 0,
    precedingSymbols: string = '',
    options: TreeOptions,
    isLast: boolean = false
  ): string[] {
    const isDir = fs.lstatSync(path).isDirectory()
    // We treat all non-directory paths as files and don't
    // recurse into them, including symlinks, sockets, etc.
    const isFile = !isDir

    const lines: string[] = []

    const SYMBOLS = options.ascii ? SYMBOLS_ASCII : SYMBOLS_ANSI

    // Do not show these regardless.
    for (let i = 0; i < EXCLUDED_PATTERNS.length; i++) {
      if (EXCLUDED_PATTERNS[i].test(path)) {
        return lines
      }
    }

    // Handle directories only.
    if (isFile && options.dirsOnly) {
      return lines
    }

    // Handle excluded patterns.
    for (let i = 0; i < options.exclude.length; i++) {
      if (options.exclude[i].test(path)) {
        return lines
      }
    }

    // Handle max depth.
    if (currentDepth > options.maxDepth) {
      return lines
    }

    // Handle current file.
    const line = [precedingSymbols]
    if (currentDepth >= 1) {
      line.push(isLast ? SYMBOLS.LAST_BRANCH : SYMBOLS.BRANCH)
    }

    if (isFile && options.sizes) {
      const fileSize = fs.statSync(path).size
      const prettifiedFileSize = prettyBytes(fileSize)
      line.push(prettifiedFileSize.replace(' ', ''))
      line.push(' ')
    }
    line.push(filename)
    if (isDir && options.trailingSlash) {
      line.push('/')
    }
    lines.push(line.join(''))

    if (isFile) {
      return lines
    }

    // Contents of a directory.
    let contents = fs.readdirSync(path)
    contents.sort()

    if (options.reverse) {
      contents.reverse()
    }

    // Handle showing of all files.
    if (!options.allFiles) {
      contents = contents.filter(content => !this.isHiddenFile(content))
    }

    if (options.dirsOnly) {
      // We have to filter here instead of at the start of the function
      // because we need to know how many non-directories there are before
      // we even start recursing.
      contents = contents.filter(file => fs.lstatSync(nodePath.join(path, file)).isDirectory())
    }

    // Sort directories first.
    if (options.dirsFirst) {
      const dirs = contents.filter(content => fs.lstatSync(nodePath.join(path, content)).isDirectory())

      const files = contents.filter(content => !fs.lstatSync(nodePath.join(path, content)).isDirectory())
      contents = dirs.concat(files)
    }

    contents.forEach((content, index) => {
      const isCurrentLast = index === contents.length - 1
      const linesForFile = this.print(
        content,
        nodePath.join(path, content),
        currentDepth + 1,
        precedingSymbols + (currentDepth >= 1 ? (isLast ? SYMBOLS.INDENT : SYMBOLS.VERTICAL) : SYMBOLS.EMPTY),
        options,
        isCurrentLast
      )
      lines.push.apply(lines, linesForFile)
    })
    return lines
  }
}

export interface TreeOptions {
  allFiles: boolean
  dirsFirst: boolean
  dirsOnly: boolean
  sizes: boolean
  exclude: RegExp[]
  maxDepth: number
  reverse: boolean
  trailingSlash: boolean
  ascii: boolean
}
