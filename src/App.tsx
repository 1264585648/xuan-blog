import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Menu, Moon, Sun } from './icons'
import { postGroups, projects, shelves } from './data'
import { ArticleView } from './components/ArticleView'
import { ALL_CATEGORY, type ArchiveFilters } from './components/ArchiveSection'
import { HomeView } from './components/HomeView'
import { Sidebar } from './components/Sidebar'
import { useScrolledPast, useScrollSpy } from './hooks/useScroll'
import {
  NAV_SECTION_IDS,
  SITE_TITLE,
  isNavSection,
  persist,
  readInitialAccent,
  readInitialTheme,
  type AccentTheme,
  type NavSection,
  type ThemeMode,
} from './site'

const flatPosts = postGroups.flatMap((group) => group.posts)

const navCounts: Partial<Record<NavSection, number>> = {
  articles: flatPosts.length,
  shelves: shelves.length,
  projects: projects.length,
}

const BACK_TO_TOP_THRESHOLD = 900

type PendingScroll = { kind: 'y'; y: number } | { kind: 'section'; id: string } | null

function getPostIdFromLocation(): string | null {
  const match = window.location.pathname.match(/^\/posts\/([^/]+)\/?$/)
  if (!match) return null
  const id = decodeURIComponent(match[1])
  return flatPosts.some((post) => post.id === id) ? id : null
}

function getSectionFromHash(): NavSection | null {
  const hash = window.location.hash.slice(1)
  return isNavSection(hash) ? hash : null
}

function initialPendingScroll(): PendingScroll {
  if (getPostIdFromLocation()) return null
  const section = getSectionFromHash()
  return section ? { kind: 'section', id: section } : null
}

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)
  const [accent, setAccent] = useState<AccentTheme>(readInitialAccent)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(getPostIdFromLocation)
  const [filters, setFilters] = useState<ArchiveFilters>({
    category: ALL_CATEGORY,
    shelfId: null,
    query: '',
  })

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const homeScrollY = useRef(0)
  const pendingScroll = useRef<PendingScroll>(initialPendingScroll())

  const selectedPost = useMemo(
    () => flatPosts.find((post) => post.id === selectedPostId) ?? null,
    [selectedPostId],
  )
  const isHome = selectedPost === null

  // A nav click pins its target as active until the user scrolls manually;
  // otherwise short trailing sections could never become "active".
  const [navLock, setNavLock] = useState<NavSection | null>(null)
  const spySection = useScrollSpy(NAV_SECTION_IDS, 160, isHome)
  const activeSection: NavSection | null = isHome
    ? (navLock ?? (spySection as NavSection | null) ?? 'articles')
    : null
  const showBackToTop = useScrolledPast(BACK_TO_TOP_THRESHOLD)

  // Apply any scroll queued for after the view switched. 'instant' bypasses
  // the global `scroll-behavior: smooth` so restores don't visibly animate.
  useLayoutEffect(() => {
    const pending = pendingScroll.current
    pendingScroll.current = null
    if (!pending) return
    if (pending.kind === 'y') {
      window.scrollTo({ top: pending.y, behavior: 'instant' })
    } else {
      document.getElementById(pending.id)?.scrollIntoView({ behavior: 'instant' })
    }
  }, [selectedPostId])

  useEffect(() => {
    if (!navLock) return
    const release = () => setNavLock(null)
    const events = ['wheel', 'touchmove', 'keydown', 'mousedown'] as const
    events.forEach((name) => window.addEventListener(name, release, { passive: true }))
    return () => events.forEach((name) => window.removeEventListener(name, release))
  }, [navLock])

  useEffect(() => persist('theme', theme), [theme])
  useEffect(() => persist('accent', accent), [accent])

  useEffect(() => {
    document.title = selectedPost ? `${selectedPost.title} — Xuan Blog` : SITE_TITLE
  }, [selectedPost])

  const openPost = useCallback(
    (postId: string) => {
      if (!selectedPostId) homeScrollY.current = window.scrollY
      pendingScroll.current = { kind: 'y', y: 0 }
      setSelectedPostId(postId)
      setMenuOpen(false)
      window.history.pushState({ postId }, '', `/posts/${encodeURIComponent(postId)}`)
    },
    [selectedPostId],
  )

  const closePost = useCallback(() => {
    pendingScroll.current = { kind: 'y', y: homeScrollY.current }
    setSelectedPostId(null)
    window.history.pushState(null, '', '/')
  }, [])

  const navigateSection = useCallback(
    (target: NavSection) => {
      setMenuOpen(false)
      setNavLock(target)
      if (selectedPostId) {
        pendingScroll.current = { kind: 'section', id: target }
        setSelectedPostId(null)
        window.history.pushState(null, '', `/#${target}`)
        return
      }
      window.history.replaceState(null, '', `/#${target}`)
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
    },
    [selectedPostId],
  )

  const goHome = useCallback(() => {
    setMenuOpen(false)
    if (selectedPostId) {
      closePost()
      return
    }
    setNavLock(null)
    window.history.replaceState(null, '', '/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [closePost, selectedPostId])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && isHome && !isTypingTarget(document.activeElement)) {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (event.key === 'Escape') {
        if (menuOpen) setMenuOpen(false)
        else if (selectedPostId) closePost()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closePost, isHome, menuOpen, selectedPostId])

  useEffect(() => {
    const handlePopState = () => {
      const postId = getPostIdFromLocation()
      if (postId) {
        pendingScroll.current = { kind: 'y', y: 0 }
      } else {
        const section = getSectionFromHash()
        pendingScroll.current = section
          ? { kind: 'section', id: section }
          : { kind: 'y', y: homeScrollY.current }
      }
      setSelectedPostId(postId)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const toggleTheme = () => setTheme((v) => (v === 'light' ? 'dark' : 'light'))

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''} accent-${accent}`}>
      <header className="mobile-bar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            goHome()
          }}
        >
          <span className="brand-dot" />
          <span>Xuan Blog</span>
        </a>
        <div className="mobile-bar-actions">
          <button className="icon-btn" type="button" aria-label="切换深浅色" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label="打开导航"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <Sidebar
        open={menuOpen}
        theme={theme}
        accent={accent}
        activeSection={activeSection}
        counts={navCounts}
        onClose={() => setMenuOpen(false)}
        onHome={goHome}
        onNavigate={navigateSection}
        onToggleTheme={toggleTheme}
        onAccentChange={setAccent}
      />

      {menuOpen && (
        <button
          className="drawer-scrim"
          type="button"
          aria-label="关闭菜单"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-canvas" id="top">
        <HomeView
          hidden={!isHome}
          filters={filters}
          searchInputRef={searchInputRef}
          onFiltersChange={setFilters}
          onOpenPost={openPost}
          onShowSection={navigateSection}
        />
        {selectedPost && (
          <ArticleView
            key={selectedPost.id}
            post={selectedPost}
            allPosts={flatPosts}
            onBack={closePost}
            onOpenPost={openPost}
          />
        )}
      </main>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        aria-label="回到顶部"
        tabIndex={showBackToTop ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </div>
  )
}

export default App
