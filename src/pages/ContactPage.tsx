import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Sparkles, Building2, Mail, User } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Open default mail client
    const subject = encodeURIComponent(`Demo Request: ${formData.company || formData.name}`)
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Company: ${formData.company}\n\n` +
      `Message:\n${formData.message}`
    )
    window.location.href = `mailto:hello@neuralops.dev?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-[#06080f] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(ellipse, #3b82f6, transparent 60%)' }} />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(ellipse, #ec4899, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden md:block"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles size={14} />
              Let's Connect
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
              Ready to ship with 
              <span className="block" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                confidence?
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
              Book a personalized demo with our engineering team to see how NeuralOps can instantly surface root causes across your microservices.
            </p>
            
            <div className="space-y-6">
              {[
                { label: 'Average Setup Time', value: '5 Minutes' },
                { label: 'Supported Languages', value: 'JS, TS, Python, Go, Java' },
                { label: 'Enterprise Ready', value: 'SOC2 Type II Certified' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-white/40 text-sm font-medium uppercase tracking-wider mb-1">{stat.label}</span>
                  <span className="text-white font-bold text-lg">{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="rounded-2xl p-8 border"
              style={{ background: 'rgba(15,20,40,0.6)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            >
              <h2 className="text-2xl font-bold mb-2 md:hidden">Request a Demo</h2>
              <p className="text-white/50 text-sm mb-8 md:hidden">Fill out the form below and we'll be in touch shortly.</p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      required
                      type="text" 
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Work Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      required
                      type="email" 
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Company</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      required
                      type="text" 
                      placeholder="Acme Corp"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">How can we help?</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Tell us about your current monitoring setup and challenges..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full relative group overflow-hidden rounded-xl font-bold text-white px-6 py-4 mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}
                >
                  <motion.span
                    className="absolute inset-0 -skew-x-12 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', width: '50%' }}
                    animate={{ x: ['-200%', '400%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    Send Request
                    <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
