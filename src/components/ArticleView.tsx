import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from '../icons'
import type { Post } from '../data'
import { Prose, sectionAnchorId } from './Prose'
import { useScrollProgress, useScrollSpy } from '../hooks/useScroll'

interface TocItem {
  id: string
  label: string
}

interface ArticleViewProps {
  post: Post
  allPosts: readonly Post[]
  onBack: () => void
  onOpenPost: (id: string) => void
}

const COPY_FEEDBACK_MS = 1800

function buildToc(post: Post): TocItem[] {
  return post.sections.flatMap((sec, idx) =>
    sec.heading ? [{ id: sectionAnchorId(idx), label: sec.heading }] : [],
  )
}

function scrollToAnchor(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function TocList({ items, activeId }: { items: TocItem[]; activeId: string | null }) {
  return (
    <ol className="toc-list">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={activeId === item.id ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              scrollToAnchor(item.id)
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  )
}

type CopyState = 'idle' | 'copied' | 'failed'

const copyLabels: Record<CopyState, string> = {
  idle: '复制链接',
  copied: '已复制 ✓',
  failed: '复制失败，请手动复制地址栏',
}

function CopyLinkButton() {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = window.setTimeout(() => setState('idle'), COPY_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [state])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setState('copied')
    } catch {
      // Clipboard API is unavailable on insecure origins or when permission is denied.
      setState('failed')
    }
  }

  return (
    <button type="button" className="bar-action" onClick={handleCopy} aria-live="polite">
      {copyLabels[state]}
    </button>
  )
}

export function ArticleView({ post, allPosts, onBack, onOpenPost }: ArticleViewProps) {
  const toc = useMemo(() => buildToc(post), [post])
  const tocIds = useMemo(() => toc.map((t) => t.id), [toc])
  const activeId = useScrollSpy(tocIds, 120)
  const progress = useScrollProgress()

  const { prev, next } = useMemo(() => {
    const idx = allPosts.findIndex((p) => p.id === post.id)
    return {
      prev: idx > 0 ? allPosts[idx - 1] : null,
      next: idx >= 0 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null,
    }
  }, [allPosts, post.id])

  const related = useMemo(
    () =>
      post.relatedIds
        .map((id) => allPosts.find((p) => p.id === id))
        .filter((p): p is Post => Boolean(p)),
    [allPosts, post.relatedIds],
  )

  return (
    <div className="canvas-inner article-canvas">
      <div className="article-layout">
        <article className="article-page" aria-labelledby="reader-title">
          <header className="article-page-bar">
            <button type="button" className="reader-back" onClick={onBack}>
              <ArrowLeft size={15} />
              <span>返回目录</span>
              <kbd>Esc</kbd>
            </button>
            <CopyLinkButton />
            <span
              className="reading-progress"
              style={{ transform: `scaleX(${progress})` }}
              aria-hidden="true"
            />
          </header>

          <div className="article-page-body">
            <div className="reader-meta">
              <span className="meta-pill">{post.category}</span>
              <time dateTime={post.date}>{post.date}</time>
              <span>·</span>
              <span>约 {post.readTime}</span>
            </div>

            <h1 id="reader-title" className="reader-title">
              {post.title}
            </h1>

            <p className="reader-summary">{post.summary}</p>

            {post.tags.length > 0 && (
              <div className="reader-tags">
                {post.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}

            {toc.length > 1 && (
              <details className="toc-inline">
                <summary>本文目录 · {toc.length} 节</summary>
                <TocList items={toc} activeId={activeId} />
              </details>
            )}

            <hr className="reader-rule" />

            <Prose sections={post.sections} />

            {related.length > 0 && (
              <aside className="reader-related">
                <h3>相关文章</h3>
                <div className="related-list">
                  {related.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      className="related-item"
                      onClick={() => onOpenPost(rel.id)}
                    >
                      <span>{rel.title}</span>
                      <time>{rel.date}</time>
                    </button>
                  ))}
                </div>
              </aside>
            )}

            <nav className="reader-pager" aria-label="上下篇">
              {prev ? (
                <button type="button" onClick={() => onOpenPost(prev.id)}>
                  <small>← 上一篇</small>
                  <span>{prev.title}</span>
                </button>
              ) : (
                <div />
              )}
              {next ? (
                <button type="button" className="pager-next" onClick={() => onOpenPost(next.id)}>
                  <small>下一篇 →</small>
                  <span>{next.title}</span>
                </button>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </article>

        {toc.length > 1 && (
          <aside className="toc-rail" aria-label="文章目录">
            <p className="toc-title">目录</p>
            <TocList items={toc} activeId={activeId} />
          </aside>
        )}
      </div>
    </div>
  )
}
