import { useMemo, useState } from 'react'
type IconProps = { size?: number; strokeWidth?: number }
const Glyph = ({ children, size = 16 }: IconProps & { children: string }) => <span className="glyph" style={{ fontSize: size * 0.9 }}>{children}</span>
const ArrowUpRight = (props: IconProps) => <Glyph {...props}>↗</Glyph>
const BookOpen = (props: IconProps) => <Glyph {...props}>▱</Glyph>
const BriefcaseBusiness = (props: IconProps) => <Glyph {...props}>▣</Glyph>
const CalendarDays = (props: IconProps) => <Glyph {...props}>▦</Glyph>
const ChevronRight = (props: IconProps) => <Glyph {...props}>›</Glyph>
const Code2 = (props: IconProps) => <Glyph {...props}>⌘</Glyph>
const Compass = (props: IconProps) => <Glyph {...props}>◌</Glyph>
const GitBranch = (props: IconProps) => <Glyph {...props}>⑂</Glyph>
const Hash = (props: IconProps) => <Glyph {...props}>#</Glyph>
const Layers3 = (props: IconProps) => <Glyph {...props}>▤</Glyph>
const Leaf = (props: IconProps) => <Glyph {...props}>⌁</Glyph>
const AtSign = (props: IconProps) => <Glyph {...props}>@</Glyph>
const Mail = (props: IconProps) => <Glyph {...props}>✉</Glyph>
const Menu = (props: IconProps) => <Glyph {...props}>☰</Glyph>
const Moon = (props: IconProps) => <Glyph {...props}>◐</Glyph>
const Palette = (props: IconProps) => <Glyph {...props}>◍</Glyph>
const PenLine = (props: IconProps) => <Glyph {...props}>／</Glyph>
const Rss = (props: IconProps) => <Glyph {...props}>◔</Glyph>
const Search = (props: IconProps) => <Glyph {...props}>⌕</Glyph>
const Sparkles = (props: IconProps) => <Glyph {...props}>✦</Glyph>
const Sun = (props: IconProps) => <Glyph {...props}>☼</Glyph>
const X = (props: IconProps) => <Glyph {...props}>×</Glyph>

type Post = {
  title: string
  date: string
  category: string
  tags: string[]
  summary: string
  accent: string
}

type PostGroup = {
  year: string
  posts: Post[]
}

const categoryOptions = [
  { label: '全部', icon: Layers3, tone: 'all' },
  { label: '前端', icon: Code2, tone: 'blue' },
  { label: '产品', icon: Sparkles, tone: 'purple' },
  { label: '设计', icon: Palette, tone: 'orange' },
  { label: '效率', icon: Compass, tone: 'green' },
  { label: '生活', icon: Leaf, tone: 'pink' },
]

const postGroups: PostGroup[] = [
  {
    year: '2025',
    posts: [
      {
        title: '把复杂的工作流，写成一张看得懂的地图',
        date: '2025 年 03 月 31 日',
        category: '效率',
        tags: ['工作流', '复盘'],
        summary: '记录一次从混乱到清晰的整理过程，给自己的博客内容留一条可回溯的路径。',
        accent: 'green',
      },
      {
        title: '我想要的个人网站，应该像一本正在生长的书',
        date: '2025 年 01 月 18 日',
        category: '设计',
        tags: ['网站', '设计'],
        summary: '关于内容、节奏和留白的一点想法，也是一份写给未来自己的建站说明。',
        accent: 'orange',
      },
    ],
  },
  {
    year: '2024',
    posts: [
      {
        title: '从零搭建一套轻量的内容系统',
        date: '2024 年 12 月 06 日',
        category: '前端',
        tags: ['React', '内容系统'],
        summary: '不依赖复杂后台，也能让文章、专题和项目井然有序。',
        accent: 'blue',
      },
      {
        title: '让组件拥有自己的语气',
        date: '2024 年 10 月 19 日',
        category: '产品',
        tags: ['组件', '体验'],
        summary: '好的界面不仅完成任务，也会用微小的反馈让人知道自己正在被照顾。',
        accent: 'purple',
      },
      {
        title: '我如何给每周留出不被打扰的时间',
        date: '2024 年 07 月 21 日',
        category: '生活',
        tags: ['生活', '注意力'],
        summary: '一些不宏大的尝试：减少切换、关闭提醒，重新把时间还给重要的事。',
        accent: 'pink',
      },
    ],
  },
  {
    year: '2023',
    posts: [
      {
        title: '写给刚开始做独立项目的自己',
        date: '2023 年 11 月 09 日',
        category: '产品',
        tags: ['独立开发', '产品'],
        summary: '从第一行代码到第一次发布，中间有很多值得提前知道的小事。',
        accent: 'purple',
      },
      {
        title: '好看的界面，为什么也需要被使用',
        date: '2023 年 06 月 12 日',
        category: '设计',
        tags: ['界面', '可用性'],
        summary: '视觉只是入口，真正让人留下来的，是清晰、克制和可以预期的互动。',
        accent: 'orange',
      },
    ],
  },
]

