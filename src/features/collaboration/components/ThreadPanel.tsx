// src/features/collaboration/components/ThreadPanel.tsx
// The full discussion thread panel that occupies the right column of IncidentDetailPage.
// Handles: message loading, real-time appends, auto-scroll, unread pill,
// reply flow, and message deletion.

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageSquare, Users, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@utils/cn'
import { useAppDispatch, useAppSelector } from '@store/index'
import {
  fetchMessagesThunk,
  postMessageThunk,
  deleteMessageThunk,
  setReplyingTo,
  clearThread,
} from '@store/slices/collaborationSlice'
import type { ThreadMessage } from '@/types'
import { ThreadMessageItem } from './ThreadMessageItem'
import { ThreadComposer } from './ThreadComposer'
import { Skeleton } from '@components/common/Skeleton'

interface Props {
  incidentId: string
}



export function ThreadPanel({ incidentId }: Props) {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((s) => s.auth.user)

  const messages = useAppSelector((s) => s.collaboration.messages[incidentId] ?? [])
  const threadMeta = useAppSelector((s) => s.collaboration.threadMeta[incidentId])
  const isLoading = useAppSelector((s) => s.collaboration.isLoading[incidentId] ?? false)
  const error = useAppSelector((s) => s.collaboration.error[incidentId])
  const replyingTo = useAppSelector((s) => s.collaboration.replyingTo[incidentId] ?? null)

  const [composerValue, setComposerValue] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const listRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  const isViewer = currentUser?.role === 'viewer'

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchMessagesThunk(incidentId))
    return () => {
      dispatch(clearThread(incidentId))
    }
  }, [incidentId, dispatch])

  // ── Auto-scroll & unread pill ─────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
    setUnreadCount(0)
    setIsAtBottom(true)
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    const newCount = messages.length - prevMessageCountRef.current
    prevMessageCountRef.current = messages.length

    if (newCount > 0) {
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(true), 50)
      } else {
        setUnreadCount((c) => c + newCount)
      }
    }
  }, [messages.length, isAtBottom, scrollToBottom])

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(false)
        prevMessageCountRef.current = messages.length
      }, 50)
    }
  }, [isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setIsAtBottom(atBottom)
    if (atBottom) setUnreadCount(0)
  }

  // ── Sending a message ─────────────────────────────────────────────────────
  const handleSend = async (overrideContent?: string | React.MouseEvent | React.KeyboardEvent) => {
    const contentToUse = typeof overrideContent === 'string' ? overrideContent : composerValue;
    const content = contentToUse.trim()
    if (!content || isPosting) return

    setIsPosting(true)
    setComposerValue('')
    await dispatch(
      postMessageThunk({
        incidentId,
        content,
        parentId: replyingTo?.id ?? null,
      })
    )
    setIsPosting(false)
    scrollToBottom()
  }

  // ── Reply flow ────────────────────────────────────────────────────────────
  const handleReply = (message: ThreadMessage) => {
    dispatch(setReplyingTo({ incidentId, message }))
  }

  const handleCancelReply = () => {
    dispatch(setReplyingTo({ incidentId, message: null }))
  }

  // ── Delete message ────────────────────────────────────────────────────────
  const handleDelete = async (messageId: string) => {
    await dispatch(deleteMessageThunk({ incidentId, messageId }))
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100 min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-800">Discussion Thread</span>
          {threadMeta && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
              {threadMeta.message_count}
            </span>
          )}
        </div>
        {threadMeta && threadMeta.participant_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3 h-3" />
            <span>{threadMeta.participant_count}</span>
          </div>
        )}
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2 min-h-0 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-4 p-4 h-full">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-16 h-2" />
                  </div>
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-4/5 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-indigo-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to add a comment to this incident.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {!isLoading && messages.length > 0 && (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <ThreadMessageItem
                    message={msg}
                    currentUserId={currentUser?.id}
                    currentUserRole={currentUser?.role}
                    onReply={handleReply}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Unread pill */}
      <AnimatePresence>
        {unreadCount > 0 && !isAtBottom && (
          <motion.div
            className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <button
              onClick={() => scrollToBottom()}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="flex-shrink-0">
        <ThreadComposer
          incidentId={incidentId}
          replyingTo={replyingTo}
          isLoading={isPosting}
          isViewer={isViewer}
          value={composerValue}
          onChange={setComposerValue}
          onSend={handleSend}
          onCancelReply={handleCancelReply}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}
