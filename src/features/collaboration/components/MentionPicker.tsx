import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getInitials, cn } from '@utils/cn'
import type { User } from '@/types'

interface Props {
  query: string
  users: User[]
  onSelect: (user: User) => void
  onClose: () => void
}

export function MentionPicker({ query, users, onSelect, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter users by query (case-insensitive, first or last name)
  const filteredUsers = users
    .filter((u) => {
      const q = query.toLowerCase()
      return (
        u.first_name.toLowerCase().startsWith(q) ||
        u.last_name.toLowerCase().startsWith(q) ||
        u.full_name.toLowerCase().startsWith(q)
      )
    })
    .slice(0, 8) // Show up to 8 results

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredUsers.length === 0) {
        if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault()
          onClose()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        onSelect(filteredUsers[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === ' ' && query === '') {
        // Dismiss if space typed immediately after @
        onClose()
      }
    }

    // Use capture phase so we intercept before textarea gets it
    const el = document.getElementById('thread-composer-textarea')
    if (el) {
        el.addEventListener('keydown', handleKeyDown, true)
    }
    
    return () => {
        if (el) {
            el.removeEventListener('keydown', handleKeyDown, true)
        }
    }
  }, [filteredUsers, selectedIndex, onSelect, onClose, query])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 flex flex-col"
      >
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Teammates
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="px-4 py-3 text-sm text-slate-500 italic">
            No matching teammates
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredUsers.map((user, idx) => {
              const isActive = idx === selectedIndex
              return (
                <button
                  key={user.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSelect(user)
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                    isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {user.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize truncate">
                      {user.role}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
