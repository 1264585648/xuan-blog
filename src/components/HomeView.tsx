import type { RefObject } from 'react'
import type { NavSection } from '../site'
import { ArrowUpRight } from '../icons'
import { postGroups, projects, shelves } from '../data'
import { ArchiveSection, type ArchiveFilters } from './ArchiveSection'

interface HomeViewProps {
  hidden: boolean
  filters: ArchiveFilters
  searchInputRef: RefObject<HTMLInputElement | null>
  onFiltersChange: (next: ArchiveFilters) => void
  onOpenPost: (id: string) => void
  onShowSection: (id: NavSection) => void
}

const allPosts = postGroups.flatMap((g) => g.posts)
const latestDate = allPosts.reduce((max, p) => (p.date > max ? p.date : max), '')

function PageHeader() {
  return (
    <header className="page-header">
      <div className="header-left">
        <p className="section-index">INDEX / ARCHIVE</p>
        <h1>笔记与归档</h1>
        <p className="header-sub">
          按时间倒序整理的后端架构、AI Agent 实践、服务器基建与 AI 订阅实测。
        </p>
        <dl className="header-stats">
          <div>
            <dt>文章</dt>
            <dd>{allPosts.length}</dd>
          </div>
          <div>
            <dt>专题</dt>
            <dd>{shelves.length}</dd>
          </div>
          <div>
            <dt>最近更新</dt>
            <dd>{latestDate}</dd>
          </div>
        </dl>
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
  )
}

interface ShelvesSectionProps {
  activeShelf: string | null
  onToggleShelf: (id: string) => void
  onOpenPost: (id: string) => void
}

function ShelvesSection({ activeShelf, onToggleShelf, onOpenPost }: ShelvesSectionProps) {
  return (
    <section className="section-block" id="shelves">
      <div className="block-header">
        <div>
          <p className="section-index">TOPICS / 02</p>
          <h2>专题整理</h2>
        </div>
        <span className="block-note">围绕核心技术与实操方向归类的系列笔记</span>
      </div>

      <div className="card-grid shelves-grid">
        {shelves.map((shelf) => {
          const shelfPosts = allPosts.filter((p) => p.shelfId === shelf.id)
          const isSelected = activeShelf === shelf.id
          return (
            <div key={shelf.id} className={`card ${isSelected ? 'card-active' : ''}`}>
              <div className="cell-top">
                <span className="cell-index">{shelf.index}</span>
                <button
                  type="button"
                  className="cell-filter-btn"
                  aria-pressed={isSelected}
                  onClick={() => onToggleShelf(shelf.id)}
                >
                  {isSelected ? '取消筛选' : `筛选 ${shelfPosts.length} 篇 →`}
                </button>
              </div>
              <h3>{shelf.title}</h3>
              <p className="cell-desc">{shelf.description}</p>
              {shelfPosts.length > 0 && (
                <ul className="cell-links">
                  {shelfPosts.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => onOpenPost(p.id)}>
                        <span>{p.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ProjectsSection() {
  return (
    <section className="section-block" id="projects">
      <div className="block-header">
        <div>
          <p className="section-index">PROJECTS / 03</p>
          <h2>个人项目</h2>
        </div>
        <span className="block-note">业余维护的开源代码与小工具</span>
      </div>

      <div className="card-grid">
        {projects.map((project) => (
          <a
            key={project.name}
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="card project-cell"
          >
            <div className="cell-top">
              <span className="cell-index">{project.year}</span>
              <ArrowUpRight size={14} className="card-arrow" />
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
  )
}

function AboutSection() {
  return (
    <section className="section-block" id="about">
      <div className="block-header">
        <div>
          <p className="section-index">ABOUT / 04</p>
          <h2>关于</h2>
        </div>
      </div>

      <div className="about-columns">
        <div className="about-col">
          <p>
            我是一名后端工程师，日常工作围绕高可用服务端架构、分布式存储与 AI Agent 工程化落地展开。业余喜欢在自己的云服务器上折腾容器编排与边缘网络，也长期实测对比各类主流大模型与 AI 编程订阅服务。
          </p>
          <p>
            这个博客坚持极简纯静态架构：通过本地 Markdown 写作配合 Git 推送自动构建发布，去掉后台维护负担，把重心放在清晰的分类检索与沉浸阅读体验上。
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
  )
}

export function HomeView({
  hidden,
  filters,
  searchInputRef,
  onFiltersChange,
  onOpenPost,
  onShowSection,
}: HomeViewProps) {
  const toggleShelf = (id: string) => {
    const nextShelf = filters.shelfId === id ? null : id
    onFiltersChange({ ...filters, shelfId: nextShelf })
    if (nextShelf) onShowSection('articles')
  }

  return (
    <div className="canvas-inner" hidden={hidden}>
      <PageHeader />
      <ArchiveSection
        filters={filters}
        searchInputRef={searchInputRef}
        onFiltersChange={onFiltersChange}
        onOpenPost={onOpenPost}
      />
      <ShelvesSection
        activeShelf={filters.shelfId}
        onToggleShelf={toggleShelf}
        onOpenPost={onOpenPost}
      />
      <ProjectsSection />
      <AboutSection />

      <footer className="footer">
        <span>© 2026 Xuan Blog. All rights reserved.</span>
        <div className="footer-links">
          <a href="https://github.com/1264585648/xuan-blog" target="_blank" rel="noreferrer">
            源码仓库
          </a>
        </div>
      </footer>
    </div>
  )
}
