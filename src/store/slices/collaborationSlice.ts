// src/store/slices/collaborationSlice.ts
// Redux slice for the Incident Discussion Thread feature.
//
// State is keyed by incident_id so multiple incident threads can be cached
// simultaneously. The WebSocket appendMessage action is the primary path for
// live updates; fetchMessagesThunk is the initial load path.

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { collaborationApi } from '@features/dashboard/api/collaborationApi'
import type { ThreadMessage, ThreadMeta } from '@/types'

// ─── State shape ─────────────────────────────────────────────────────────────

interface CollaborationState {
  /** Messages keyed by incident_id */
  messages: Record<string, ThreadMessage[]>
  /** Thread metadata keyed by incident_id */
  threadMeta: Record<string, ThreadMeta>
  /** Loading flag keyed by incident_id */
  isLoading: Record<string, boolean>
  /** Error keyed by incident_id */
  error: Record<string, string | null>
  /** The message being replied to in the composer */
  replyingTo: Record<string, ThreadMessage | null>
}

const initialState: CollaborationState = {
  messages: {},
  threadMeta: {},
  isLoading: {},
  error: {},
  replyingTo: {},
}

// ─── Async thunks ────────────────────────────────────────────────────────────

/** Fetch all messages for an incident thread (initial load). */
export const fetchMessagesThunk = createAsyncThunk(
  'collaboration/fetchMessages',
  async (incidentId: string, { rejectWithValue }) => {
    try {
      const res = await collaborationApi.getMessages(incidentId)
      return {
        incidentId,
        messages: res.data.data,
        threadMeta: res.data.thread,
      }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to load thread.')
    }
  }
)

/** Post a new message to an incident thread. */
export const postMessageThunk = createAsyncThunk(
  'collaboration/postMessage',
  async (
    {
      incidentId,
      content,
      parentId,
    }: { incidentId: string; content: string; parentId?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const res = await collaborationApi.postMessage(incidentId, {
        content,
        parent_id: parentId ?? null,
      })
      return { incidentId, message: res.data.data! }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to send message.')
    }
  }
)

/** Soft-delete a message. */
export const deleteMessageThunk = createAsyncThunk(
  'collaboration/deleteMessage',
  async (
    { incidentId, messageId }: { incidentId: string; messageId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await collaborationApi.deleteMessage(incidentId, messageId)
      return { incidentId, message: res.data.data! }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to delete message.')
    }
  }
)

// ─── Helper: replace/upsert a message in the list ────────────────────────────

