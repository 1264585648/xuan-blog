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

export type PostCategory = '后端' | 'Agent' | '服务器' | 'AI 订阅'

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

export const categories = ['全部', '后端', 'Agent', '服务器', 'AI 订阅'] as const

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
      ['后端', 'Agent', '服务器', 'AI 订阅'].includes(meta.category)
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
