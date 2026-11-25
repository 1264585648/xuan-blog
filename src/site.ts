export type ThemeMode = 'light' | 'dark'
export type AccentTheme = 'sage' | 'slate' | 'sand'
export type NavSection = 'articles' | 'shelves' | 'projects' | 'about'

export const NAV_SECTIONS: readonly { id: NavSection; label: string }[] = [
  { id: 'articles', label: '文章' },
  { id: 'shelves', label: '专题' },
  { id: 'projects', label: '项目' },
  { id: 'about', label: '关于' },
]

export const NAV_SECTION_IDS: readonly NavSection[] = NAV_SECTIONS.map((s) => s.id)

const THEME_KEY = 'xuan-theme'
const ACCENT_KEY = 'xuan-accent'

export const SITE_TITLE = '朱轩 · Xuan Blog — 后端 · Agent · 服务器 · AI 订阅'

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function persist(key: 'theme' | 'accent', value: string): void {
  try {
    localStorage.setItem(key === 'theme' ? THEME_KEY : ACCENT_KEY, value)
  } catch {
    // Storage may be blocked (private mode); preference just won't persist.
  }
}

/** Saved preference first, otherwise follow the OS color scheme. */
export function readInitialTheme(): ThemeMode {
  const saved = safeGet(THEME_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readInitialAccent(): AccentTheme {
  // Older builds stored 'Slate' with a capital S.
  const saved = safeGet(ACCENT_KEY)?.toLowerCase()
  return saved === 'slate' || saved === 'sand' ? saved : 'sage'
}

export function isNavSection(value: string): value is NavSection {
  return (NAV_SECTION_IDS as readonly string[]).includes(value)
}