function upsertMessage(list: ThreadMessage[], updated: ThreadMessage): ThreadMessage[] {
  // Check if it's a top-level message
  const idx = list.findIndex((m) => m.id === updated.id)
  if (idx !== -1) {
    const next = [...list]
    next[idx] = updated
    return next
  }
  // Check if it's a reply inside a top-level message
  return list.map((m) => {
    if (!m.replies) return m
    const replyIdx = m.replies.findIndex((r) => r.id === updated.id)
    if (replyIdx !== -1) {
      const nextReplies = [...m.replies]
      nextReplies[replyIdx] = updated
      return { ...m, replies: nextReplies }
    }
    return m
  })
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    /**
     * Append a message received from WebSocket (live delivery).
     * If a message with the same id already exists, it is replaced (idempotent).
     */
    appendMessage(
      state,
      action: PayloadAction<{ incidentId: string; message: ThreadMessage }>
    ) {
      const { incidentId, message } = action.payload
      if (!state.messages[incidentId]) {
        state.messages[incidentId] = []
      }
      const list = state.messages[incidentId]

      // Deduplicate: if already present anywhere in the tree, update in place
      const exists = list.some(
        (m) => m.id === message.id || m.replies?.some((r) => r.id === message.id)
      )
      if (exists) {
        state.messages[incidentId] = upsertMessage(list, message)
        return
      }

      // New reply — append under parent
      if (message.parent_id) {
        const parentIdx = list.findIndex((m) => m.id === message.parent_id)
        if (parentIdx !== -1) {
          const parent = { ...list[parentIdx] }
          parent.replies = [...(parent.replies ?? []), message]
          const next = [...list]
          next[parentIdx] = parent
          state.messages[incidentId] = next
          return
        }
      }

      // New top-level message
      state.messages[incidentId] = [...list, message]

      // Bump meta count
      if (state.threadMeta[incidentId]) {
        state.threadMeta[incidentId] = {
          ...state.threadMeta[incidentId],
          message_count: state.threadMeta[incidentId].message_count + 1,
        }
      }
    },

    /** Replace a message in the list (used for soft-delete WS sync). */
    replaceMessage(
      state,
      action: PayloadAction<{ incidentId: string; message: ThreadMessage }>
    ) {
      const { incidentId, message } = action.payload
      if (!state.messages[incidentId]) return
      state.messages[incidentId] = upsertMessage(state.messages[incidentId], message)
    },

    /** Set or clear the replyingTo state for a specific incident. */
    setReplyingTo(
      state,
      action: PayloadAction<{ incidentId: string; message: ThreadMessage | null }>
    ) {
      state.replyingTo[action.payload.incidentId] = action.payload.message
    },

    /** Clear all thread state for an incident (e.g. on page leave). */
    clearThread(state, action: PayloadAction<string>) {
      const id = action.payload
      delete state.messages[id]
      delete state.threadMeta[id]
      delete state.isLoading[id]
      delete state.error[id]
      delete state.replyingTo[id]
    },
  },

  extraReducers: (builder) => {
    // ── fetchMessages ─────────────────────────────────────────────────────────
    builder
      .addCase(fetchMessagesThunk.pending, (state, action) => {
        state.isLoading[action.meta.arg] = true
        state.error[action.meta.arg] = null
      })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        const { incidentId, messages, threadMeta } = action.payload
        state.messages[incidentId] = messages
        state.threadMeta[incidentId] = threadMeta
        state.isLoading[incidentId] = false
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.isLoading[action.meta.arg] = false
        state.error[action.meta.arg] = action.payload as string
      })

    // ── postMessage ───────────────────────────────────────────────────────────
    builder
      .addCase(postMessageThunk.pending, (_state, _action) => {
        // Optimistic: could add a pending message here
      })
      .addCase(postMessageThunk.fulfilled, (state, action) => {
        const { incidentId, message } = action.payload
        const list = state.messages[incidentId] ?? []
        
        const exists = list.some(
          (m) => m.id === message.id || m.replies?.some((r) => r.id === message.id)
        )
        
        if (!exists) {
          if (message.parent_id) {
            const parentIdx = list.findIndex((m) => m.id === message.parent_id)
            if (parentIdx !== -1) {
              const parent = { ...list[parentIdx] }
              parent.replies = [...(parent.replies ?? []), message]
              const next = [...list]
              next[parentIdx] = parent
              state.messages[incidentId] = next
            } else {
              state.messages[incidentId] = [...list, message]
            }
          } else {
            state.messages[incidentId] = [...list, message]
          }
          if (state.threadMeta[incidentId]) {
            state.threadMeta[incidentId] = {
              ...state.threadMeta[incidentId],
              message_count: state.threadMeta[incidentId].message_count + 1,
            }
          }
        }
        // Clear replying-to state after sending
        state.replyingTo[incidentId] = null
      })
      .addCase(postMessageThunk.rejected, (_state, _action) => {
        // Error shown via toast in component
      })

    // ── deleteMessage ─────────────────────────────────────────────────────────
    builder.addCase(deleteMessageThunk.fulfilled, (state, action) => {
      const { incidentId, message } = action.payload
      if (state.messages[incidentId]) {
        state.messages[incidentId] = upsertMessage(state.messages[incidentId], message)
      }
    })
  },
})

export const { appendMessage, replaceMessage, setReplyingTo, clearThread } =
  collaborationSlice.actions

export default collaborationSlice.reducer
