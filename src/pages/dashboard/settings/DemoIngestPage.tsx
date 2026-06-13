import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle2, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/axios'
import { useToast } from '@hooks/useProtectedRoute'
import { cn } from '@/utils/cn'

export default function DemoIngestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [incidentId, setIncidentId] = useState<string>(crypto.randomUUID())
  const [serviceName, setServiceName] = useState('payment-service')
  const [environment, setEnvironment] = useState('production')
  const [logs, setLogs] = useState(
    JSON.stringify(
      [
        {
          seq: 1,
          level: 'info',
          message: 'Processing payment for order #12345',
          timestamp: new Date(Date.now() - 5000).toISOString(),
        },
        {
          seq: 2,
          level: 'error',
          message: 'NullPointerException in ChargeService.charge()',
          timestamp: new Date().toISOString(),
          stack_trace:
            'java.lang.NullPointerException\n  at com.example.ChargeService.charge(ChargeService.java:42)\n  at com.example.PaymentController.process(PaymentController.java:18)',
        },
      ],
      null,
      2
    )
  )
  const [result, setResult] = useState<any>(null)

  const handleIngest = async () => {
    try {
      setLoading(true)
      setResult(null)

      let parsedLogs
      try {
        parsedLogs = JSON.parse(logs)
      } catch (err) {
        toast({ type: 'error', title: 'Invalid JSON in context logs' })
        setLoading(false)
        return
      }

      const payload = {
        incident_id: incidentId,
        service_name: serviceName,
        environment,
        context_logs: Array.isArray(parsedLogs) ? parsedLogs : [parsedLogs],
      }

      const response = await apiClient.post('/ingest/logs', payload)
      setResult(response.data)
      toast({ type: 'success', title: 'Logs ingested successfully!' })
      setIncidentId(crypto.randomUUID()) // Reset for the next demo
    } catch (error: any) {
      console.error(error)
      toast({ type: 'error', title: error?.response?.data?.detail || error?.response?.data?.message || 'Failed to ingest logs' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manual Log Ingestion Demo</h1>
        <p className="text-sm text-slate-600">
          Simulate an SDK error payload. This sends a payload to the <code>/api/v1/ingest/logs</code> endpoint, simulating the NeuralOps SDK.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Incident ID (UUID)</label>
            <input
              type="text"
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-neural-500/50"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-slate-700">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-neural-500/50"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-slate-700">Environment</label>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-neural-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Context Logs (JSON Array)</label>
            <textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              rows={12}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-neural-500/50"
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary text-slate-900 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-200 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Simulate Error Event
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Response Output</h2>
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/20">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Accepted (202)</span>
              </div>
              <pre className="text-xs font-mono text-slate-700 bg-white/30 p-3 rounded overflow-auto border border-slate-200">
                {JSON.stringify(result, null, 2)}
              </pre>
              <div className="mt-4 p-3 bg-slate-100 rounded-md border border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed">
                  The logs have been compressed and uploaded to MinIO/S3 at <code>{result.s3_path}</code>. 
                  An outbox event has been created for Debezium to pick up and forward to Kafka.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <AlertCircle size={24} />
              <p className="text-sm">No requests sent yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
