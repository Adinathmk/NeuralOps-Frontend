import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Zap, Copy, Check, Package, Code2,
  BookOpen, ChevronRight, ExternalLink, Shield,
  Activity, AlertTriangle, GitBranch, ArrowRight,
  Play, Download, Key, Layers, Terminal
} from "lucide-react"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
        color: copied ? "#4ade80" : "rgba(255,255,255,0.5)",
        border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

function CodeBlock({ code, language = "bash", title }: { code: string; language?: string; title?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(6,8,15,0.9)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-white/40 font-mono">{title || language}</span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre className="p-5 text-sm font-mono overflow-x-auto leading-relaxed">
        <code style={{ color: "#e2e8f0" }}>{code}</code>
      </pre>
    </div>
  )
}

const sections = [
  { id: "installation",  label: "Installation",     icon: Download },
  { id: "quickstart",    label: "Quick Start",       icon: Play },
  { id: "configuration", label: "Configuration",     icon: Key },
  { id: "capture",       label: "Capturing Errors",  icon: AlertTriangle },
  { id: "logging",       label: "Log Ingestion",     icon: Activity },
  { id: "frameworks",    label: "Framework Guides",  icon: Layers },
  { id: "reference",     label: "API Reference",     icon: BookOpen },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("installation")

  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(6,8,15,0.88)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.2))", border: "1px solid rgba(59,130,246,0.3)" }}>
              <Zap size={16} className="text-blue-400" />
            </div>
            <span className="font-bold text-white">NeuralOps</span>
            <ChevronRight size={14} className="text-white/30" />
            <span className="font-semibold text-white/60">SDK Docs</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="https://pypi.org/project/neuralops-sdk/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
              <Package size={14} /> PyPI <ExternalLink size={12} />
            </a>
            <Link to="/register" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)", boxShadow: "0 0 20px rgba(59,130,246,0.25)" }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[120px] opacity-10" style={{ background: "radial-gradient(ellipse,#3b82f6,transparent 70%)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: "radial-gradient(ellipse,#8b5cf6,transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12 relative z-10">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0 sticky top-24 self-start h-fit">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 px-3">On This Page</p>
          {sections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
              style={{ background: activeSection === s.id ? "rgba(59,130,246,0.12)" : "transparent", color: activeSection === s.id ? "#60a5fa" : "rgba(255,255,255,0.45)", borderLeft: activeSection === s.id ? "2px solid #3b82f6" : "2px solid transparent" }}>
              <s.icon size={14} />{s.label}
            </button>
          ))}
          <div className="mt-8 p-4 rounded-2xl border" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.15)" }}>
            <p className="text-xs text-white/50 mb-3">Current Version</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-bold text-white text-sm">v1.0.0</span>
            </div>
            <a href="https://pypi.org/project/neuralops-sdk/" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View on PyPI <ExternalLink size={10} />
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-20">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
              <Package size={12} /> neuralops-sdk · Python
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              SDK
              <span className="block" style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Documentation</span>
            </h1>
            <p className="text-xl text-white/50 max-w-2xl leading-relaxed mb-8">
              The official Python SDK for NeuralOps — automatic incident detection, error capture, and log ingestion in under 5 minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "PyPI Package", val: "neuralops-sdk", icon: Package, color: "#3b82f6" },
                { label: "Version", val: "1.0.0", icon: GitBranch, color: "#22c55e" },
                { label: "Language", val: "Python 3.8+", icon: Code2, color: "#8b5cf6" },
                { label: "License", val: "MIT", icon: Shield, color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm" style={{ background: `${s.color}0d`, borderColor: `${s.color}25`, color: "rgba(255,255,255,0.7)" }}>
                  <s.icon size={13} style={{ color: s.color }} />
                  <span className="text-white/40">{s.label}:</span>
                  <span className="font-semibold">{s.val}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* INSTALLATION */}
          <section id="installation" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <Download size={18} className="text-blue-400" />
              </div>
              <div><h2 className="text-2xl font-black">Installation</h2><p className="text-sm text-white/40">Install the SDK via pip</p></div>
            </div>
            <div className="space-y-6">
              <div><p className="text-white/60 mb-3">Install using pip (recommended):</p><CodeBlock code="pip install neuralops-sdk" title="terminal" /></div>
              <div><p className="text-white/60 mb-3">Or add to your <code className="text-blue-400 text-sm bg-blue-400/10 px-1.5 py-0.5 rounded">requirements.txt</code>:</p><CodeBlock code="neuralops-sdk==1.0.0" title="requirements.txt" language="text" /></div>
              <div><p className="text-white/60 mb-3">Using Poetry:</p><CodeBlock code="poetry add neuralops-sdk" title="terminal" /></div>
            </div>
          </section>

          {/* QUICK START */}
          <section id="quickstart" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Play size={18} className="text-green-400" />
              </div>
              <div><h2 className="text-2xl font-black">Quick Start</h2><p className="text-sm text-white/40">Up and running in 60 seconds</p></div>
            </div>
            <p className="text-white/60 mb-4">Initialize the SDK at the entry point of your application:</p>
            <CodeBlock title="main.py" language="python" code={`import neuralops\n\n# Initialize with your API key\nneuralops.init(\n    api_key="YOUR_NEURALOPS_API_KEY",\n    environment="production",   # or "staging", "development"\n    service_name="my-service",  # identifies your service in the dashboard\n)\n\nprint("NeuralOps SDK initialized \u2713")`} />
            <div className="mt-6 p-5 rounded-2xl border" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.15)" }}>
              <div className="flex items-center gap-2 mb-2"><Key size={14} className="text-blue-400" /><span className="text-sm font-bold text-blue-400">Where to find your API key</span></div>
              <p className="text-sm text-white/50">Get your API key from <Link to="/dashboard/settings/api-keys" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Dashboard &rarr; Settings &rarr; API Keys</Link>. Keep it secret — never commit to version control.</p>
            </div>
          </section>

          {/* CONFIGURATION */}
          <section id="configuration" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Key size={18} className="text-amber-400" />
              </div>
              <div><h2 className="text-2xl font-black">Configuration</h2><p className="text-sm text-white/40">All available init options</p></div>
            </div>
            <CodeBlock title="config example" language="python" code={`import neuralops\n\nneuralops.init(\n    api_key="YOUR_NEURALOPS_API_KEY",   # Required\n    environment="production",            # Required\n    service_name="order-service",        # Required\n\n    # Optional\n    release="v2.3.1",                    # Tag your deploy\n    server_url="https://api.neuralops.dev",\n    sample_rate=1.0,                     # 0.0 to 1.0 — fraction of errors captured\n    traces_sample_rate=0.2,              # 0.0 to 1.0 — fraction of traces captured\n    debug=False,                         # Set True to print SDK logs to console\n    attach_stacktrace=True,              # Attach stack traces to all events\n    max_breadcrumbs=100,                 # Max breadcrumbs per event\n)`} />
            <p className="text-white/60 mt-6 mb-4">Or use environment variables:</p>
            <CodeBlock title=".env" language="bash" code={`NEURALOPS_API_KEY=your_api_key_here\nNEURALOPS_ENVIRONMENT=production\nNEURALOPS_SERVICE_NAME=my-service`} />
          </section>

          {/* CAPTURING ERRORS */}
          <section id="capture" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div><h2 className="text-2xl font-black">Capturing Errors</h2><p className="text-sm text-white/40">Automatic and manual error capture</p></div>
            </div>
            <p className="text-white/60 mb-4">The SDK automatically captures unhandled exceptions. For manual capture:</p>
            <CodeBlock title="error_capture.py" language="python" code={`import neuralops\n\n# Capture an exception manually\ntry:\n    result = 10 / 0\nexcept ZeroDivisionError as e:\n    neuralops.capture_exception(e)\n\n# Capture with extra context\ntry:\n    process_order(order_id=42)\nexcept Exception as e:\n    neuralops.capture_exception(e, extra={\n        "order_id": 42,\n        "user_id": 101,\n        "endpoint": "/api/orders",\n    })\n\n# Send a custom message/event\nneuralops.capture_message(\n    "Payment gateway timed out",\n    level="warning",   # debug | info | warning | error | critical\n    extra={"gateway": "stripe", "timeout_ms": 5000}\n)`} />
          </section>

          {/* LOG INGESTION */}
          <section id="logging" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <Activity size={18} className="text-cyan-400" />
              </div>
              <div><h2 className="text-2xl font-black">Log Ingestion</h2><p className="text-sm text-white/40">Stream logs directly to NeuralOps</p></div>
            </div>
            <p className="text-white/60 mb-4">Attach NeuralOps as a Python logging handler:</p>
            <CodeBlock title="logging_setup.py" language="python" code={`import logging\nimport neuralops\nfrom neuralops.integrations.logging import NeuralOpsHandler\n\nneuralops.init(api_key="YOUR_KEY", environment="production", service_name="api")\n\nlogger = logging.getLogger(__name__)\nlogger.addHandler(NeuralOpsHandler())\nlogger.setLevel(logging.INFO)\n\n# All logs now stream to your NeuralOps dashboard in real-time\nlogger.info("Server started on port 8000")\nlogger.warning("Memory usage above 80%")\nlogger.error("Database connection pool exhausted")`} />
            <p className="text-white/60 mt-6 mb-4">Or send structured logs directly:</p>
            <CodeBlock title="structured_log.py" language="python" code={`import neuralops\n\nneuralops.log(\n    message="User checkout completed",\n    level="info",\n    data={\n        "user_id": "u_9182",\n        "order_id": "ord_4423",\n        "amount": 2499,\n        "currency": "INR",\n    }\n)`} />
          </section>

          {/* FRAMEWORK GUIDES */}
          <section id="frameworks" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <Layers size={18} className="text-violet-400" />
              </div>
              <div><h2 className="text-2xl font-black">Framework Guides</h2><p className="text-sm text-white/40">Drop-in integrations for popular frameworks</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {["django","fastapi","flask","celery"].map(f => (
                <div key={f} className="p-4 rounded-xl border flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <Terminal size={16} className="text-white/40" />
                  <code className="text-sm text-white/70">from neuralops.integrations.{f} import *</code>
                </div>
              ))}
            </div>
            <p className="text-white/60 mb-4">Django — add to <code className="text-violet-400 text-sm bg-violet-400/10 px-1.5 py-0.5 rounded">settings.py</code>:</p>
            <CodeBlock title="settings.py" language="python" code={`import neuralops\n\nneuralops.init(\n    api_key="YOUR_KEY",\n    environment="production",\n    service_name="django-app",\n    integrations=["neuralops.integrations.django"],\n)\n\n# NeuralOps now automatically captures:\n# - Unhandled exceptions with full request context\n# - Slow database queries (> 500ms)\n# - 5xx HTTP responses`} />
            <p className="text-white/60 mt-6 mb-4">FastAPI — one-line middleware:</p>
            <CodeBlock title="main.py" language="python" code={`from fastapi import FastAPI\nfrom neuralops.integrations.fastapi import NeuralOpsMiddleware\nimport neuralops\n\nneuralops.init(api_key="YOUR_KEY", environment="production", service_name="fastapi-app")\n\napp = FastAPI()\napp.add_middleware(NeuralOpsMiddleware)  # captures all errors + traces\n\n@app.get("/orders/{order_id}")\nasync def get_order(order_id: int):\n    return {"order_id": order_id}`} />
          </section>

          {/* API REFERENCE */}
          <section id="reference" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <BookOpen size={18} className="text-blue-400" />
              </div>
              <div><h2 className="text-2xl font-black">API Reference</h2><p className="text-sm text-white/40">Core functions</p></div>
            </div>
            <div className="space-y-6">
              {[
                { fn: "neuralops.init(**kwargs)", desc: "Initializes the SDK. Must be called before any other function.", params: [
                  { name: "api_key", type: "str", req: true, desc: "Your NeuralOps API key." },
                  { name: "environment", type: "str", req: true, desc: "Deployment environment." },
                  { name: "service_name", type: "str", req: true, desc: "Name of this service." },
                  { name: "release", type: "str", req: false, desc: "Current release version tag." },
                  { name: "sample_rate", type: "float", req: false, desc: "Error capture rate (0.0-1.0)." },
                ]},
                { fn: "neuralops.capture_exception(exc, extra=None)", desc: "Manually capture and send an exception.", params: [
                  { name: "exc", type: "Exception", req: true, desc: "The exception to capture." },
                  { name: "extra", type: "dict", req: false, desc: "Additional context to attach." },
                ]},
                { fn: "neuralops.capture_message(msg, level=\"info\", extra=None)", desc: "Send a custom message/event.", params: [
                  { name: "msg", type: "str", req: true, desc: "The message text." },
                  { name: "level", type: "str", req: false, desc: "debug | info | warning | error | critical." },
                  { name: "extra", type: "dict", req: false, desc: "Additional context." },
                ]},
                { fn: "neuralops.log(message, level=\"info\", data=None)", desc: "Stream a structured log entry.", params: [
                  { name: "message", type: "str", req: true, desc: "Log message." },
                  { name: "level", type: "str", req: false, desc: "Log level." },
                  { name: "data", type: "dict", req: false, desc: "Structured metadata." },
                ]},
              ].map(item => (
                <div key={item.fn} className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <code className="text-sm font-mono text-cyan-400">{item.fn}</code>
                    <p className="text-sm text-white/50 mt-2">{item.desc}</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
                      {["Parameter","Type","Required","Description"].map(h => (
                        <th key={h} className="px-5 py-2 text-left text-[10px] font-bold text-white/30 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {item.params.map(p => (
                        <tr key={p.name} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                          <td className="px-5 py-3 font-mono text-violet-400 text-xs">{p.name}</td>
                          <td className="px-5 py-3 font-mono text-amber-400/80 text-xs">{p.type}</td>
                          <td className="px-5 py-3">
                            {p.req
                              ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400">Required</span>
                              : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/30">Optional</span>}
                          </td>
                          <td className="px-5 py-3 text-white/50 text-xs">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl p-10 border text-center" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.08),rgba(6,182,212,0.08))", borderColor: "rgba(59,130,246,0.2)" }}>
            <h2 className="text-3xl font-black mb-3">Ready to ship with confidence?</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">Create your free NeuralOps account, grab your API key, and get started in minutes.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)", boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
                Create Free Account <ArrowRight size={16} />
              </Link>
              <a href="https://pypi.org/project/neuralops-sdk/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all">
                <Package size={16} /> View on PyPI <ExternalLink size={14} />
              </a>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
