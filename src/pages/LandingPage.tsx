import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence, useAnimation } from 'framer-motion'
import { useAppSelector } from '@store/index'
import {
  Zap, ShieldAlert, FileSearch, Bell, ArrowRight, ChevronRight,
  Activity, Code2, GitBranch, Terminal, CheckCircle2, Cpu,
  BarChart3, Layers, AlertTriangle, Clock, X, Menu
} from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

// ─── Crash Word: single-block brick-fall hover animation ─────────────────────
function CrashWord() {
  const controls = useAnimation()
  const isBusy   = useRef(false)

  const handleHoverStart = async () => {
    if (isBusy.current) return
    isBusy.current = true

    // Phase 1: violent rattle
    await controls.start({
      x: [0, -22, 38, -40, 32, -28, 36, -20, 12, 0],
      y: [0,   6,  -9,  12,  -9,   7, -11,   6,  0, 0],
      transition: { duration: 0.6, ease: 'linear' },
    })

    // Phase 2: slow heavy drop
    await controls.start({
      y: 140,
      rotate: -6,
      opacity: 0,
      transition: { duration: 0.8, ease: [0.55, 0.055, 0.675, 0.19] },
    })
  }

  const handleHoverEnd = async () => {
    controls.stop()
    await controls.start({
      x: 0, y: 0, rotate: 0, opacity: 1,
      transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
    })
    isBusy.current = false
  }

  return (
    // Static wrapper — never moves, owns the hover detection
    <span
      className="inline-block cursor-default select-none"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {/* Only this inner span animates */}
      <motion.span
        animate={controls}
        initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
        className="inline-block"
        style={{ transformOrigin: 'center top' }}
      >
        crash
      </motion.span>
    </span>
  )
}

// ─── Helper: Animated Counter ────────────────────────────────────────────────
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const step = 16
    const increment = to / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= to) { setCount(to); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, to])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ─── Helper: Typewriter ───────────────────────────────────────────────────────
function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[idx]
    let timeout: ReturnType<typeof setTimeout>
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60)
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 30)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIdx((i) => (i + 1) % texts.length)
    }
    return () => clearTimeout(timeout)
  }, [displayed, deleting, idx, texts])

  return (
    <span className="text-cyan-400">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  )
}

// ─── Floating Log Lines Component ─────────────────────────────────────────────
const logLines = [
  { time: '14:23:01', level: 'ERROR', msg: 'IntegrityError: duplicate key value violates unique constraint', color: '#ef4444' },
  { time: '14:23:01', level: 'INFO',  msg: 'POST /api/admin/simulate_duplicate_key → 500',                  color: '#6b7280' },
  { time: '14:23:02', level: 'ERROR', msg: 'AttributeError: NoneType object has no attribute "user_id"',    color: '#ef4444' },
  { time: '14:23:02', level: 'WARN',  msg: 'Payment service timeout after 5000ms on /refund_order',         color: '#f59e0b' },
  { time: '14:23:03', level: 'ERROR', msg: 'ZeroDivisionError in services/order_service.py:142',            color: '#ef4444' },
  { time: '14:23:03', level: 'INFO',  msg: 'AI analysis complete — root cause identified in 1.2s',          color: '#22c55e' },
  { time: '14:23:04', level: 'INFO',  msg: 'Runbook triggered: auto-scale inventory_service replicas',       color: '#22c55e' },
]

