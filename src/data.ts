export type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'quote'; lines: string[]; variant?: 'tip' | 'note' | 'warning' }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'hr' }

export type PostSection = {
  heading?: string
  blocks: MarkdownBlock[]
  paragraphs: string[]
  quote?: string
  bullets?: string[]
  codeSnippet?: {
    lang: string
    code: string
  }
}

export type PostCategory = '后端' | 'Agent' | '服务器' | 'AI 订阅' | '海外订阅'

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

export const categories = ['全部', '后端', 'Agent', '服务器', 'AI 订阅', '海外订阅'] as const

export const shelves: Shelf[] = [
  {
    id: 'backend-arch',
    index: '01',
    title: '后端架构与高可用实践',
    description: '聚焦高并发读写链路、幂等与分布式锁、数据库慢查询治理及缓存一致性经验。',
    count: 2,
  },
  {
    id: 'agent-engineering',
    index: '02',
    title: 'AI Agent 工程与协议落地',
    description: '从手写 ReAct 循环、MCP 工具协议封装到多智能体状态机与生产级安全护栏。',
    count: 2,
  },
  {
    id: 'server-infra',
    index: '03',
    title: '服务器运维与边缘基建',
    description: '记录 Linux 服务器安全加固、Docker 容器编排、反向代理与 Cloudflare 边缘部署。',
    count: 2,
  },
  {
    id: 'ai-subscriptions',
    index: '04',
    title: 'AI 订阅实测与工具配比',
    description: '深度横评 Claude、ChatGPT、Gemini 与主流编程工具订阅，梳理最高性价比模型分流方案。',
    count: 2,
  },
  {
    id: 'overseas-subscriptions',
    index: '05',
    title: '海外订阅与跨境支付实操',
    description: '涵盖海外虚拟卡开卡、KYC 实名、USDT 链上充币、美区 Apple ID 与 ChatGPT/Claude 订阅避坑指南。',
    count: 1,
  },
]

export const projects: ProjectItem[] = [
  {
    name: 'xuan-blog',
    year: '2026',
    description: '个人技术博客与交互式 AI Agent 全景学习脑图，基于静态构建配合边缘网络自动发布。',
    stack: ['TypeScript', 'React', 'Cloudflare Pages'],
    repoUrl: 'https://github.com/1264585648/xuan-blog',
  },
  {
    name: 'agent-mcp-toolkit',
    year: '2026',
    description: '面向后端研发排障场景的轻量 MCP Server 集合，支持只读库表诊断、慢日志聚合与链路检索。',
    stack: ['MCP', 'Python', 'AgentOps'],
    repoUrl: 'https://github.com/1264585648',
  },
  {
    name: 'server-bootstrap',
    year: '2025',
    description: '个人云服务器开箱初始化脚本与 Docker Compose 模板库，内置防火墙规则、证书续签与状态告警。',
    stack: ['Docker', 'Linux', 'Nginx'],
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

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim())
}

function parseMarkdownSections(body: string): PostSection[] {
  const blocks = body.split(/\n##\s+/)
  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const heading = index > 0 ? lines.shift()?.trim() : undefined
    const parsedBlocks: MarkdownBlock[] = []
    const paragraphs: string[] = []
    const bullets: string[] = []
    let quote: string | undefined
    let codeSnippet: { lang: string; code: string } | undefined

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        i++
        continue
      }

      if (trimmed.startsWith('```')) {
        const codeLang = trimmed.slice(3).trim() || 'text'
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        if (i < lines.length) i++
        const code = codeLines.join('\n')
        codeSnippet = { lang: codeLang, code }
        parsedBlocks.push({ type: 'code', lang: codeLang, code })
        continue
      }

      if (/^---+$/.test(trimmed)) {
        parsedBlocks.push({ type: 'hr' })
        i++
        continue
      }

      if (trimmed.startsWith('#### ')) {
        parsedBlocks.push({ type: 'heading', level: 4, text: trimmed.slice(5).trim() })
        i++
        continue
      }
      if (trimmed.startsWith('### ')) {
        parsedBlocks.push({ type: 'heading', level: 3, text: trimmed.slice(4).trim() })
        i++
        continue
      }

      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (imgMatch) {
        parsedBlocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] })
        i++
        continue
      }

      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = []
        let variant: 'tip' | 'note' | 'warning' | undefined
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          const qText = lines[i].trim().replace(/^>\s?/, '').trim()
          const tagMatch = qText.match(/^\[!(TIP|NOTE|WARNING)\]$/i)
          if (tagMatch && quoteLines.length === 0) {
            variant = tagMatch[1].toLowerCase() as 'tip' | 'note' | 'warning'
          } else if (qText) {
            quoteLines.push(qText)
          }
          i++
        }
        if (quoteLines.length > 0) {
          quote = quoteLines.join(' ')
          parsedBlocks.push({ type: 'quote', lines: quoteLines, variant })
        }
        continue
      }

      if (
        trimmed.includes('|') &&
        i + 1 < lines.length &&
        isTableSeparator(lines[i + 1])
      ) {
        const headers = parseTableRow(trimmed)
        i += 2
        const rows: string[][] = []
        while (i < lines.length && lines[i].trim().includes('|') && !lines[i].trim().startsWith('>')) {
          rows.push(parseTableRow(lines[i]))
          i++
        }
        parsedBlocks.push({ type: 'table', headers, rows })
        continue
      }

      const isUnordered = /^[-*]\s+/.test(trimmed)
      const isOrdered = /^\d+\.\s+/.test(trimmed)
      if (isUnordered || isOrdered) {
        const items: string[] = []
        const ordered = isOrdered
        while (i < lines.length) {
          const curr = lines[i]
          const currTrimmed = curr.trim()
          if (!currTrimmed) {
            // Stop list on blank line unless next line continues the same list
            const nextTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : ''
            const nextContinues = ordered
              ? /^\d+\.\s+/.test(nextTrimmed)
              : /^[-*]\s+/.test(nextTrimmed)
            if (!nextContinues) break
            i++
            continue
          }
          if (ordered && /^\d+\.\s+/.test(currTrimmed)) {
            items.push(currTrimmed.replace(/^\d+\.\s+/, '').trim())
            i++
          } else if (!ordered && /^[-*]\s+/.test(currTrimmed)) {
            const itemText = currTrimmed.replace(/^[-*]\s+/, '').trim()
            items.push(itemText)
            bullets.push(itemText)
            i++
          } else if (/^\s+[-*]\s+/.test(curr) && items.length > 0) {
            // Indented sub-bullet inside ordered/unordered item
            const sub = currTrimmed.replace(/^[-*]\s+/, '').trim()
            items[items.length - 1] += `\n${sub}`
            i++
          } else {
            break
          }
        }
        parsedBlocks.push({ type: 'list', ordered, items })
        continue
      }

      paragraphs.push(trimmed)
      parsedBlocks.push({ type: 'paragraph', text: trimmed })
      i++
    }

    return {
      heading,
      blocks: parsedBlocks,
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
      ['后端', 'Agent', '服务器', 'AI 订阅', '海外订阅'].includes(meta.category)
        ? meta.category
        : '后端'
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
