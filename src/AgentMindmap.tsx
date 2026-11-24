import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ArrowLeft, Check, PenLine, Search, X } from './icons'
import {
  countTreeStats,
  getPublishedMindmap,
  TAG_CYCLE,
  type MindNode,
} from './mindmapData'

type LocatedNode = {
  node: MindNode
  parent: MindNode | null
  index: number
  path: MindNode[]
}

type EdgeSpec = {
  from: string
  to: string
  active: boolean
}

const IS_LOCAL_DEV = import.meta.env.DEV

function generateNodeId(): string {
  return `nd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function cloneTree(node: MindNode): MindNode {
  return JSON.parse(JSON.stringify(node)) as MindNode
}

function locateNode(
  targetId: string,
  cur: MindNode,
  parent: MindNode | null = null,
  index = -1,
  path: MindNode[] = [],
): LocatedNode | null {
  const nextPath = [...path, cur]
  if (cur.id === targetId) {
    return { node: cur, parent, index, path: nextPath }
  }
  for (let i = 0; i < cur.children.length; i++) {
    const found = locateNode(targetId, cur.children[i], cur, i, nextPath)
    if (found) return found
  }
  return null
}

type AgentMindmapProps = {
  onBackToArticles?: () => void
  onTreeChange?: (root: MindNode) => void
}

export function AgentMindmap({
  onBackToArticles,
  onTreeChange,
}: AgentMindmapProps) {
  const [tree, setTree] = useState<MindNode>(getPublishedMindmap)
  const [previewReadonly, setPreviewReadonly] = useState<boolean>(false)
  const canEdit = IS_LOCAL_DEV && !previewReadonly

  const [activeChapterId, setActiveChapterId] = useState<string>(
    () => getPublishedMindmap().children[0]?.id ?? 'root',
  )
  const [selectedId, setSelectedId] = useState<string>(
    () => getPublishedMindmap().children[0]?.id ?? 'root',
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<string>('')
  const [noteOpen, setNoteOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [hideTags, setHideTags] = useState<boolean>(false)
  const [undoStack, setUndoStack] = useState<MindNode[]>([])
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [svgPaths, setSvgPaths] = useState<
    { d: string; active: boolean; sx: number; sy: number; tx: number; ty: number }[]
  >([])

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const treeMountRef = useRef<HTMLDivElement | null>(null)
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2400)
  }, [])

  useEffect(() => {
    onTreeChange?.(tree)
  }, [tree, onTreeChange])

  const mutateTree = useCallback(
    (updater: (draft: MindNode) => void, markContentChanged = true) => {
      setTree((prev) => {
        if (markContentChanged) {
          setUndoStack((h) => [...h.slice(-45), cloneTree(prev)])
          setIsDirty(true)
        }
        const draft = cloneTree(prev)
        updater(draft)
        return draft
      })
    },
    [],
  )

  // 本地开发一键将最新脑图写入 content/mindmap.json
  const handleSaveToRepo = useCallback(async () => {
    if (!IS_LOCAL_DEV) return
    setSaving(true)
    try {
      const res = await fetch('/__mindmap/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tree),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setIsDirty(false)
      showToast('已保存至 content/mindmap.json，执行 git push 即可发布上线')
    } catch {
      showToast('保存失败，请确认处于本地 npm run dev 环境')
    } finally {
      setSaving(false)
    }
  }, [tree, showToast])

  const handleUndo = useCallback(() => {
    if (!canEdit) return
    setUndoStack((prev) => {
      if (prev.length === 0) {
        showToast('没有可撤销的操作')
        return prev
      }
      const last = prev[prev.length - 1]
      setTree(last)
      setEditingId(null)
      setIsDirty(true)
      showToast('已撤销上一步修改')
      return prev.slice(0, -1)
    })
  }, [canEdit, showToast])

  const activeChapterIndex = useMemo(() => {
    const idx = tree.children.findIndex((c) => c.id === activeChapterId)
    return idx >= 0 ? idx : 0
  }, [tree, activeChapterId])

  const activeChapter = tree.children[activeChapterIndex] ?? null

  const selectedInfo = useMemo(
    () =>
      locateNode(selectedId, tree) ??
      (activeChapter ? locateNode(activeChapter.id, tree) : null),
    [selectedId, tree, activeChapter],
  )

  const activeAncestorIds = useMemo(() => {
    const s = new Set<string>()
    if (selectedInfo) {
      for (const p of selectedInfo.path) s.add(p.id)
    }
    return s
  }, [selectedInfo])

  const globalStats = useMemo(() => countTreeStats(tree), [tree])
  const masteryPct =
    globalStats.totalLeaves > 0
      ? Math.round((globalStats.doneLeaves / globalStats.totalLeaves) * 100)
      : 0

  const commitInlineEdit = useCallback(
    (targetId: string, textVal: string) => {
      if (!canEdit) return
      const trimmed = textVal.trim()
      if (trimmed) {
        mutateTree((draft) => {
          const hit = locateNode(targetId, draft)
          if (hit && hit.node.text !== trimmed) {
            hit.node.text = trimmed
          }
        })
      }
      setEditingId(null)
    },
    [canEdit, mutateTree],
  )

  const handleAddChild = useCallback(
    (parentId: string) => {
      if (!canEdit) return
      if (editingId) commitInlineEdit(editingId, editDraft)
      const newId = generateNodeId()
      const isNewChapter = parentId === 'root'
      const defaultTitle = isNewChapter ? '新学习模块' : '新知识点'

      mutateTree((draft) => {
        const hit = locateNode(parentId, draft)
        if (!hit) return
        hit.node.collapsed = false
        hit.node.children.push({
          id: newId,
          text: defaultTitle,
          tag: '',
          done: false,
          collapsed: false,
          children: [],
        })
      })

      if (isNewChapter) {
        setActiveChapterId(newId)
      } else {
        const parentInfo = locateNode(parentId, tree)
        if (parentInfo && parentInfo.path[1]) {
          setActiveChapterId(parentInfo.path[1].id)
        }
      }
      setSelectedId(newId)
      setEditDraft(defaultTitle)
      setEditingId(newId)
    },
    [canEdit, editingId, editDraft, commitInlineEdit, mutateTree, tree],
  )

  const handleAddSibling = useCallback(
    (targetId: string) => {
      if (!canEdit) return
      if (editingId) commitInlineEdit(editingId, editDraft)
      const info = locateNode(targetId, tree)
      if (!info || !info.parent) {
        handleAddChild('root')
        return
      }
      const newId = generateNodeId()
      const isChapterLevel = info.parent.id === 'root'
      const defaultTitle = isChapterLevel ? '新学习模块' : '新同级节点'

      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (!hit || !hit.parent) return
        hit.parent.children.splice(hit.index + 1, 0, {
          id: newId,
          text: defaultTitle,
          tag: '',
          done: false,
          collapsed: false,
          children: [],
        })
      })

      if (isChapterLevel) setActiveChapterId(newId)
      setSelectedId(newId)
      setEditDraft(defaultTitle)
      setEditingId(newId)
    },
    [canEdit, editingId, editDraft, commitInlineEdit, tree, handleAddChild, mutateTree],
  )

  const handleStartEdit = useCallback(
    (node: MindNode) => {
      if (!canEdit) return
      if (editingId && editingId !== node.id) {
        commitInlineEdit(editingId, editDraft)
      }
      setSelectedId(node.id)
      setEditDraft(node.text)
      setEditingId(node.id)
    },
    [canEdit, editingId, editDraft, commitInlineEdit],
  )

  const handleDeleteNode = useCallback(
    (targetId: string) => {
      if (!canEdit) return
      const info = locateNode(targetId, tree)
      if (!info || !info.parent) {
        showToast('总根节点不可删除')
        return
      }
      if (info.parent.id === 'root' && tree.children.length <= 1) {
        showToast('至少保留一个模块章节')
        return
      }

      let nextSelectId = info.parent.id
      const siblings = info.parent.children
      if (siblings.length > 1) {
        const fallbackIdx = info.index > 0 ? info.index - 1 : 1
        nextSelectId = siblings[fallbackIdx].id
      }

      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (!hit || !hit.parent) return
        hit.parent.children.splice(hit.index, 1)
      })

      if (info.parent.id === 'root') {
        setActiveChapterId(nextSelectId)
      }
      setSelectedId(nextSelectId)
      setEditingId(null)
      showToast('已删除节点（可按 Ctrl+Z 撤销）')
    },
    [canEdit, tree, mutateTree, showToast],
  )

  const handleToggleDone = useCallback(
    (targetId: string) => {
      if (!canEdit) return
      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (!hit) return
        const nextDone = !hit.node.done
        function applyRec(n: MindNode) {
          n.done = nextDone
          n.children.forEach(applyRec)
        }
        applyRec(hit.node)
      })
    },
    [canEdit, mutateTree],
  )

  const handleCycleTag = useCallback(
    (targetId: string) => {
      if (!canEdit) return
      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (!hit) return
        const curIdx = TAG_CYCLE.indexOf(hit.node.tag ?? '')
        hit.node.tag = TAG_CYCLE[(curIdx + 1) % TAG_CYCLE.length]
      })
    },
    [canEdit, mutateTree],
  )

  // 折叠/展开仅属于阅读视图交互，不计入脏数据修改，访客也可自由展开收起
  const handleToggleCollapse = useCallback(
    (targetId: string) => {
      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (!hit) return
        hit.node.collapsed = !hit.node.collapsed
      }, false)
    },
    [mutateTree],
  )

  const handleMoveSibling = useCallback(
    (targetId: string, delta: -1 | 1) => {
      if (!canEdit) return
      const info = locateNode(targetId, tree)
      if (!info || !info.parent) return
      const nextIdx = info.index + delta
      if (nextIdx < 0 || nextIdx >= info.parent.children.length) return
      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (!hit || !hit.parent) return
        const [moved] = hit.parent.children.splice(hit.index, 1)
        hit.parent.children.splice(nextIdx, 0, moved)
      })
    },
    [canEdit, tree, mutateTree],
  )

  const handleUpdateNote = useCallback(
    (targetId: string, noteVal: string) => {
      if (!canEdit) return
      mutateTree((draft) => {
        const hit = locateNode(targetId, draft)
        if (hit) hit.node.note = noteVal
      }, false)
      setIsDirty(true)
    },
    [canEdit, mutateTree],
  )

  const handleExpandCollapseChapter = useCallback(
    (collapseDeep: boolean) => {
      if (!activeChapter) return
      mutateTree((draft) => {
        const ch = draft.children.find((c) => c.id === activeChapter.id)
        if (!ch) return
        ch.collapsed = false
        function walk(n: MindNode, depth: number) {
          if (depth >= 2 && n.children.length > 0) {
            n.collapsed = collapseDeep
          }
          n.children.forEach((c) => walk(c, depth + 1))
        }
        walk(ch, 1)
      }, false)
    },
    [activeChapter, mutateTree],
  )

  const handleExportMarkdown = useCallback(() => {
    const lines: string[] = [`# ${tree.text}`, '']
    tree.children.forEach((ch, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      lines.push(`## ${num}. ${ch.text}${ch.tag ? ` [${ch.tag}]` : ''}`)
      function walk(items: MindNode[], depth: number) {
        const indent = '  '.repeat(depth)
        for (const item of items) {
          const check =
            item.children.length === 0 ? (item.done ? '[x] ' : '[ ] ') : ''
          const tag = item.tag ? ` \`${item.tag}\`` : ''
          lines.push(`${indent}- ${check}${item.text}${tag}`)
          if (item.note?.trim()) {
            lines.push(`${indent}  > ${item.note.trim()}`)
          }
          walk(item.children, depth + 1)
        }
      }
      walk(ch.children, 0)
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'AI-Agent-学习脑图.md'
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出 AI-Agent-学习脑图.md')
  }, [tree, showToast])

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    const q = val.trim().toLowerCase()
    if (!q) return
    for (const ch of tree.children) {
      let matchedId: string | null = null
      function findMatch(n: MindNode) {
        if (matchedId) return
        const hay = `${n.text} ${n.tag ?? ''} ${n.note ?? ''}`.toLowerCase()
        if (hay.includes(q)) {
          matchedId = n.id
          return
        }
        n.children.forEach(findMatch)
      }
      findMatch(ch)
      if (matchedId) {
        setActiveChapterId(ch.id)
        setSelectedId(matchedId)
        break
      }
    }
  }

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
      editInputRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [editingId])

  // 全局编辑快捷键仅在本地编辑模式生效
  useEffect(() => {
    if (!canEdit) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (editingId) commitInlineEdit(editingId, editDraft)
        void handleSaveToRepo()
        return
      }

      const activeTag = document.activeElement?.tagName
      if (editingId || activeTag === 'INPUT' || activeTag === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
        return
      }
      if (!selectedInfo) return

      if (e.key === 'Tab') {
        e.preventDefault()
        handleAddChild(selectedInfo.node.id)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleAddSibling(selectedInfo.node.id)
      } else if (e.key === 'F2') {
        e.preventDefault()
        handleStartEdit(selectedInfo.node)
      } else if (e.key === ' ') {
        e.preventDefault()
        handleToggleDone(selectedInfo.node.id)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDeleteNode(selectedInfo.node.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    canEdit,
    editingId,
    editDraft,
    selectedInfo,
    commitInlineEdit,
    handleSaveToRepo,
    handleUndo,
    handleAddChild,
    handleAddSibling,
    handleStartEdit,
    handleToggleDone,
    handleDeleteNode,
  ])

  const visibleEdges = useMemo<EdgeSpec[]>(() => {
    if (!activeChapter) return []
    const list: EdgeSpec[] = []
    function walk(node: MindNode) {
      if (node.collapsed || node.children.length === 0) return
      for (const child of node.children) {
        const isEdgeActive =
          activeAncestorIds.has(node.id) && activeAncestorIds.has(child.id)
        list.push({ from: node.id, to: child.id, active: isEdgeActive })
        walk(child)
      }
    }
    walk(activeChapter)
    return list
  }, [activeChapter, activeAncestorIds])

  const recomputeSvgCurves = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cRect = canvas.getBoundingClientRect()
    const sLeft = canvas.scrollLeft
    const sTop = canvas.scrollTop

    const nextPaths: {
      d: string
      active: boolean
      sx: number
      sy: number
      tx: number
      ty: number
    }[] = []

    for (const edge of visibleEdges) {
      const fromEl = document.getElementById(`mm_node_${edge.from}`)
      const toEl = document.getElementById(`mm_node_${edge.to}`)
      if (!fromEl || !toEl) continue

      const r1 = fromEl.getBoundingClientRect()
      const r2 = toEl.getBoundingClientRect()

      const sx = r1.right - cRect.left + sLeft
      const sy = r1.top + r1.height / 2 - cRect.top + sTop
      const tx = r2.left - cRect.left + sLeft
      const ty = r2.top + r2.height / 2 - cRect.top + sTop
      const dx = Math.max(20, (tx - sx) * 0.52)

      nextPaths.push({
        d: `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`,
        active: edge.active,
        sx,
        sy,
        tx,
        ty,
      })
    }
    setSvgPaths(nextPaths)
  }, [visibleEdges])

  useLayoutEffect(() => {
    recomputeSvgCurves()
  }, [
    recomputeSvgCurves,
    tree,
    activeChapterId,
    selectedId,
    editingId,
    hideTags,
    canEdit,
  ])

  useEffect(() => {
    const mountEl = treeMountRef.current
    if (!mountEl) return
    const ro = new ResizeObserver(() => {
      recomputeSvgCurves()
    })
    ro.observe(mountEl)
    window.addEventListener('resize', recomputeSvgCurves)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recomputeSvgCurves)
    }
  }, [recomputeSvgCurves])

  const isNodeMatched = (node: MindNode): boolean => {
    if (!normalizedSearch) return false
    return `${node.text} ${node.tag ?? ''} ${node.note ?? ''}`
      .toLowerCase()
      .includes(normalizedSearch)
  }

  const renderSubtreeNode = (node: MindNode, depth: number) => {
    const isSelected = selectedId === node.id
    const isEditing = canEdit && editingId === node.id
    const isInActiveChain = activeAncestorIds.has(node.id)
    const matched = isNodeMatched(node)
    const hasChildren = node.children.length > 0
    const isLeaf = !hasChildren

    const levelClass =
      depth === 1
        ? 'mm-node-root'
        : depth === 2
          ? 'mm-node-branch'
          : 'mm-node-leaf'

    return (
      <div key={node.id} className="mm-subtree-group">
        <div
          id={`mm_node_${node.id}`}
          className={[
            'mm-node',
            levelClass,
            isSelected ? 'is-selected' : '',
            isInActiveChain && !isSelected ? 'in-chain' : '',
            node.done ? 'is-done' : '',
            matched ? 'is-match' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={(e) => {
            e.stopPropagation()
            if (canEdit && editingId && editingId !== node.id) {
              commitInlineEdit(editingId, editDraft)
            }
            setSelectedId(node.id)
          }}
          onDoubleClick={(e) => {
            if (!canEdit) return
            e.stopPropagation()
            handleStartEdit(node)
          }}
        >
          {depth === 1 && (
            <span className="mm-root-eyebrow">
              MODULE {String(activeChapterIndex + 1).padStart(2, '0')}
            </span>
          )}

          <div className="mm-node-main">
            {/* 叶子节点状态圆点：线上访客为静态只读展示，本地编辑模式支持点击切换 */}
            {depth >= 2 && isLeaf && (
              canEdit ? (
                <button
                  type="button"
                  className={`mm-check-dot ${node.done ? 'checked' : ''}`}
                  title="标记已掌握 / 未掌握 (Space)"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleDone(node.id)
                  }}
                >
                  {node.done && <Check size={9} strokeWidth={2.6} />}
                </button>
              ) : (
                <span
                  className={`mm-check-dot readonly ${node.done ? 'checked' : ''}`}
                  aria-hidden="true"
                >
                  {node.done && <Check size={9} strokeWidth={2.6} />}
                </span>
              )
            )}

            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                className="mm-inline-input"
                value={editDraft}
                style={{
                  width: `${Math.max(140, editDraft.length * 14 + 26)}px`,
                }}
                onChange={(e) => setEditDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitInlineEdit(node.id, editDraft)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setEditingId(null)
                  } else if (e.key === 'Tab') {
                    e.preventDefault()
                    commitInlineEdit(node.id, editDraft)
                    handleAddChild(node.id)
                  }
                }}
                onBlur={() => {
                  if (editingId === node.id) {
                    commitInlineEdit(node.id, editDraft)
                  }
                }}
              />
            ) : (
              <span className="mm-node-text">{node.text}</span>
            )}

            {!hideTags && !isEditing && node.tag && (
              <span
                className={`mm-tag ${node.tag === '必修' || node.tag === '重点' ? 'mm-tag-accent' : ''}`}
                title={canEdit ? '点击切换标签' : undefined}
                onClick={
                  canEdit
                    ? (e) => {
                        e.stopPropagation()
                        handleCycleTag(node.id)
                      }
                    : undefined
                }
              >
                {node.tag}
              </span>
            )}

            {!isEditing && node.note?.trim() && (
              <span className="mm-note-flag" title={node.note}>
                <PenLine size={11} />
              </span>
            )}

            {depth >= 2 && hasChildren && node.collapsed && (
              <button
                type="button"
                className="mm-fold-badge"
                title="展开子分支"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleCollapse(node.id)
                }}
              >
                +{countTreeStats(node).totalNodes}
              </button>
            )}
          </div>

          {!isEditing && (canEdit || (depth >= 2 && hasChildren && !node.collapsed)) && (
            <span className="mm-hover-tools">
              {depth >= 2 && hasChildren && !node.collapsed && (
                <button
                  type="button"
                  className="mm-micro-action"
                  title="收起子分支"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleCollapse(node.id)
                  }}
                >
                  −
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className="mm-plus-btn"
                  title="新增子节点 (Tab)"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddChild(node.id)
                  }}
                >
                  +
                </button>
              )}
            </span>
          )}
        </div>

        {!node.collapsed && hasChildren && (
          <div className="mm-children-stack">
            {node.children.map((child) => renderSubtreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const anyDeepExpanded = useMemo(() => {
    if (!activeChapter) return false
    return activeChapter.children.some(
      (sub) => sub.children.length > 0 && !sub.collapsed,
    )
  }, [activeChapter])

  return (
    <div className="mm-page">
      <header className="mm-header">
        <div className="mm-header-left">
          <div className="mm-eyebrow-row">
            <span className="section-index" style={{ margin: 0 }}>
              KNOWLEDGE ATLAS / 03
            </span>
            {IS_LOCAL_DEV && (
              <span className="mm-dev-pill">
                {canEdit ? 'LOCAL EDIT · 本地编辑模式' : 'READONLY PREVIEW · 访客视角'}
              </span>
            )}
            {onBackToArticles && (
              <button
                type="button"
                className="mm-back-link"
                onClick={onBackToArticles}
              >
                <ArrowLeft size={12} />
                <span>返回归档首页</span>
              </button>
            )}
          </div>
          <h1>{tree.text}</h1>
          <p className="mm-subtitle">
            {canEdit
              ? '当前处于本地开发编辑模式：支持随时增删节点、打卡进度与记录笔记，按 Ctrl+S 直接写回 content/mindmap.json。'
              : '按八大核心模块系统梳理的 AI Agent 学习路径与实践批注。点击左侧切换章节，点选任意节点可高亮完整知识链路。'}
          </p>
        </div>

        <div className="mm-header-right">
          <div className="mm-progress-box">
            <div className="mm-progress-meta">
              <span>当前点亮进度</span>
              <strong>
                {globalStats.doneLeaves} / {globalStats.totalLeaves} ({masteryPct}%)
              </strong>
            </div>
            <div className="mm-progress-track">
              <div
                className="mm-progress-fill"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
          </div>

          <div className="mm-toolbar-row">
            <div className="mm-search">
              <Search size={13} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索知识点…"
                aria-label="搜索脑图节点"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="清空搜索"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`mm-ctrl-btn ${hideTags ? 'is-on' : ''}`}
              onClick={() => setHideTags((v) => !v)}
            >
              {hideTags ? '显示标签' : '纯净视图'}
            </button>

            <button
              type="button"
              className="mm-ctrl-btn"
              onClick={handleExportMarkdown}
            >
              导出 MD
            </button>

            {IS_LOCAL_DEV && (
              <>
                <button
                  type="button"
                  className={`mm-ctrl-btn ${previewReadonly ? 'is-on' : ''}`}
                  onClick={() => {
                    setEditingId(null)
                    setPreviewReadonly((v) => !v)
                  }}
                >
                  {previewReadonly ? '退出只读预览' : '预览访客视角'}
                </button>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      className="mm-ctrl-btn"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      title="撤销上一步 (Ctrl+Z)"
                    >
                      撤销
                    </button>
                    <button
                      type="button"
                      className={`mm-ctrl-btn ${isDirty ? 'mm-save-dirty' : ''}`}
                      onClick={() => void handleSaveToRepo()}
                      disabled={saving}
                      title="直接写入 content/mindmap.json (快捷键 Ctrl+S)"
                    >
                      {saving
                        ? '保存中…'
                        : isDirty
                          ? '保存至源码 *'
                          : '已同步源码'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* 左纲右树主体 */}
      <div className="mm-workbench">
        <aside className="mm-outline-rail" aria-label="模块总纲">
          <div className="mm-rail-head">
            <span>MODULES · 模块总纲</span>
            <small>{tree.children.length}</small>
          </div>

          <div className="mm-rail-list">
            {tree.children.map((ch, idx) => {
              const isAct = ch.id === activeChapter?.id
              const stats = countTreeStats(ch)
              const chPct =
                stats.totalLeaves > 0
                  ? Math.round((stats.doneLeaves / stats.totalLeaves) * 100)
                  : 0
              const hasHit =
                normalizedSearch.length > 0 &&
                JSON.stringify(ch).toLowerCase().includes(normalizedSearch)

              return (
                <div
                  key={ch.id}
                  role="button"
                  tabIndex={0}
                  className={[
                    'mm-chapter-item',
                    isAct ? 'active' : '',
                    hasHit ? 'has-hit' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    if (canEdit && editingId) commitInlineEdit(editingId, editDraft)
                    setActiveChapterId(ch.id)
                    setSelectedId(ch.id)
                  }}
                  onDoubleClick={() => {
                    if (canEdit) handleStartEdit(ch)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveChapterId(ch.id)
                      setSelectedId(ch.id)
                    }
                  }}
                >
                  <div className="mm-ch-top">
                    <span className="mm-ch-idx">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="mm-ch-title">{ch.text}</span>
                    <span className="mm-ch-stat">
                      {stats.doneLeaves}/{stats.totalLeaves}
                    </span>
                  </div>
                  <div className="mm-ch-bar">
                    <i style={{ width: `${chPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {canEdit && (
            <div className="mm-rail-foot">
              <button
                type="button"
                className="mm-add-chapter-btn"
                onClick={() => handleAddChild('root')}
              >
                + 新增一级模块
              </button>
            </div>
          )}
        </aside>

        <div className="mm-stage-col">
          <div className="mm-stage-topbar">
            <div className="mm-stage-crumb">
              <span>当前模块：</span>
              <strong>
                {String(activeChapterIndex + 1).padStart(2, '0')} ·{' '}
                {activeChapter?.text}
              </strong>
            </div>

            <div className="mm-stage-actions">
              <button
                type="button"
                className="mm-text-btn"
                onClick={() => handleExpandCollapseChapter(anyDeepExpanded)}
              >
                {anyDeepExpanded ? '收起三级细项' : '展开全部层级'}
              </button>
              {canEdit && (
                <>
                  <span className="mm-sep">·</span>
                  <span className="mm-kbd-hint">
                    <kbd>Tab</kbd> 子节点 <kbd>Enter</kbd> 同级 <kbd>Space</kbd>{' '}
                    打卡 <kbd>Ctrl+S</kbd> 存源码
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            ref={canvasRef}
            className="mm-tree-viewport"
            onScroll={recomputeSvgCurves}
          >
            <svg className="mm-edges-svg" aria-hidden="true">
              {svgPaths.map((p, idx) => (
                <g key={idx}>
                  <path
                    d={p.d}
                    fill="none"
                    className={p.active ? 'mm-edge-active' : 'mm-edge-Idle'}
                  />
                  {p.active && (
                    <>
                      <circle
                        cx={p.sx}
                        cy={p.sy}
                        r={2.4}
                        className="mm-edge-dot"
                      />
                      <circle
                        cx={p.tx}
                        cy={p.ty}
                        r={2.4}
                        className="mm-edge-dot"
                      />
                    </>
                  )}
                </g>
              ))}
            </svg>

            <div ref={treeMountRef} className="mm-tree-mount">
              {activeChapter && renderSubtreeNode(activeChapter, 1)}
            </div>
          </div>

          {/* 只读模式下：若选中节点有作者笔记，安静展示只读批注条 */}
          {!canEdit && selectedInfo?.node.note?.trim() && (
            <div className="mm-note-strip readonly">
              <span className="mm-note-label">
                <PenLine size={12} />
                <span>实践批注：</span>
              </span>
              <span className="mm-note-readonly-text">
                {selectedInfo.node.note}
              </span>
            </div>
          )}

          {/* 本地编辑模式下：可编辑笔记输入条与上下文操作坞 */}
          {canEdit && selectedInfo && (noteOpen || selectedInfo.node.note?.trim()) && (
            <div className="mm-note-strip">
              <span className="mm-note-label">
                <PenLine size={12} />
                <span>节点笔记：</span>
              </span>
              <input
                type="text"
                className="mm-note-input"
                placeholder="记录针对该知识点的学习心得、代码仓库或论文链接…"
                value={selectedInfo.node.note ?? ''}
                onChange={(e) =>
                  handleUpdateNote(selectedInfo.node.id, e.target.value)
                }
              />
              {noteOpen && !selectedInfo.node.note?.trim() && (
                <button
                  type="button"
                  className="mm-text-btn"
                  onClick={() => setNoteOpen(false)}
                >
                  收起
                </button>
              )}
            </div>
          )}

          {canEdit && selectedInfo && (
            <footer className="mm-context-bar">
              <div className="mm-ctx-selected">
                <span className="mm-ctx-dot" />
                <span className="mm-ctx-name">{selectedInfo.node.text}</span>
              </div>

              <div className="mm-ctx-btns">
                <button
                  type="button"
                  className="mm-ctx-btn primary"
                  onClick={() => handleAddChild(selectedInfo.node.id)}
                >
                  + 子节点 <small>Tab</small>
                </button>
                <button
                  type="button"
                  className="mm-ctx-btn"
                  onClick={() => handleAddSibling(selectedInfo.node.id)}
                >
                  + 同级 <small>Enter</small>
                </button>
                <button
                  type="button"
                  className="mm-ctx-btn"
                  onClick={() => handleStartEdit(selectedInfo.node)}
                >
                  重命名
                </button>
                <button
                  type="button"
                  className="mm-ctx-btn"
                  onClick={() => handleCycleTag(selectedInfo.node.id)}
                >
                  标签{selectedInfo.node.tag ? ` · ${selectedInfo.node.tag}` : ''}
                </button>
                <button
                  type="button"
                  className={`mm-ctx-btn ${noteOpen ? 'active' : ''}`}
                  onClick={() => setNoteOpen((v) => !v)}
                >
                  笔记
                </button>
                <button
                  type="button"
                  className="mm-ctx-btn"
                  disabled={!selectedInfo.parent || selectedInfo.index === 0}
                  onClick={() => handleMoveSibling(selectedInfo.node.id, -1)}
                  title="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="mm-ctx-btn"
                  disabled={
                    !selectedInfo.parent ||
                    selectedInfo.index === selectedInfo.parent.children.length - 1
                  }
                  onClick={() => handleMoveSibling(selectedInfo.node.id, 1)}
                  title="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="mm-ctx-btn danger"
                  disabled={!selectedInfo.parent}
                  onClick={() => handleDeleteNode(selectedInfo.node.id)}
                >
                  删除
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>

      {toastMsg && <div className="mm-toast">{toastMsg}</div>}
    </div>
  )
}
