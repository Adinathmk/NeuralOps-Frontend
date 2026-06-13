import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AlertRulesTab from './tabs/AlertRulesTab'
import PlaybooksTab from './tabs/PlaybooksTab'
import { cn } from '@utils/cn'

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<'alert-rules' | 'playbooks'>('alert-rules')

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuration</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your incident response automation and alert thresholds.</p>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('alert-rules')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors relative',
            activeTab === 'alert-rules' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Alert Rules
          {activeTab === 'alert-rules' && (
            <motion.div
              layoutId="config-tab-indicator"
              className="absolute left-0 right-0 bottom-0 h-0.5 bg-indigo-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('playbooks')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors relative',
            activeTab === 'playbooks' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Playbooks
          {activeTab === 'playbooks' && (
            <motion.div
              layoutId="config-tab-indicator"
              className="absolute left-0 right-0 bottom-0 h-0.5 bg-indigo-600"
            />
          )}
        </button>
      </div>

      <div className="pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'alert-rules' && <AlertRulesTab />}
            {activeTab === 'playbooks' && <PlaybooksTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
