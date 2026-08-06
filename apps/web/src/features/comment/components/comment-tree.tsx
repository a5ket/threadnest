import type { CommentNode } from '@/features/comment/comment.types'
import { CommentItem } from './comment-item'

interface CommentTreeProps {
  childrenByParent: Map<string | null, CommentNode[]>
  parentId: string | null
  nestSlug: string
  threadSlug: string
}

export function CommentTree({ childrenByParent, parentId, nestSlug, threadSlug }: CommentTreeProps) {
  const children = childrenByParent.get(parentId) ?? []

  if (children.length === 0) return null

  return (
    <ul className='flex flex-col gap-4'>
      {children.map((comment) => {
        const grandchildren = childrenByParent.get(comment.id) ?? []

        return (
          <li key={comment.id} className='flex flex-col gap-3'>
            <CommentItem comment={comment} nestSlug={nestSlug} threadSlug={threadSlug} childrenCount={grandchildren.length} />

            {grandchildren.length > 0 && (
              <div className='ml-4 border-l border-border pl-4'>
                <CommentTree childrenByParent={childrenByParent} parentId={comment.id} nestSlug={nestSlug} threadSlug={threadSlug} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
