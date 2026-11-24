import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  GitBranch,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from './icons'
import { AgentMindmap } from './AgentMindmap'
import {
  countTreeStats,
  createInitialAgentMindmap,
  MINDMAP_STORAGE_KEY,
  type MindNode,
} from './mindmapData'
import {
  categories,
  postGroups,
  projects,
  shelves,
  type Post,
} from './data'

const flatPosts = postGroups.flatMap((group) => group.posts)

type AccentTheme = 'sage' | 'Slate' | 'sand'

const accentSwatches: { id: AccentTheme; label: string; className: string }[] = [
  { id: 'sage', label: '松石绿', className: 'swatch-sage' },
  { id: 'Slate', label: '岩灰蓝', className: 'swatch-slate' },
  { id: 'sand', label: '暖赭石', className: 'swatch-sand' },
]

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('xuan-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })
  const [accent, setAccent] = useState<AccentTheme>(() => {
    const saved = localStorage.getItem('xuan-accent')
    return saved === 'Slate' || saved === 'sand' ? saved : 'sage'
  })
  const [activeCategory, setActiveCategory] = useState<string>('全部')
  const [activeShelf, setActiveShelf] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<
    'articles' | 'shelves' | 'mindmap' | 'projects' | 'about'
  >(() => (window.location.hash === '#mindmap' ? 'mindmap' : 'articles'))
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [mindmapSummary, setMindmapSummary] = useState(() => {
    try {
      const raw = localStorage.getItem(MINDMAP_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MindNode
        if (parsed && parsed.id === 'root' && Array.isArray(parsed.children)) {
          return {
            modules: parsed.children.length,
            ...countTreeStats(parsed),
          }
        }
      }
    } catch {
      // fallback
    }
    const def = createInitialAgentMindmap()
    return {
      modules: def.children.length,
      ...countTreeStats(def),
    }
  })

  const handleMindmapChange = (root: MindNode) => {
    setMindmapSummary({
      modules: root.children.length,
      ...countTreeStats(root),
    })
  }

  const navigateSection = (
    target: 'articles' | 'shelves' | 'mindmap' | 'projects' | 'about',
  ) => {
    const wasMindmap = activeNav === 'mindmap'
    setActiveNav(target)
    setMenuOpen(false)
    if (target === 'mindmap') {
      window.history.replaceState(null, '', '#mindmap')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.history.replaceState(null, '', `#${target}`)
      if (wasMindmap) {
        requestAnimationFrame(() => {
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
        })
      }
    }
  }

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    localStorage.setItem('xuan-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('xuan-accent', accent)
  }, [accent])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setSelectedPostId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 全部: flatPosts.length }
    for (const post of flatPosts) {
      counts[post.category] = (counts[post.category] ?? 0) + 1
    }
    return counts
  }, [])

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return postGroups
      .map((group) => ({
        ...group,
        posts: group.posts.filter((post) => {
          const matchesCategory =
            activeCategory === '全部' || post.category === activeCategory
          const matchesShelf = !activeShelf || post.shelfId === activeShelf
          const haystack =
            `${post.title} ${post.summary} ${post.category} ${post.tags.join(' ')}`.toLowerCase()
          const matchesQuery =
            !normalizedQuery || haystack.includes(normalizedQuery)
          return matchesCategory && matchesShelf && matchesQuery
        }),
      }))
      .filter((group) => group.posts.length > 0)
  }, [activeCategory, activeShelf, query])

  const selectedPost = useMemo<Post | null>(
    () => flatPosts.find((post) => post.id === selectedPostId) ?? null,
    [selectedPostId],
  )

  const adjacentPosts = useMemo(() => {
    if (!selectedPost) return { prev: null, next: null }
    const idx = flatPosts.findIndex((p) => p.id === selectedPost.id)
    return {
      prev: idx > 0 ? flatPosts[idx - 1] : null,
      next:
        idx >= 0 && idx < flatPosts.length - 1 ? flatPosts[idx + 1] : null,
    }
  }, [selectedPost])

  const activeShelfObj = shelves.find((s) => s.id === activeShelf)

  const clearFilters = () => {
    setActiveCategory('全部')
    setActiveShelf(null)
    setQuery('')
  }

  return (
    <div
      className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''} accent-${accent.toLowerCase()}`}
    >
      {/* MOBILE HEADER ONLY */}
      <header className="mobile-bar">
        <a
          className="brand"
          href="#top"
          onClick={() => {
            if (activeNav === 'mindmap') navigateSection('articles')
          }}
        >
          <span className="brand-dot" />
          <span>朱轩 · Xuan</span>
        </a>
        <div className="mobile-bar-actions">
          <button
            className="icon-btn"
            type="button"
            aria-label="切换深浅色"
            onClick={() =>
              setTheme((value) => (value === 'light' ? 'dark' : 'light'))
            }
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label="打开导航"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* MINIMAL LEFT RAIL */}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <a
              className="brand"
              href="#top"
              onClick={() => {
                if (activeNav === 'mindmap') navigateSection('articles')
                else setMenuOpen(false)
              }}
            >
              <span className="brand-dot" />
              <span>朱轩 · Xuan</span>
            </a>
            <button
              className="icon-btn sidebar-close"
              type="button"
              aria-label="关闭菜单"
              onClick={() => setMenuOpen(false)}
            >
              <X size={17} />
            </button>
          </div>
          <p className="sidebar-role">Backend &amp; Agent Engineer</p>
          <p className="sidebar-bio">
            专注后端服务架构、AI Agent 工程落地与自建服务器基建。这里用来沉淀平时的架构复盘、运维折腾手记与主流 AI 订阅实测。
          </p>
        </div>

        <nav className="side-nav" aria-label="主导航">
          <a
            className={`nav-item ${activeNav === 'articles' ? 'active' : ''}`}
            href="#articles"
            onClick={(e) => {
              if (activeNav === 'mindmap') e.preventDefault()
              navigateSection('articles')
            }}
          >
            <span className="nav-idx">01</span>
            <span className="nav-label">文章</span>
            <span className="nav-count">{flatPosts.length}</span>
          </a>
          <a
            className={`nav-item ${activeNav === 'shelves' ? 'active' : ''}`}
            href="#shelves"
            onClick={(e) => {
              if (activeNav === 'mindmap') e.preventDefault()
              navigateSection('shelves')
            }}
          >
            <span className="nav-idx">02</span>
            <span className="nav-label">专题</span>
            <span className="nav-count">{shelves.length}</span>
          </a>
          <a
            className={`nav-item ${activeNav === 'mindmap' ? 'active' : ''}`}
            href="#mindmap"
            onClick={(e) => {
              e.preventDefault()
              navigateSection('mindmap')
            }}
          >
            <span className="nav-idx">03</span>
            <span className="nav-label">知识脑图</span>
            <span className="nav-count">{mindmapSummary.totalNodes}</span>
          </a>
          <a
            className={`nav-item ${activeNav === 'projects' ? 'active' : ''}`}
            href="#projects"
            onClick={(e) => {
              if (activeNav === 'mindmap') e.preventDefault()
              navigateSection('projects')
            }}
          >
            <span className="nav-idx">04</span>
            <span className="nav-label">项目</span>
            <span className="nav-count">{projects.length}</span>
          </a>
          <a
            className={`nav-item ${activeNav === 'about' ? 'active' : ''}`}
            href="#about"
            onClick={(e) => {
              if (activeNav === 'mindmap') e.preventDefault()
              navigateSection('about')
            }}
          >
            <span className="nav-idx">05</span>
            <span className="nav-label">关于</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="appearance-row">
            <button
              type="button"
              className="theme-btn"
              onClick={() =>
                setTheme((value) => (value === 'light' ? 'dark' : 'light'))
              }
            >
              {theme === 'light' ? (
                <>
                  <Moon size={13} />
                  <span>深色模式</span>
                </>
              ) : (
                <>
                  <Sun size={13} />
                  <span>浅色模式</span>
                </>
              )}
            </button>

            <div className="swatches" role="group" aria-label="点缀色">
              {accentSwatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`swatch ${item.className} ${accent === item.id ? 'active' : ''}`}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setAccent(item.id)}
                />
              ))}
            </div>
          </div>

          <div className="ext-links">
            <a
              href="https://github.com/1264585648/xuan-blog"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowUpRight size={11} />
            </a>
            <a href="mailto:hello@example.com">
              Email <ArrowUpRight size={11} />
            </a>
            <a href="#articles">
              RSS <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="drawer-scrim"
          type="button"
          aria-label="关闭菜单"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* MAIN EDITORIAL CANVAS */}
      <main className="main-canvas" id="top">
        {activeNav === 'mindmap' ? (
          <div className="canvas-inner canvas-inner-wide">
            <AgentMindmap
              onBackToArticles={() => navigateSection('articles')}
              onTreeChange={handleMindmapChange}
            />
          </div>
        ) : (
        <div className="canvas-inner">
          {/* HEADER */}
          <header className="page-header">
            <div className="header-left">
              <p className="section-index">INDEX / ARCHIVE</p>
              <h1>笔记与归档</h1>
              <p className="header-sub">
                按时间倒序整理的后端架构、AI Agent 实践、服务器基建与 AI 订阅实测。
              </p>
            </div>
            <div className="header-right">
              <div className="now-brief">
                <span className="now-dot-label">
                  <i className="live-dot" /> 近况 · 2026
                </span>
                <p>
                  近期在打磨面向后端研发场景的 MCP 工具链与多智能体编排，顺手折腾边缘网络反代及手头几家主力 AI 订阅方案的配比优化。
                </p>
              </div>
            </div>
          </header>

          {/* ARTICLES SECTION */}
          <section className="section-block" id="articles">
            <div className="filter-bar">
              <div className="category-tabs" role="tablist" aria-label="文章分类">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat}
                    className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <span>{cat}</span>
                    <small>{categoryCounts[cat] ?? 0}</small>
                  </button>
                ))}
                {activeShelfObj && (
                  <button
                    type="button"
                    className="active-shelf-tag"
                    onClick={() => setActiveShelf(null)}
                  >
                    <span>专题：{activeShelfObj.title}</span>
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="search-field">
                <Search size={14} />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索文章或标签…"
                  aria-label="搜索文章"
                />
                {query ? (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setQuery('')}
                    aria-label="清空"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <kbd>/</kbd>
                )}
              </div>
            </div>

            <div className="archive-table">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div className="year-row-group" key={group.year}>
                    <div className="year-col">
                      <span className="year-num">{group.year}</span>
                    </div>
                    <div className="posts-col">
                      {group.posts.map((post) => (
                        <article
                          key={post.id}
                          className="post-item"
                          onClick={() => setSelectedPostId(post.id)}
                        >
                          <div className="post-item-main">
                            <h2 className="post-item-title">
                              {post.title}
                              {post.featured && (
                                <span className="featured-dot" title="精选文章" />
                              )}
                            </h2>
                            <p className="post-item-summary">{post.summary}</p>
                          </div>

                          <div className="post-item-aside">
                            <span className="post-item-cat">
                              {post.category}
                            </span>
                            <time className="post-item-date">
                              {post.shortDate}
                            </time>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-box">
                  <p>未找到匹配的文章。</p>
                  <button type="button" onClick={clearFilters}>
                    重置筛选条件
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SHELVES / TOPICS SECTION */}
          <section className="section-block" id="shelves">
            <div className="block-header">
              <div>
                <p className="section-index">TOPICS / 02</p>
                <h2>专题整理</h2>
              </div>
              <span className="block-note">围绕四大核心技术方向归类的系列笔记</span>
            </div>

            <div className="hairline-grid shelves-grid">
              {shelves.map((shelf) => {
                const shelfPosts = flatPosts.filter(
                  (p) => p.shelfId === shelf.id,
                )
                const isSelected = activeShelf === shelf.id
                return (
                  <div
                    key={shelf.id}
                    className={`hairline-cell ${isSelected ? 'cell-active' : ''}`}
                  >
                    <div className="cell-top">
                      <span className="cell-index">{shelf.index}</span>
                      <button
                        type="button"
                        className="cell-filter-btn"
                        onClick={() => {
                          setActiveShelf((prev) =>
                            prev === shelf.id ? null : shelf.id,
                          )
                          document
                            .getElementById('articles')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        {isSelected ? '取消筛选' : `${shelfPosts.length} 篇 →`}
                      </button>
                    </div>
                    <h3>{shelf.title}</h3>
                    <p className="cell-desc">{shelf.description}</p>
                    <ul className="cell-links">
                      {shelfPosts.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedPostId(p.id)}
                          >
                            <span>{p.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>

          {/* KNOWLEDGE ATLAS / MINDMAP SHOWCASE SECTION */}
          <section className="section-block" id="atlas-preview">
            <div className="block-header">
              <div>
                <p className="section-index">KNOWLEDGE ATLAS / 03</p>
                <h2>交互式知识脑图</h2>
              </div>
              <span className="block-note">左纲右树 · 支持动态生长节点与本地持久化</span>
            </div>

            <div
              className="atlas-callout-card"
              role="button"
              tabIndex={0}
              onClick={() => navigateSection('mindmap')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigateSection('mindmap')
                }
              }}
            >
              <div className="atlas-callout-main">
                <div className="atlas-callout-badge">
                  <GitBranch size={13} />
                  <span>LIVING MINDMAP · 持续演进</span>
                </div>
                <h3>AI Agent 全景学习图谱</h3>
                <p>
                  涵盖理论基石、规划推理（ReAct / Reflexion / ToT）、多级记忆架构、MCP 工具协议、LangGraph 编排及生产级 AgentOps 评测体系。采用「左纲右树」零拖拽布局，可直接在浏览器中新增、打卡与批注节点。
                </p>
              </div>

              <div className="atlas-callout-aside">
                <div className="atlas-stat-pair">
                  <div>
                    <small>核心模块</small>
                    <strong>{mindmapSummary.modules} 章</strong>
                  </div>
                  <div>
                    <small>已点亮进度</small>
                    <strong>
                      {mindmapSummary.doneLeaves}/{mindmapSummary.totalLeaves}
                    </strong>
                  </div>
                </div>
                <span className="atlas-enter-btn">
                  进入交互脑图 →
                </span>
              </div>
            </div>
          </section>

          {/* PROJECTS SECTION */}
          <section className="section-block" id="projects">
            <div className="block-header">
              <div>
                <p className="section-index">PROJECTS / 04</p>
                <h2>个人项目</h2>
              </div>
              <span className="block-note">业余维护的开源代码与小工具</span>
            </div>

            <div className="hairline-grid">
              {projects.map((project) => (
                <a
                  key={project.name}
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hairline-cell project-cell"
                >
                  <div className="cell-top">
                    <span className="cell-index">{project.year}</span>
                    <ArrowUpRight size={14} />
                  </div>
                  <h3>{project.name}</h3>
                  <p className="cell-desc">{project.description}</p>
                  <div className="cell-stack">
                    {project.stack.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section className="section-block" id="about">
            <div className="block-header">
              <div>
                <p className="section-index">ABOUT / 05</p>
                <h2>关于</h2>
              </div>
            </div>

            <div className="about-columns">
              <div className="about-col">
                <p>
                  我是朱轩，一名后端工程师，日常工作围绕高可用服务端架构、分布式存储与 AI Agent 工程化落地展开。业余喜欢在自己的云服务器上折腾容器编排与边缘网络，也长期实测对比各类主流大模型与 AI 编程订阅服务。
                </p>
                <p>
                  这个博客坚持极简纯静态架构：通过本地 Markdown 写作配合 Git 推送自动构建发布，去掉后台维护负担，把重心放在清晰的分类检索、结构化知识脑图与沉浸阅读体验上。
                </p>
              </div>
              <div className="about-col about-meta-list">
                <div className="meta-row">
                  <span>关注方向</span>
                  <strong>后端架构 / AI Agent / 服务器基建 / AI 订阅流</strong>
                </div>
                <div className="meta-row">
                  <span>常用技术</span>
                  <strong>Java · Go · Python, MySQL &amp; Redis, Docker, Linux, MCP</strong>
                </div>
                <div className="meta-row">
                  <span>站点与仓库</span>
                  <strong>blog.vibe-show.com · GitHub @1264585648</strong>
                </div>
              </div>
            </div>
          </section>

          <footer className="footer">
            <span>© 2026 朱轩 (Xuan). All rights reserved.</span>
            <div className="footer-links">
              <a href="#top">回到顶部 ↑</a>
              <a
                href="https://github.com/1264585648/xuan-blog"
                target="_blank"
                rel="noreferrer"
              >
                源码仓库
              </a>
            </div>
          </footer>
        </div>
        )}
      </main>

      {/* ARTICLE READER DRAWER */}
      {selectedPost && (
        <div
          className="reader-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-title"
          onClick={() => setSelectedPostId(null)}
        >
          <article
            className="reader-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="reader-bar">
              <button
                type="button"
                className="reader-back"
                onClick={() => setSelectedPostId(null)}
              >
                <ArrowLeft size={15} />
                <span>返回目录</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="关闭"
                onClick={() => setSelectedPostId(null)}
              >
                <X size={17} />
              </button>
            </header>

            <div className="reader-body-wrap">
              <div className="reader-meta">
                <span>{selectedPost.category}</span>
                <span>·</span>
                <time>{selectedPost.date}</time>
                <span>·</span>
                <span>{selectedPost.readTime}</span>
              </div>

              <h1 id="reader-title" className="reader-title">
                {selectedPost.title}
              </h1>

              <p className="reader-summary">{selectedPost.summary}</p>

              <hr className="reader-rule" />

              <div className="reader-prose">
                {selectedPost.sections.map((sec, idx) => (
                  <section key={idx} className="prose-section">
                    {sec.heading && <h2>{sec.heading}</h2>}
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                    {sec.quote && (
                      <blockquote className="prose-quote">{sec.quote}</blockquote>
                    )}
                    {sec.bullets && (
                      <ul>
                        {sec.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                    {sec.codeSnippet && (
                      <pre>
                        <code>{sec.codeSnippet.code}</code>
                      </pre>
                    )}
                  </section>
                ))}
              </div>

              {selectedPost.relatedIds.length > 0 && (
                <aside className="reader-related">
                  <h3>相关文章</h3>
                  <div className="related-list">
                    {selectedPost.relatedIds.map((relId) => {
                      const rel = flatPosts.find((p) => p.id === relId)
                      if (!rel) return null
                      return (
                        <button
                          key={rel.id}
                          type="button"
                          className="related-item"
                          onClick={() => setSelectedPostId(rel.id)}
                        >
                          <span>{rel.title}</span>
                          <time>{rel.date}</time>
                        </button>
                      )
                    })}
                  </div>
                </aside>
              )}

              <nav className="reader-pager" aria-label="上下篇">
                {adjacentPosts.prev ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPostId(adjacentPosts.prev!.id)}
                  >
                    <small>← 上一篇</small>
                    <span>{adjacentPosts.prev.title}</span>
                  </button>
                ) : (
                  <div />
                )}
                {adjacentPosts.next ? (
                  <button
                    type="button"
                    className="pager-next"
                    onClick={() => setSelectedPostId(adjacentPosts.next!.id)}
                  >
                    <small>下一篇 →</small>
                    <span>{adjacentPosts.next.title}</span>
                  </button>
                ) : (
                  <div />
                )}
              </nav>
            </div>
          </article>
        </div>
      )}
    </div>
  )
}

export default App
