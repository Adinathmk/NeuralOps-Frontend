// src/features/collaboration/components/ThreadMessageItem.tsx
// Renders a single message in the discussion thread.
// Handles: human messages, system messages, deleted messages, and replies.

import { useState } from 'react'
import { Reply, Trash2, Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, formatRelative, formatDate } from '@utils/cn'
import { Avatar } from '@components/common/Avatar'
import type { ThreadMessage } from '@/types'

interface Props {
  message: ThreadMessage
  currentUserId?: string
  currentUserRole?: string
  isReply?: boolean
  onReply: (message: ThreadMessage) => void
  onDelete: (messageId: string) => void
}

export function ThreadMessageItem({
  message,
  currentUserId,
  currentUserRole,
  isReply = false,
  onReply,
  onDelete,
}: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const [repliesExpanded, setRepliesExpanded] = useState(false)

  const isDeleted = message.is_deleted
  const isSystem = message.is_system_message
  const replies = message.replies ?? []
  const hasReplies = replies.length > 0
  const collapsedReplies = replies.length > 3 && !repliesExpanded
  const visibleReplies = collapsedReplies ? replies.slice(0, 3) : replies

  const canDelete =
    !isDeleted &&
    !isSystem &&
    (currentUserId === message.author?.id ||
      currentUserRole === 'admin' ||
      currentUserRole === 'owner')

  // ── System message ────────────────────────────────────────────────────────
  if (isSystem) {
    return (
      <div className="flex items-start gap-2 px-4 py-2.5 bg-slate-50 border-l-2 border-slate-200 my-1 rounded-r-lg">
        <Bot className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 italic leading-relaxed">{message.content}</p>
      </div>
    )
  }

  // ── Human message ──────────────────────────────────────────────────────────
  const author = message.author
  const avatarColour = author?.avatar_colour ?? '#94A3B8'
  const displayName = author?.full_name ?? 'Unknown'

  // ── Helper: Render Mentions ────────────────────────────────────────────────
  const renderContent = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\([0-9a-fA-F\-]{36}\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      parts.push(
        <span
          key={match.index}
          className="text-indigo-600 font-medium bg-indigo-50 px-1 py-0.5 rounded cursor-pointer hover:bg-indigo-100 transition-colors"
          title="View profile"
        >
          @{match[1]}
        </span>
      )
      lastIndex = mentionRegex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts
  }

  return (
    <div className={cn('group', isReply && 'ml-10 border-l-2 border-slate-100 pl-3')}>
      <div
        className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-slate-50/80"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar */}
        <div className="mt-0.5 shrink-0" title={displayName}>
          <Avatar user={author} className="!h-8 !w-8 !text-xs select-none" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {displayName}
            </span>
            <span
              className="text-xs text-slate-400 flex-shrink-0 cursor-default"
              title={formatDate(message.created_at)}
            >
              {formatRelative(message.created_at)}
            </span>
          </div>

          {/* Message body */}
          {isDeleted ? (
            <p className="text-sm text-slate-400 italic">This message was deleted.</p>
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
              {renderContent(message.content)}
            </p>
          )}
        </div>

        {/* Hover actions */}
        {isHovered && !isDeleted && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isReply && (
              <button
                onClick={() => onReply(message)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                title="Reply"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Replies */}
      {hasReplies && !isReply && (
        <div className="mt-1 mb-2">
          {visibleReplies.map((reply) => (
            <ThreadMessageItem
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isReply
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
          {replies.length > 3 && (
            <button
              onClick={() => setRepliesExpanded((p) => !p)}
              className="ml-10 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1 font-medium transition-colors"
            >
              {collapsedReplies ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show {replies.length - 3} more {replies.length - 3 === 1 ? 'reply' : 'replies'}
                </>
              ) : (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Collapse replies
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
