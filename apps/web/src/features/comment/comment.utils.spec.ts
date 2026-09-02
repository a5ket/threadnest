import { describe, expect, it } from 'vitest'
import type { CommentNode } from './comment.types'
import { groupCommentsByParent } from './comment.utils'

const node = (overrides: Partial<CommentNode>): CommentNode => ({
  id: 'comment-1',
  threadId: 'thread-1',
  author: null,
  parentId: null,
  content: 'content',
  attachment: null,
  replyCount: 0,
  score: 0,
  viewerVote: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  editedAt: null,
  deletedAt: null,
  depth: 0,
  viewerBlockedAuthor: false,
  authorBlockedViewer: false,
  ...overrides
})

describe('groupCommentsByParent', () => {
  it('returns an empty map for an empty list', () => {
    const result = groupCommentsByParent([])

    expect(result.size).toBe(0)
  })

  it('groups root comments under the null key', () => {
    const root1 = node({ id: 'root-1', parentId: null })
    const root2 = node({ id: 'root-2', parentId: null })

    const result = groupCommentsByParent([root1, root2])

    expect(result.get(null)).toEqual([root1, root2])
  })

  it('groups replies under their parent id, separately from other parents', () => {
    const reply1 = node({ id: 'reply-1', parentId: 'root-1' })
    const reply2 = node({ id: 'reply-2', parentId: 'root-1' })
    const reply3 = node({ id: 'reply-3', parentId: 'root-2' })

    const result = groupCommentsByParent([reply1, reply2, reply3])

    expect(result.get('root-1')).toEqual([reply1, reply2])
    expect(result.get('root-2')).toEqual([reply3])
  })

  it('preserves the input order within each group', () => {
    const first = node({ id: 'a', parentId: 'root-1', createdAt: '2024-01-01T00:00:00.000Z' })
    const second = node({ id: 'b', parentId: 'root-1', createdAt: '2024-01-02T00:00:00.000Z' })

    const result = groupCommentsByParent([second, first])

    expect(result.get('root-1')).toEqual([second, first])
  })

  it('keeps roots and replies in separate map entries', () => {
    const root = node({ id: 'root-1', parentId: null })
    const reply = node({ id: 'reply-1', parentId: 'root-1' })

    const result = groupCommentsByParent([root, reply])

    expect(result.size).toBe(2)
    expect(result.get(null)).toEqual([root])
    expect(result.get('root-1')).toEqual([reply])
  })
})
