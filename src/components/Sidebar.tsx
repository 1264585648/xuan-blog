import type { MouseEvent } from 'react'
import { ArrowUpRight, Moon, Sun, X } from '../icons'
import { NAV_SECTIONS, type AccentTheme, type NavSection, type ThemeMode } from '../site'

const accentSwatches: { id: AccentTheme; label: string; className: string }[] = [
  { id: 'sage', label: '松石绿', className: 'swatch-sage' },
  { id: 'slate', label: '岩灰蓝', className: 'swatch-slate' },
  { id: 'sand', label: '暖赭石', className: 'swatch-sand' },
]

interface SidebarProps {
  open: boolean
  theme: ThemeMode
  accent: AccentTheme
  activeSection: NavSection | null
  counts: Partial<Record<NavSection, number>>
  onClose: () => void
  onHome: () => void
  onNavigate: (section: NavSection) => void
  onToggleTheme: () => void
  onAccentChange: (accent: AccentTheme) => void
}

export function Sidebar({
  open,
  theme,
  accent,
  activeSection,
  counts,
  onClose,
  onHome,
  onNavigate,
  onToggleTheme,
  onAccentChange,
}: SidebarProps) {
  const handleBrand = (e: MouseEvent) => {
    e.preventDefault()
    onHome()
  }

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="站点导航">
      <div className="sidebar-top">
        <div className="sidebar-brand-row">
          <a className="brand" href="/" onClick={handleBrand}>
            <span className="brand-dot" />
            <span>Xuan Blog</span>
          </a>
          <button
            className="icon-btn sidebar-close"
            type="button"
            aria-label="关闭菜单"
            onClick={onClose}
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
        {NAV_SECTIONS.map((item, idx) => {
          const isActive = activeSection === item.id
          const count = counts[item.id]
          return (
            <a
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              href={`/#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault()
                onNavigate(item.id)
              }}
            >
              <span className="nav-idx">{String(idx + 1).padStart(2, '0')}</span>
              <span className="nav-label">{item.label}</span>
              {count !== undefined && <span className="nav-count">{count}</span>}
            </a>
          )
        })}
      </nav>

      <p className="sidebar-hint">
        <kbd>/</kbd> 搜索 · <kbd>Esc</kbd> 返回
      </p>

      <div className="sidebar-footer">
        <div className="appearance-row">
          <button type="button" className="theme-btn" onClick={onToggleTheme}>
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
            <span>{theme === 'light' ? '深色模式' : '浅色模式'}</span>
          </button>

          <div className="swatches" role="group" aria-label="点缀色">
            {accentSwatches.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`swatch ${item.className} ${accent === item.id ? 'active' : ''}`}
                aria-label={item.label}
                aria-pressed={accent === item.id}
                title={item.label}
                onClick={() => onAccentChange(item.id)}
              />
            ))}
          </div>
        </div>

        <div className="ext-links">
          <a href="https://github.com/1264585648/xuan-blog" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={11} />
          </a>
          <a href="mailto:hello@example.com">
            Email <ArrowUpRight size={11} />
          </a>
        </div>
      </div>
    </aside>
  )
}
