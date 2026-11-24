import rawMindmap from '../content/mindmap.json'

export type NodeTag = '' | '必修' | '重点' | '实战' | '前沿'

export type MindNode = {
  id: string
  text: string
  tag?: NodeTag
  done?: boolean
  collapsed?: boolean
  note?: string
  children: MindNode[]
}

export const TAG_CYCLE: NodeTag[] = ['', '必修', '重点', '实战', '前沿']

export function getPublishedMindmap(): MindNode {
  return JSON.parse(JSON.stringify(rawMindmap)) as MindNode
}

export function countTreeStats(root: MindNode): {
  totalLeaves: number
  doneLeaves: number
  totalNodes: number
} {
  let totalLeaves = 0
  let doneLeaves = 0
  let totalNodes = 0

  function walk(node: MindNode, isRoot: boolean) {
    if (!isRoot) totalNodes += 1
    if (!node.children || node.children.length === 0) {
      if (!isRoot) {
        totalLeaves += 1
        if (node.done) doneLeaves += 1
      }
      return
    }
    for (const child of node.children) {
      walk(child, false)
    }
  }

  walk(root, true)
  return { totalLeaves, doneLeaves, totalNodes }
}
