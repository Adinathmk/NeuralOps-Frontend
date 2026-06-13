import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@components/common/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap size={20} className="text-slate-900" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-7xl font-black text-slate-900/10 select-none">404</p>
          <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/dashboard">
            <Button className="w-full gap-2">
              <ArrowLeft size={14} /> Back to dashboard
            </Button>
          </Link>
          <Link to="/dashboard/incidents">
            <Button variant="outline" className="w-full gap-2">
              <Search size={14} /> Browse incidents
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}