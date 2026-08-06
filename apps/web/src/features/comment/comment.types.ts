import { CommentNodeResponseDto, CommentResponseDto, CommentTreeMetaDto } from '@/generated/api/models'

export type CommentNode = CommentNodeResponseDto
export type CommentDetail = CommentResponseDto
export type CommentTreeMeta = CommentTreeMetaDto
export type CommentTreePage = { items: CommentNode[], meta: CommentTreeMeta }