// ─── Particle Background ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 4,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Section Wrapper with scroll reveal ──────────────────────────────────────
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.4])

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const features = [
    {
      icon: ShieldAlert,
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.3)',
      title: 'Instant Error Detection',
      desc: 'Catch crashes across all your microservices the moment they happen. Zero delay, zero missed errors.',
      tag: 'Real-time',
    },
    {
      icon: Cpu,
      color: '#22c55e',
      glow: 'rgba(34,197,94,0.3)',
      title: 'AI Root Cause Analysis',
      desc: 'Our AI reads your stack traces, logs, and code to tell you exactly why it broke — not just where.',
      tag: 'AI-Powered',
    },
    {
      icon: FileSearch,
      color: '#06b6d4',
      glow: 'rgba(6,182,212,0.3)',
      title: 'Log Explorer',
      desc: 'Search, filter, and correlate logs across all services in milliseconds. Elasticsearch-powered.',
      tag: 'Full-text Search',
    },
    {
      icon: Bell,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.3)',
      title: 'Smart Alerting',
      desc: 'Get notified before users report it. Configurable rules with Slack, email, and webhook delivery.',
      tag: 'Proactive',
    },
    {
      icon: BarChart3,
      color: '#8b5cf6',
      glow: 'rgba(139,92,246,0.3)',
      title: 'Analytics & Trends',
      desc: 'Track error frequency, resolution rates, MTTR, and service health over time with rich charts.',
      tag: 'Insights',
    },
    {
      icon: GitBranch,
      color: '#ec4899',
      glow: 'rgba(236,72,153,0.3)',
      title: 'Team Collaboration',
      desc: 'Assign incidents, track ownership, set runbooks. Bring your engineering team into one workflow.',
      tag: 'Teamwork',
    },
  ]

  const steps = [
    { num: '01', icon: Code2,     color: '#3b82f6', title: 'Integrate in Minutes',  desc: 'Install our lightweight agent or send logs via our REST API. No complex setup.' },
    { num: '02', icon: Activity,  color: '#22c55e', title: 'Monitor Everything',    desc: 'Errors, logs, traces, and performance — all streamed in real-time to your dashboard.' },
    { num: '03', icon: Zap,       color: '#f59e0b', title: 'Fix Faster with AI',   desc: 'NeuralOps pinpoints the root cause and suggests exact code fixes, saving hours of debugging.' },
  ]

  const rootCauseSteps = [
    { icon: '⚡', text: 'User submits checkout form',           done: true  },
    { icon: '→',  text: 'Frontend sends POST /api/checkout',    done: true  },
    { icon: '→',  text: 'FastAPI controller receives request',  done: true  },
    { icon: '⚠️', text: 'ZeroDivisionError: quantity is 0',    done: false, highlight: true },
    { icon: '→',  text: 'Error propagates, 500 returned',       done: false },
  ]

  return (
    <div
      style={{ background: 'linear-gradient(135deg, #06080f 0%, #0a0e1a 40%, #080c18 100%)', fontFamily: "'Geist', sans-serif" }}
      className="min-h-screen text-white overflow-x-hidden"
    >
      {/* ── Gradient orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(59,130,246,0.12), transparent)' }} className="absolute inset-0" />
        <div style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(139,92,246,0.08), transparent)' }} className="absolute inset-0" />
        <div style={{ background: 'radial-gradient(ellipse 40% 30% at 50% 80%, rgba(6,182,212,0.06), transparent)' }} className="absolute inset-0" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════ NAVBAR */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(6,8,20,0.90)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
                  style={{ background: 'rgba(59,130,246,0.5)' }}
                />
                <div className="relative h-8 w-8 rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}>
                  <img src="/Logo.png" alt="NeuralOps" className="h-full w-full object-cover scale-[1.15]" />
                </div>
              </div>
              <span
                className="font-bold text-base tracking-tight"
                style={{ background: 'linear-gradient(135deg, #ffffff, #c7d9f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                NeuralOps
              </span>
            </Link>

            {/* Desktop Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {['Features', 'How It Works', 'Pricing'].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="relative group px-4 py-2 text-sm text-white/50 hover:text-white transition-colors duration-200 rounded-xl hover:bg-white/5"
                >
                  {item}
                  <span
                    className="absolute bottom-1.5 left-4 right-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"
                    style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}
                  />
                </a>
              ))}
              <Link
                to="/docs"
                className="relative group px-4 py-2 text-sm text-white/50 hover:text-white transition-colors duration-200 rounded-xl hover:bg-white/5"
              >
                Docs
                <span
                  className="absolute bottom-1.5 left-4 right-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}
                />
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm text-white/50 hover:text-white transition-colors duration-200 px-4 py-2 rounded-xl hover:bg-white/5"
              >
                Sign In
              </Link>
              {/* Glowing CTA button with shimmer */}
              <Link
                to="/register"
                className="relative group overflow-hidden text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  boxShadow: '0 0 24px rgba(59,130,246,0.45)',
                }}
              >
                <motion.span
                  className="absolute inset-0 -skew-x-12 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                />
                <span className="relative flex items-center gap-1.5">
                  Get Started Free
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </span>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} /></motion.div>
                  : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={18} /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -8 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -8 }}
                className="overflow-hidden"
                style={{ background: 'rgba(6,8,20,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
                  {['Features', 'How It Works', 'Pricing'].map(item => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                      className="text-sm text-white/60 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                      onClick={() => setMobileOpen(false)}
                    >{item}</a>
                  ))}
                  <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <Link to="/login" className="text-sm text-white/60 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-white px-4 py-2.5 rounded-xl text-center mt-1"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started Free
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════ HERO */}
      <div ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 z-10 overflow-hidden">
        <Particles />

        {/* Ambient glow orbs — depth layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-[480px] h-[480px] rounded-full blur-[120px] opacity-25"
            style={{ background: 'radial-gradient(ellipse, #3b82f6, transparent 70%)' }} />
          <div className="absolute top-[20%] right-[10%] w-[380px] h-[380px] rounded-full blur-[100px] opacity-20"
            style={{ background: 'radial-gradient(ellipse, #06b6d4, transparent 70%)' }} />
          <div className="absolute bottom-[15%] left-[30%] w-[500px] h-[300px] rounded-full blur-[120px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, #8b5cf6, transparent 70%)' }} />
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center font-black leading-[1.0] tracking-tight px-4 relative z-10"
          style={{ fontSize: 'clamp(3.8rem, 11vw, 8.5rem)' }}
        >
          <span className="text-white block">Catch the <CrashWord />.</span>
          <span className="block mt-2" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 45%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Ship the cure.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-8 text-center text-xl md:text-2xl text-white/45 max-w-4xl px-6 leading-relaxed relative z-10"
        >
          NeuralOps reads your logs, traces root causes across your codebase,
          and delivers actionable fixes —&nbsp;
          <span className="text-white/70 font-medium">
            <Typewriter texts={['before your team wakes up.', 'in under 2 minutes.', 'automatically.']} />
          </span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4 relative z-10"
        >
          {/* Primary — glowing shimmer */}
          <Link to="/register"
            className="group relative overflow-hidden flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-[15px] transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 0 50px rgba(59,130,246,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}
          >
            <motion.span
              className="absolute inset-0 -skew-x-12 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', width: '50%' }}
              animate={{ x: ['-150%', '350%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            />
            <span className="relative">Get Started Free</span>
            <ArrowRight size={17} className="relative group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary — glass */}
          <Link to="/contact"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-[15px] text-white/70 hover:text-white border transition-all hover:scale-[1.02]"
            style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
          >
            Get a Demo
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-10 flex flex-col items-center gap-3 relative z-10"
        >
          <p className="text-xs text-white/25 tracking-[0.2em] uppercase">Trusted by engineering teams at</p>
          <div className="flex items-center gap-8">
            {['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma'].map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.08 }}
                className="text-sm font-bold tracking-tight text-white/20 hover:text-white/40 transition-colors cursor-default"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* ── Hero Visual: Lottie + Floating Cards ── */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mt-20 w-full max-w-6xl mx-auto px-6"
        >
          {/* Lottie frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              border: '1px solid rgba(59,130,246,0.25)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 120px rgba(59,130,246,0.2), 0 0 200px rgba(6,182,212,0.08)',
              background: 'rgba(6,10,25,0.6)',
            }}
          >
            {/* Top bar chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,8,20,0.8)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1 rounded-full text-[11px] text-white/30 font-mono"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  neuralops.adinath.site — Live Dashboard
                </div>
              </div>
            </div>
            <DotLottieReact
              src="/Man and robot with computers sitting together in workplace.lottie"
              loop autoplay
              className="w-full"
              style={{ maxHeight: 460 }}
            />
            {/* Fade-to-dark at bottom */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(6,8,20,0.9) 0%, transparent 55%)' }} />
          </motion.div>

          {/* ── Floating card: Critical Error ── */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="absolute -left-2 md:-left-8 top-20 w-60 rounded-2xl p-4 border"
            style={{ background: 'rgba(10,14,35,0.92)', borderColor: 'rgba(239,68,68,0.35)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(239,68,68,0.12), 0 0 0 1px rgba(239,68,68,0.08)' }}
            animate={{ y: [0, -10, 0] } as never}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.3 } as never}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Critical Error</span>
              <span className="ml-auto text-[10px] text-white/30">2m ago</span>
            </div>
            <p className="text-[11px] font-mono text-red-300/80 leading-relaxed mb-2">
              IntegrityError: duplicate key<br />violates unique constraint
            </p>
            <div className="flex items-center gap-1.5">
              <div className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                production
              </div>
              <span className="text-[10px] text-white/30">fastapi-service</span>
            </div>
          </motion.div>

          {/* ── Floating card: AI Root Cause ── */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            className="absolute -right-2 md:-right-8 top-12 w-62 rounded-2xl p-4 border"
            style={{ background: 'rgba(10,14,35,0.92)', borderColor: 'rgba(34,197,94,0.35)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(34,197,94,0.12), 0 0 0 1px rgba(34,197,94,0.08)', width: 248 }}
            animate={{ y: [0, -12, 0] } as never}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 } as never}
          >
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={13} className="text-green-400" />
              <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">AI Root Cause</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>99%</span>
            </div>
            <div className="space-y-1.5">
              {['POST /api/checkout ← entry', 'quantity_check() ← null guard', 'ZeroDivisionError thrown'].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-white/60">
                  <CheckCircle2 size={10} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="font-mono">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Floating card: Resolved ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7 }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-7 w-72 rounded-2xl p-4 border"
            style={{ background: 'rgba(10,14,35,0.92)', borderColor: 'rgba(59,130,246,0.35)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.08)' }}
            animate={{ y: [0, -8, 0] } as never}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2.2 } as never}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-blue-400" />
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Auto-Resolved</span>
              </div>
              <span className="text-[10px] font-bold text-green-400">1.2s</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['Runbook triggered', 'Scaled ×3', '#on-call notified'].map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full text-white/50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>


      {/* ═══════════════════════════════════════════════════════ STATS BAR */}
      <Section className="relative z-10 py-16 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' } as React.CSSProperties}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Avg Setup Time',        val: 5,     suffix: ' min',   color: '#3b82f6' },
            { label: 'Errors Caught',          val: 99999, suffix: '+',      color: '#22c55e' },
            { label: 'Faster Resolution',      val: 3,     suffix: 'x',      color: '#f59e0b' },
            { label: 'Uptime SLA',             val: 99,    suffix: '.9%',    color: '#06b6d4' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-4xl font-black mb-1" style={{ color: stat.color }}>
                <Counter to={stat.val} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ FEATURES */}
      <Section id="features" className="relative z-10 py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
            Developer First. Always.
          </div>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Everything you need to<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ship with confidence.
            </span>
          </h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            From detection to resolution, NeuralOps covers the entire incident lifecycle — powered by AI that actually understands your code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group relative p-6 rounded-2xl border cursor-default transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${feat.glow} 0%, transparent 70%)` }}
              />
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}30` }}
                >
                  <feat.icon size={20} style={{ color: feat.color }} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-bold text-white">{feat.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${feat.color}18`, color: feat.color }}>
                    {feat.tag}
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ LIVE LOG STREAM */}
      <Section className="relative z-10 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-5"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }}>
              Real-time Visibility
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Everything's
              <br />
              <span style={{ background: 'linear-gradient(135deg, #06b6d4, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                connected.
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Errors, logs, and traces — all correlated by the same incident thread. No more tab-switching or tool-hopping.
            </p>
            <div className="space-y-4">
              {[
                { icon: AlertTriangle, color: '#ef4444', text: 'Catch errors across all microservices instantly' },
                { icon: FileSearch,    color: '#06b6d4', text: 'Search 10 million log lines in under 200ms' },
                { icon: Layers,        color: '#8b5cf6', text: 'Correlate distributed traces end-to-end' },
                { icon: Zap,           color: '#22c55e', text: 'AI links the error → log → trace → fix automatically' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}18` }}>
                    <item.icon size={12} style={{ color: item.color }} />
                  </div>
                  <span className="text-sm text-white/70">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Animated log stream */}
          <div className="relative">
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ background: 'rgba(6,8,15,0.8)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 0 60px rgba(6,182,212,0.1)' }}
            >
              {/* Terminal top bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-xs text-white/40 font-mono">neuralops.adinath.site — Live Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400">LIVE</span>
                </div>
              </div>
              {/* Log lines */}
              <div className="p-4 font-mono text-[11px] space-y-1.5 overflow-hidden" style={{ maxHeight: 280 }}>
                {logLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-white/25 shrink-0">{line.time}</span>
                    <span className="shrink-0 w-12 font-bold" style={{ color: line.color }}>{line.level}</span>
                    <span className="text-white/60 truncate">{line.msg}</span>
                  </motion.div>
                ))}
                {/* Blinking cursor */}
                <div className="flex items-center gap-3">
                  <span className="text-white/25">14:23:05</span>
                  <span className="text-blue-400 font-bold w-12">INFO</span>
                  <span className="w-2 h-3 bg-blue-400 animate-pulse inline-block" />
                </div>
              </div>
            </div>
            {/* Glow underneath */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 rounded-full blur-3xl opacity-30"
              style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }} />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ ROOT CAUSE / AI */}
      <Section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: AI Root cause card */}
          <div className="relative order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl p-5 border"
              style={{ background: 'rgba(6,8,15,0.8)', borderColor: 'rgba(34,197,94,0.2)', boxShadow: '0 0 60px rgba(34,197,94,0.08)' }}
            >
              {/* Error header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-red-400">ZeroDivisionError</span>
                </div>
                <span className="text-[10px] text-white/30">Analyzing...</span>
              </div>

              <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <Terminal size={12} className="text-red-400 shrink-0" />
                <code className="text-[11px] font-mono text-red-300">division by zero in order_service.py:142</code>
              </div>

              {/* Root cause steps */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={14} className="text-green-400" />
                  <span className="text-sm font-bold text-green-400">Root Cause</span>
                </div>
                <div className="space-y-2">
                  {rootCauseSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.12 }}
                      className="flex items-center gap-2.5 text-xs"
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] ${step.highlight ? 'bg-red-500/20' : step.done ? 'bg-green-500/20' : 'bg-white/5'}`}>
                        {step.done ? <CheckCircle2 size={8} className="text-green-400" /> : step.highlight ? <AlertTriangle size={8} className="text-red-400" /> : <div className="w-1 h-1 rounded-full bg-white/20" />}
                      </div>
                      <span className={step.highlight ? 'text-red-400 font-medium' : step.done ? 'text-white/60' : 'text-white/30'}>
                        {step.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Fix suggestion */}
              <div className="p-3 rounded-xl border" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={12} className="text-green-400" />
                  <span className="text-xs font-bold text-green-400">AI Suggested Fix</span>
                </div>
                <code className="text-[10px] font-mono text-white/60 leading-relaxed">
                  {'if quantity == 0:'}<br />
                  {'  raise ValueError("Quantity cannot be zero")'}<br />
                  {'price_per_unit = total / quantity  # ← safe now'}
                </code>
              </div>
            </motion.div>

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full blur-3xl opacity-20"
              style={{ background: 'linear-gradient(90deg, #22c55e, #06b6d4)' }} />
          </div>

          {/* Right: Text */}
          <div className="order-1 lg:order-2">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-5"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
              AI Debugging
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Debugging needs context —
              <br />
              <span style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                with AI.
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-6">
              NeuralOps AI analyzes every signal — logs, stack traces, code, commits — and tells you exactly why it broke, not just where.
            </p>
            <div className="space-y-3">
              {[
                'Analyzes every signal to explain why your code failed',
                'Generates merge-ready patches automatically',
                'Learns from your codebase and history',
                'Stops bad code before it starts bad days',
              ].map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-white/60">{point}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ HOW IT WORKS */}
      <Section id="how-it-works" className="relative z-10 py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black">Up and running in minutes.</h2>
            <p className="mt-4 text-white/40 max-w-lg mx-auto">Three steps between you and production-grade incident intelligence.</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-14 left-1/6 right-1/6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(6,182,212,0.4), transparent)' }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="relative flex flex-col items-center text-center p-8 rounded-2xl border"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
                  whileHover={{ borderColor: `${step.color}40`, background: `${step.color}06` }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30`, boxShadow: `0 0 30px ${step.color}20` }}
                  >
                    <step.icon size={24} style={{ color: step.color }} />
                  </div>
                  <div className="text-5xl font-black mb-3 opacity-10">{step.num}</div>
                  <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ PRICING */}
      <Section id="pricing" className="relative z-10 py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Simple, transparent pricing.</h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">Choose the right AI debugging power for your team. Upgrade or downgrade at any time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {[
              {
                name: 'Developer',
                price: '₹0',
                desc: 'Perfect for side projects and small teams.',
                features: ['Up to 3 team members', '2 API Keys', '30-day log retention', '100 req/min API rate limit'],
                button: 'Start for free',
                color: '#94a3b8'
              },
              {
                name: 'Pro',
                price: '₹1,000',
                desc: 'For professional teams building at scale.',
                features: ['Up to 25 team members', '10 API Keys', '90-day log retention', '500 req/min API rate limit'],
                isPopular: true,
                button: 'Get Pro',
                color: '#3b82f6'
              },
              {
                name: 'Max',
                price: '₹2,000',
                desc: 'Maximum power and unlimited everything.',
                features: ['Unlimited team members', 'Unlimited API Keys', '365-day log retention', '2,000 req/min API rate limit', 'Priority support'],
                button: 'Get Max',
                color: '#8b5cf6'
              }
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative rounded-3xl p-8 border flex flex-col transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(6,8,15,0.8)',
                  borderColor: plan.isPopular ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)',
                  boxShadow: plan.isPopular ? '0 0 50px rgba(59,130,246,0.1)' : '0 20px 40px rgba(0,0,0,0.2)',
                }}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-md"
                    style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-black">{plan.price}</span>
                  {plan.price !== '₹0' && <span className="text-white/40 ml-1 font-medium">/mo</span>}
                </div>
                <p className="text-sm text-white/50 mb-8 h-10">{plan.desc}</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 size={16} style={{ color: plan.color }} className="mt-0.5 shrink-0" />
                      <span className="text-sm text-white/70 leading-relaxed font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="w-full inline-flex justify-center items-center px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] mt-auto"
                  style={{
                    background: plan.isPopular ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: plan.isPopular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {plan.button}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ TESTIMONIALS */}
      <Section id="testimonials" className="relative z-10 py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
              Loved by developers
            </h2>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #ec4899 0%, #d946ef 50%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
              worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {[
              {
                quote: "We wouldn't have scaled without NeuralOps. Most of our incidents are hardware-related—and we debug them all inside NeuralOps",
                name: "Nova DasSarma",
                title: "Systems Lead, Anthropic",
                logo: "A"
              },
              {
                quote: "NeuralOps's high-quality tooling helps Disney+ maintain high-quality service to its tens of millions of global subscribers.",
                name: "Andrew Hay",
                title: "Director at Disney Streaming Services, Disney+",
                logo: "D"
              },
              {
                quote: "The signal we get from NeuralOps is the most reliable indicator of software issues and is used throughout Instacart because it can be easily configured for each service regardless of the language or framework.",
                name: "Igor Dobrovitski",
                title: "Infrastructure Software Engineer, Instacart",
                logo: "I"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col"
              >
                <div 
                  className="text-4xl font-serif font-black leading-none mb-4" 
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  “
                </div>
                <p className="text-lg font-medium text-white/90 leading-relaxed mb-8 italic">
                  {testimonial.quote}
                </p>
                <div className="mt-auto flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg">
                     <span className="text-black font-black text-xl">{testimonial.logo}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-[15px] leading-tight">{testimonial.name}</h4>
                    <p className="text-white/50 text-[13px] leading-snug mt-1">{testimonial.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ CTA SECTION */}
      <Section className="relative z-10 py-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(ellipse, #3b82f6, #06b6d4, transparent)' }} />
        </div>
        <Particles />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-8 text-white">
              Fix It
            </h2>
            <p className="text-[22px] leading-relaxed text-white font-medium max-w-3xl text-center mb-10">
              Get started with the only application monitoring platform that empowers developers to fix application problems without compromising on velocity.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Link to="/register"
                className="font-bold text-[14px] px-8 py-3.5 rounded-[6px] hover:opacity-90 transition-opacity uppercase tracking-wide inline-block"
                style={{ backgroundColor: '#ffffff', color: '#1a1b26' }}
              >
                Try NeuralOps for Free
              </Link>
              <Link to="/contact"
                className="relative bg-transparent text-white font-bold text-[14px] px-8 py-3.5 rounded-[6px] uppercase tracking-wide group inline-block overflow-hidden"
              >
                <div className="absolute inset-0 rounded-[6px] p-[1px] bg-gradient-to-r from-[#f59e0b] to-[#ec4899] mask-[linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]" style={{ WebkitMaskComposite: "xor", maskComposite: "exclude" }}></div>
                <div className="absolute inset-0 rounded-[6px] bg-gradient-to-r from-[#f59e0b] to-[#ec4899] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <span className="relative z-10 text-white">Get a Demo</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ FOOTER */}
      <footer className="relative z-10 border-t py-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img src="/Logo.png" alt="NeuralOps" className="h-full w-full object-cover scale-[1.15]" />
            </div>
            <span className="text-sm font-bold text-white/60">NeuralOps</span>
          </div>
          <p className="text-xs text-white/25">© 2025 NeuralOps. AI-powered incident intelligence.</p>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <Link to="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white/60 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