const flatPosts = postGroups.flatMap((group) => group.posts)

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [accent, setAccent] = useState<'sage' | 'lilac' | 'sand'>('sage')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return postGroups
      .map((group) => ({
        ...group,
        posts: group.posts.filter((post) => {
          const matchesCategory = activeCategory === '全部' || post.category === activeCategory
          const haystack = `${post.title}${post.summary}${post.tags.join('')}`.toLowerCase()
          return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery))
        }),
      }))
      .filter((group) => group.posts.length > 0)
  }, [activeCategory, query])

  const resultCount = filteredGroups.reduce((total, group) => total + group.posts.length, 0)

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setMenuOpen(false)
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''} accent-${accent}`}>
      <header className="topbar">
        <a className="brand brand-mobile" href="#top" aria-label="回到首页">
          <span className="brand-mark">X</span>
          <span>Xuan Blog</span>
        </a>
        <div className="topbar-right">
          <span className="status-dot" aria-hidden="true" />
          <span className="status-text">持续书写中</span>
          <button
            className="icon-button palette-button"
            type="button"
            aria-label="切换主题色"
            aria-expanded={showPalette}
            onClick={() => setShowPalette((value) => !value)}
          >
            <Palette size={17} strokeWidth={1.8} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
            onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon size={17} strokeWidth={1.8} /> : <Sun size={17} strokeWidth={1.8} />}
          </button>
          <button className="icon-button menu-button" type="button" aria-label="打开菜单" onClick={() => setMenuOpen(true)}>
            <Menu size={19} strokeWidth={1.8} />
          </button>
        </div>
        {showPalette && (
          <div className="palette-popover" role="dialog" aria-label="主题色选择">
            <span>主题色</span>
            <button type="button" className="swatch swatch-sage" aria-label="鼠尾草绿" onClick={() => { setAccent('sage'); setShowPalette(false) }} />
            <button type="button" className="swatch swatch-lilac" aria-label="丁香紫" onClick={() => { setAccent('lilac'); setShowPalette(false) }} />
            <button type="button" className="swatch swatch-sand" aria-label="沙色" onClick={() => { setAccent('sand'); setShowPalette(false) }} />
          </div>
        )}
      </header>

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-topline">
          <a className="brand" href="#top">
            <span className="brand-mark">X</span>
            <span>Xuan Blog</span>
          </a>
          <button className="icon-button sidebar-close" type="button" aria-label="关闭菜单" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="profile-block">
          <div className="profile-orbit" aria-hidden="true">
            <span className="orbit-sun" />
            <span className="orbit-leaf leaf-one">⌁</span>
            <span className="orbit-leaf leaf-two">⌁</span>
            <span className="orbit-ring" />
          </div>
          <p className="eyebrow">HELLO, I AM</p>
          <h1>一个认真生活的<br /><em>开发者</em></h1>
          <p className="profile-copy">我在这里记录代码、设计、产品和生活里那些值得反复琢磨的事情。</p>
        </div>

        <nav className="side-nav" aria-label="主导航">
          <a className="nav-link active" href="#articles" onClick={() => setMenuOpen(false)}><PenLine size={16} />文章</a>
          <a className="nav-link" href="#shelves" onClick={() => setMenuOpen(false)}><BookOpen size={16} />专题</a>
          <a className="nav-link" href="#projects" onClick={() => setMenuOpen(false)}><BriefcaseBusiness size={16} />项目</a>
          <a className="nav-link" href="#about" onClick={() => setMenuOpen(false)}><Hash size={16} />关于我</a>
        </nav>

        <div className="sidebar-divider" />

        <div className="side-meta">
          <a href="mailto:hello@example.com"><Mail size={15} />邮件订阅<ArrowUpRight size={13} /></a>
          <a href="https://github.com" target="_blank" rel="noreferrer"><GitBranch size={15} />GitHub<ArrowUpRight size={13} /></a>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer"><AtSign size={15} />LinkedIn<ArrowUpRight size={13} /></a>
          <a href="#rss"><Rss size={15} />RSS 订阅<ArrowUpRight size={13} /></a>
        </div>

        <div className="sidebar-bottom">
          <a className="resume-link" href="#resume"><CalendarDays size={15} />我的履历<ChevronRight size={14} /></a>
          <div className="sidebar-note">内容会慢慢长出来<br /><span>Last updated · 2025.03</span></div>
        </div>
      </aside>

      {menuOpen && <button className="drawer-scrim" type="button" aria-label="关闭菜单" onClick={() => setMenuOpen(false)} />}

      <main className="main-content" id="top">
        <section className="hero-section" id="about">
          <div>
            <p className="kicker"><span className="kicker-line" /> DIGITAL GARDEN / 01</p>
            <h2>把想法种下来，<br /><span>让时间替你浇水。</span></h2>
            <p className="hero-copy">这里是我的中文博客。你会看到技术笔记、设计观察、项目记录，以及一些还没有想明白的生活问题。</p>
          </div>
          <div className="hero-stamp" aria-hidden="true">
            <span className="stamp-text">GROW<br />SLOWLY</span>
            <span className="stamp-sprout">✳</span>
          </div>
        </section>

        <section className="content-section" id="articles">
          <div className="section-heading">
            <div>
              <p className="kicker"><span className="kicker-line" /> NOTEBOOK / 02</p>
              <h3>文章</h3>
            </div>
            <span className="post-count">{flatPosts.length} 篇公开笔记</span>
          </div>

          <div className="category-row" aria-label="文章分类">
            {categoryOptions.map(({ label, icon: Icon, tone }) => (
              <button
                key={label}
                className={`category-chip ${activeCategory === label ? 'selected' : ''} tone-${tone}`}
                type="button"
                onClick={() => handleCategoryChange(label)}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>

          <div className="search-row">
            <div className="search-box">
              <Search size={17} strokeWidth={1.8} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索文章、标签或关键词…"
                aria-label="搜索文章"
              />
              {query && <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="清空搜索"><X size={14} /></button>}
            </div>
            <span className="result-count">找到 {resultCount} 篇</span>
          </div>

          <div className="timeline">
            {filteredGroups.length > 0 ? filteredGroups.map((group) => (
              <section className="year-group" key={group.year}>
                <div className="year-label">
                  <span className="year-number">{group.year}</span>
                  <span className="year-count">{group.posts.length} 篇</span>
                </div>
                <div className="post-list">
                  {group.posts.map((post) => (
                    <a className="post-row" href={`#${post.title}`} key={post.title}>
                      <span className={`post-accent accent-${post.accent}`} />
                      <span className="post-main">
                        <span className="post-title">{post.title}</span>
                        <span className="post-summary">{post.summary}</span>
                        <span className="tag-list">
                          {post.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
                        </span>
                      </span>
                      <span className="post-meta">
                        <span>{post.date}</span>
                        <ChevronRight size={16} />
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )) : (
              <div className="empty-state">
                <span className="empty-icon">⌁</span>
                <h4>还没有找到相关内容</h4>
                <p>换一个关键词，或者回到全部分类看看。</p>
                <button type="button" onClick={() => { setQuery(''); setActiveCategory('全部') }}>清除筛选</button>
              </div>
            )}
          </div>
        </section>

        <section className="shelf-banner" id="shelves">
          <div>
            <p className="kicker"><span className="kicker-line" /> SHELVES / 03</p>
            <h3>把相近的想法，<br /><span>放进同一个抽屉。</span></h3>
            <p>专题会把不同时间写下的笔记串起来，帮助你从一个更完整的角度重新阅读。</p>
          </div>
          <a href="#shelves" className="outline-button">浏览专题 <ArrowUpRight size={16} /></a>
        </section>

        <footer className="footer" id="projects">
          <div className="footer-brand"><span className="brand-mark">X</span><span>Xuan Blog</span></div>
          <p>Made with curiosity · © 2025</p>
          <div className="footer-links"><a href="#rss">RSS</a><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a><a href="#about">关于</a></div>
        </footer>
      </main>
    </div>
  )
}

export default App
