import { Fragment, type ReactNode } from 'react'
import type { MarkdownBlock, PostSection } from '../data'

export function renderInlineMarkdown(text: string): ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(tokenRegex)
  return parts.map((part, idx) => {
    if (!part) return null
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <code key={idx}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={idx}>{renderInlineMarkdown(part.slice(2, -2))}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={idx}>{renderInlineMarkdown(part.slice(1, -1))}</em>
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a key={idx} href={linkMatch[2]} target="_blank" rel="noreferrer">
          {linkMatch[1]}
        </a>
      )
    }
    return <Fragment key={idx}>{part}</Fragment>
  })
}

function renderBlock(block: MarkdownBlock, key: number): ReactNode {
  switch (block.type) {
    case 'paragraph':
      return <p key={key}>{renderInlineMarkdown(block.text)}</p>
    case 'heading':
      return block.level === 3 ? (
        <h3 key={key}>{renderInlineMarkdown(block.text)}</h3>
      ) : (
        <h4 key={key}>{renderInlineMarkdown(block.text)}</h4>
      )
    case 'image':
      return (
        <figure key={key} className="prose-figure">
          <img src={block.src} alt={block.alt} className="prose-image" loading="lazy" />
          {block.alt && <figcaption>{block.alt}</figcaption>}
        </figure>
      )
    case 'quote':
      return (
        <blockquote
          key={key}
          className={`prose-quote ${block.variant ? `is-${block.variant}` : ''}`}
        >
          {block.lines.map((line, lIdx) => (
            <p key={lIdx}>{renderInlineMarkdown(line)}</p>
          ))}
        </blockquote>
      )
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag key={key}>
          {block.items.map((item, iIdx) => {
            const [main, ...subs] = item.split('\n')
            return (
              <li key={iIdx}>
                {renderInlineMarkdown(main)}
                {subs.length > 0 && (
                  <ul>
                    {subs.map((sub, sIdx) => (
                      <li key={sIdx}>{renderInlineMarkdown(sub)}</li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ListTag>
      )
    }
    case 'table':
      return (
        <div key={key} className="prose-table-wrap">
          <table className="prose-table">
            <thead>
              <tr>
                {block.headers.map((h, hIdx) => (
                  <th key={hIdx}>{renderInlineMarkdown(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'code':
      return (
        <pre key={key} data-lang={block.lang !== 'text' ? block.lang : undefined}>
          <code>{block.code}</code>
        </pre>
      )
    case 'hr':
      return <hr key={key} className="prose-hr" />
    default:
      return null
  }
}

export function sectionAnchorId(index: number): string {
  return `sec-${index}`
}

interface ProseProps {
  sections: PostSection[]
}

export function Prose({ sections }: ProseProps) {
  return (
    <div className="reader-prose">
      {sections.map((sec, idx) => (
        <section key={idx} className="prose-section">
          {sec.heading && <h2 id={sectionAnchorId(idx)}>{sec.heading}</h2>}
          {sec.blocks.map((block, bIdx) => renderBlock(block, bIdx))}
        </section>
      ))}
    </div>
  )
}
