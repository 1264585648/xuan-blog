export type PostSection = {
  heading?: string
  paragraphs: string[]
  quote?: string
  bullets?: string[]
  codeSnippet?: {
    lang: string
    code: string
  }
}

export type PostCategory = '前端' | '设计' | '工程' | '随笔'

export type Post = {
  id: string
  title: string
  date: string
  shortDate: string
  category: PostCategory
  tags: string[]
  summary: string
  readTime: string
  featured?: boolean
  shelfId?: string
  sections: PostSection[]
  relatedIds: string[]
}

export type PostGroup = {
  year: string
  posts: Post[]
}

export type Shelf = {
  id: string
  index: string
  title: string
  description: string
  count: number
}

export type ProjectItem = {
  name: string
  year: string
  description: string
  stack: string[]
  repoUrl: string
}

export const categories = ['全部', '前端', '设计', '工程', '随笔'] as const

export const shelves: Shelf[] = [
  {
    id: 'ui-engineering',
    index: '01',
    title: '界面工程与组件设计',
    description: '关注无障碍交互、键盘导航、焦点管理与基础组件库的实现细节。',
    count: 3,
  },
  {
    id: 'typography-tokens',
    index: '02',
    title: '设计系统与排版细节',
    description: '记录 CSS 变量分层、深浅色对比度调校，以及中西文混排的视觉规范。',
    count: 3,
  },
  {
    id: 'indie-notes',
    index: '03',
    title: '开发复盘与日常记录',
    description: '业余项目的踩坑总结、工具链简化过程，以及每年的阅读记录。',
    count: 3,
  },
]

export const projects: ProjectItem[] = [
  {
    name: 'xuan-blog',
    year: '2025',
    description: '当前个人网站源码，基于 React + TypeScript + Vite 构建的极简静态博客。',
    stack: ['React', 'TypeScript', 'Markdown'],
    repoUrl: 'https://github.com/1264585648/xuan-blog',
  },
  {
    name: 'paper-tokens',
    year: '2024',
    description: '面向长文阅读的网页色彩与中西文混排 CSS 变量规范。',
    stack: ['CSS Variables', 'Typography'],
    repoUrl: 'https://github.com/1264585648',
  },
  {
    name: 'cmdk-lite',
    year: '2024',
    description: '零外部依赖、支持中文输入法合成事件处理的轻量级命令面板组件。',
    stack: ['TypeScript', 'A11y'],
    repoUrl: 'https://github.com/1264585648',
  },
]

function parseFrontmatter(raw: string): {
  meta: Record<string, string>
  body: string
} {
  const normalized = raw.replace(/\r\n/g, '\n').trim()
  if (!normalized.startsWith('---\n')) {
    return { meta: {}, body: normalized }
  }
  const endIdx = normalized.indexOf('\n---\n', 4)
  if (endIdx === -1) {
    return { meta: {}, body: normalized }
  }
  const header = normalized.slice(4, endIdx)
  const body = normalized.slice(endIdx + 5).trim()
  const meta: Record<string, string> = {}
  for (const line of header.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim()
      meta[key] = val
    }
  }
  return { meta, body }
}

function parseMarkdownSections(body: string): PostSection[] {
  const blocks = body.split(/\n##\s+/)
  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const heading = index > 0 ? lines.shift()?.trim() : undefined
    const paragraphs: string[] = []
    const bullets: string[] = []
    let quote: string | undefined
    let codeSnippet: { lang: string; code: string } | undefined

    let inCode = false
    let codeLang = ''
    let codeLines: string[] = []

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (!inCode) {
          inCode = true
          codeLang = line.slice(3).trim() || 'text'
          codeLines = []
        } else {
          inCode = false
          codeSnippet = { lang: codeLang, code: codeLines.join('\n') }
        }
        continue
      }
      if (inCode) {
        codeLines.push(line)
        continue
      }
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('- ')) {
        bullets.push(trimmed.slice(2).trim())
      } else if (trimmed.startsWith('> ')) {
        quote = trimmed.slice(2).trim()
      } else {
        paragraphs.push(trimmed)
      }
    }

    return {
      heading,
      paragraphs,
      quote,
      bullets: bullets.length > 0 ? bullets : undefined,
      codeSnippet,
    }
  })
}

const markdownFiles = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const allParsedPosts: Post[] = Object.entries(markdownFiles)
  .map(([filePath, rawContent]) => {
    const fileName = filePath.split('/').pop() ?? ''
    const id = fileName.replace(/\.md$/, '')
    const { meta, body } = parseFrontmatter(rawContent)
    const date = meta.date || '2025-01-01'
    const [, month = '01', day = '01'] = date.split('-')
    const shortDate = `${month}.${day}`
    const category = (
      ['前端', '设计', '工程', '随笔'].includes(meta.category)
        ? meta.category
        : '随笔'
    ) as PostCategory
    const tags = meta.tags
      ? meta.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const relatedIds = meta.relatedIds
      ? meta.relatedIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const charCount = body.replace(/\s+/g, '').length
    const estimatedMin = Math.max(2, Math.round(charCount / 260))

    return {
      id,
      title: meta.title || id,
      date,
      shortDate,
      category,
      tags,
      summary: meta.summary || '',
      readTime: meta.readTime || `${estimatedMin} min`,
      featured: meta.featured === 'true',
      shelfId: meta.shelfId || undefined,
      sections: parseMarkdownSections(body),
      relatedIds,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

const groupedMap = new Map<string, Post[]>()
for (const post of allParsedPosts) {
  const year = post.date.slice(0, 4)
  const list = groupedMap.get(year) ?? []
  list.push(post)
  groupedMap.set(year, list)
}

export const postGroups: PostGroup[] = Array.from(groupedMap.entries())
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([year, posts]) => ({ year, posts }))
