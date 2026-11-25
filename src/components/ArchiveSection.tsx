import { useMemo, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { ArrowUpRight, Search, X } from '../icons'
import { categories, postGroups, shelves, type Post } from '../data'

export const ALL_CATEGORY = '全部'

export interface ArchiveFilters {
  category: string
  shelfId: string | null
  query: string
}

interface ArchiveSectionProps {
  filters: ArchiveFilters
  searchInputRef: RefObject<HTMLInputElement | null>
  onFiltersChange: (next: ArchiveFilters) => void
  onOpenPost: (id: string) => void
}

const allPosts = postGroups.flatMap((g) => g.posts)

const categoryCounts: Record<string, number> = allPosts.reduce<Record<string, number>>(
  (acc, post) => ({ ...acc, [post.category]: (acc[post.category] ?? 0) + 1 }),
  { [ALL_CATEGORY]: allPosts.length },
)

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'))
  return parts.map((part, idx) =>
    part.toLowerCase() === q.toLowerCase() ? <mark key={idx}>{part}</mark> : part,
  )
}

function matches(post: Post, filters: ArchiveFilters): boolean {
  const q = filters.query.trim().toLowerCase()
  const haystack = `${post.title} ${post.summary} ${post.category} ${post.tags.join(' ')}`.toLowerCase()
  return (
    (filters.category === ALL_CATEGORY || post.category === filters.category) &&
    (!filters.shelfId || post.shelfId === filters.shelfId) &&
    (!q || haystack.includes(q))
  )
}

/** Let modified clicks (new tab / window) fall through to the browser. */
function isPlainLeftClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

export function ArchiveSection({
  filters,
  searchInputRef,
  onFiltersChange,
  onOpenPost,
}: ArchiveSectionProps) {
  const groups = useMemo(
    () =>
      postGroups
        .map((g) => ({ ...g, posts: g.posts.filter((p) => matches(p, filters)) }))
        .filter((g) => g.posts.length > 0),
    [filters],
  )
  const resultCount = groups.reduce((n, g) => n + g.posts.length, 0)
  const isFiltered =
    filters.category !== ALL_CATEGORY || filters.shelfId !== null || filters.query.trim() !== ''
  const activeShelf = shelves.find((s) => s.id === filters.shelfId)

  const update = (patch: Partial<ArchiveFilters>) => onFiltersChange({ ...filters, ...patch })
  const reset = () => onFiltersChange({ category: ALL_CATEGORY, shelfId: null, query: '' })

  return (
    <section className="section-block" id="articles" aria-label="文章归档">
      <div className="filter-bar">
        <div className="category-tabs" role="tablist" aria-label="文章分类">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={filters.category === cat}
              className={`cat-tab ${filters.category === cat ? 'active' : ''}`}
              onClick={() => update({ category: cat })}
            >
              <span>{cat}</span>
              <small>{categoryCounts[cat] ?? 0}</small>
            </button>
          ))}
        </div>

        <label className="search-field">
          <Search size={14} />
          <input
            ref={searchInputRef}
            type="search"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                if (filters.query) update({ query: '' })
                else e.currentTarget.blur()
              }
            }}
            placeholder="搜索标题、摘要或标签…"
            aria-label="搜索文章"
          />
          {filters.query ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => update({ query: '' })}
              aria-label="清空搜索"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>
      </div>

      {isFiltered && (
        <div className="filter-status" role="status">
          <span>
            找到 <strong>{resultCount}</strong> 篇
            {activeShelf && <> · 专题「{activeShelf.title}」</>}
          </span>
          <button type="button" onClick={reset}>
            清除筛选 <X size={11} />
          </button>
        </div>
      )}

      <div className="archive-table">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div className="year-row-group" key={group.year}>
              <div className="year-col">
                <span className="year-num">{group.year}</span>
                <span className="year-count">{group.posts.length} 篇</span>
              </div>
              <div className="posts-col">
                {group.posts.map((post) => (
                  <a
                    key={post.id}
                    className="post-item"
                    href={`/posts/${encodeURIComponent(post.id)}`}
                    onClick={(e) => {
                      if (!isPlainLeftClick(e)) return
                      e.preventDefault()
                      onOpenPost(post.id)
                    }}
                  >
                    <div className="post-item-main">
                      <h2 className="post-item-title">
                        {highlight(post.title, filters.query)}
                        {post.featured && <span className="featured-tag">精选</span>}
                      </h2>
                      <p className="post-item-summary">{highlight(post.summary, filters.query)}</p>
                    </div>
                    <div className="post-item-aside">
                      <span className="post-item-cat">{post.category}</span>
                      <time className="post-item-date" dateTime={post.date}>
                        {post.shortDate}
                      </time>
                      <ArrowUpRight size={14} className="post-item-arrow" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-box">
            <p>没有找到匹配的文章，换个关键词试试？</p>
            <button type="button" onClick={reset}>
              重置筛选条件
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
