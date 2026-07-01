// src/features/collaboration/components/ThreadComposer.tsx
// The message input area at the bottom of the thread panel.
// Features: auto-expand textarea, Enter-to-send, Shift+Enter for newline,
// reply-context indicator, viewer-role read-only notice.

import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { X, Send, CornerUpLeft, AtSign } from 'lucide-react'
import { cn } from '@utils/cn'
import { Avatar } from '@components/common/Avatar'
import type { ThreadMessage, User } from '@/types'
import { MentionPicker } from './MentionPicker'
import { teamApi } from '@/features/team/api/teamApi'

interface Props {
  incidentId: string
  replyingTo: ThreadMessage | null
  isLoading: boolean
  isViewer: boolean
  value: string
  onChange: (value: string) => void
  onSend: (text?: string) => void
  onCancelReply: () => void
  currentUser?: User | null
}

export function ThreadComposer({
  replyingTo,
  isLoading,
  isViewer,
  value,
  onChange,
  onSend,
  onCancelReply,
  currentUser,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Mention picker state
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1)

  // Fetch team members on mount
  useEffect(() => {
    teamApi.listMembers().then(res => setTeamMembers(res.data || [])).catch(console.error)
  }, [])

  // Auto-resize textarea as content grows
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px` // max ~6 rows
  }, [value])

  // Focus textarea when a reply is set
  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus()
  }, [replyingTo])

  // Handle typing to trigger MentionPicker
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    onChange(newVal)

    // Check if we are currently typing a mention
    const cursor = e.target.selectionStart
    const textBeforeCursor = newVal.slice(0, cursor)
    
    // Regex matches `@` followed by any non-space characters up to the cursor
    const match = textBeforeCursor.match(/@([^\s]*)$/)
    if (match) {
      setMentionQuery(match[1])
      setMentionStartIndex(match.index!)
    } else {
      setMentionQuery(null)
      setMentionStartIndex(-1)
    }
  }

  const handleMentionSelect = (user: User) => {
    if (mentionStartIndex === -1) return
    
    const before = value.slice(0, mentionStartIndex)
    // Insert just the name for WhatsApp-style plain text mentions
    const mentionText = `@${user.full_name} `
    const after = value.slice(mentionStartIndex + (mentionQuery ? mentionQuery.length : 0) + 1)
    
    onChange(before + mentionText + after)
    setMentionQuery(null)
    setMentionStartIndex(-1)
    
    // Refocus textarea after selection
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 10)
  }

  const submitMessage = () => {
    let finalText = value
    // Sort by name length descending so we match the longest names first
    const sortedMembers = [...teamMembers].sort((a, b) => b.full_name.length - a.full_name.length)
    
    sortedMembers.forEach(user => {
      const escapedName = user.full_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match @Name preceded by space or start of string, case-insensitive
      const regex = new RegExp(`(^|\\s)@${escapedName}`, 'gi')
      finalText = finalText.replace(regex, `$1@[${user.full_name}](${user.id})`)
    })
    
    if (finalText.trim()) {
      onSend(finalText)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't send if the mention picker is open
      if (mentionQuery !== null) return
      
      e.preventDefault()
      submitMessage()
    }
  }

  if (isViewer) {
    return (
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400 text-center">
          Viewers can read the thread but cannot post messages.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-100 bg-white">
      {/* Reply context indicator */}
      {replyingTo && replyingTo.author && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/60 border-b border-indigo-100">
          <div className="flex items-center gap-1.5 text-xs text-indigo-600">
            <CornerUpLeft className="w-3 h-3 flex-shrink-0" />
            <span>
              Replying to{' '}
              <span className="font-semibold">{replyingTo.author.full_name}</span>
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="text-indigo-400 hover:text-indigo-600 transition-colors"
            aria-label="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3 relative">
        {/* Current user avatar */}
        <Avatar user={currentUser} className="!h-7 !w-7 !text-xs mb-0.5 shrink-0" />

        {/* Textarea */}
        <div className="flex-1 relative">
          {mentionQuery !== null && (
            <MentionPicker
              query={mentionQuery}
              users={teamMembers}
              onSelect={handleMentionSelect}
              onClose={() => {
                setMentionQuery(null)
                setMentionStartIndex(-1)
              }}
            />
          )}
          <textarea
            id="thread-composer-textarea"
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment… (Enter to send)"
            rows={1}
            disabled={isLoading}
            className={cn(
              'w-full resize-none rounded-xl border border-slate-200 bg-slate-50',
              'px-3 py-2 text-sm text-slate-800 placeholder-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400',
              'transition-all duration-150 leading-relaxed',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'min-h-[38px] max-h-[144px] overflow-y-auto'
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
          {/* @ Mention button */}
          <button
            onClick={() => {
              const cursor = textareaRef.current?.selectionStart || value.length
              const newVal = value.slice(0, cursor) + '@' + value.slice(cursor)
              onChange(newVal)
              
              setMentionQuery('')
              setMentionStartIndex(cursor)

              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.focus()
                  textareaRef.current.setSelectionRange(cursor + 1, cursor + 1)
                }
              }, 10)
            }}
            disabled={isLoading}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              'transition-all duration-150',
              'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
            )}
            aria-label="Mention teammate"
            title="Mention teammate"
          >
            <AtSign className="w-4 h-4" />
          </button>

          {/* Send button */}
          <button
            onClick={() => { if (value.trim()) submitMessage() }}
            disabled={!value.trim() || isLoading}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              'transition-all duration-150',
              value.trim() && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="px-4 pb-2 text-[10px] text-slate-400">
        Press <kbd className="font-mono bg-slate-100 px-1 rounded text-slate-500">Enter</kbd> to send ·{' '}
        <kbd className="font-mono bg-slate-100 px-1 rounded text-slate-500">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}
