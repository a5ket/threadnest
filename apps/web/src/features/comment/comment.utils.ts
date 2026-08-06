import type { CommentNode } from './comment.types'

/** The API returns a flat, depth-annotated list; group it by parentId to walk it as a tree. */
export function groupCommentsByParent(nodes: CommentNode[]): Map<string | null, CommentNode[]> {
  const byParent = new Map<string | null, CommentNode[]>()

  for (const node of nodes) {
    const siblings = byParent.get(node.parentId) ?? []
    siblings.push(node)
    byParent.set(node.parentId, siblings)
  }

  return byParent
}
