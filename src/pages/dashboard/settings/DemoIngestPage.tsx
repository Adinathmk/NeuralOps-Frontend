import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle2, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/axios'
import { useToast } from '@hooks/useProtectedRoute'
import { cn } from '@/utils/cn'

export default function DemoIngestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const [payloadStr, setPayloadStr] = useState(
    JSON.stringify(
      {
        "incident_id": "4b9f1d8e-9c7a-4b6d-a123-f9e8d7c6b5a4",
        "service_name": "fastapi-testbed",
        "environment": "development",
        "severity": "error",
        "error_type": "ZeroDivisionError",
        "file_path": "/app/services/payment.py",
        "line_number": 42,
        "trigger": {
          "level": "error",
          "message": "Payment processing failed!",
          "timestamp": "2026-06-26T10:55:00.000Z",
          "stack_trace": {
            "exception_type": "ZeroDivisionError",
            "exception_message": "division by zero",
            "frames": [
              {
                "file": "/app/main.py",
                "line": 15,
                "function": "checkout_endpoint",
                "code_context": "    return process_payment(order_id)"
              },
              {
                "file": "/app/services/payment.py",
                "line": 42,
                "function": "process_payment",
                "code_context": "    tax_rate = amount / 0"
              }
            ]
          }
        },
        "context_logs": [
          {
            "level": "info",
            "message": "Received checkout request for order_id=9921",
            "timestamp": "2026-06-26T10:54:58.123Z",
            "logger": "app.main",
            "module": "main",
            "function": "checkout_endpoint",
            "line": 12,
            "file": "/app/main.py"
          },
          {
            "level": "info",
            "message": "Initiating payment gateway connection...",
            "timestamp": "2026-06-26T10:54:59.456Z",
            "logger": "app.services.payment",
            "module": "payment",
            "function": "process_payment",
            "line": 39,
            "file": "/app/services/payment.py"
          }
        ],
        "sdk_meta": {
          "sdk_version": "1.0.0",
          "python_version": "3.12.1",
          "hostname": "testbed-worker-node-1",
          "framework": "fastapi"
        }
      },
      null,
      2
    )
  )

  const handleIngest = async () => {
    try {
      setLoading(true)
      setResult(null)

      let parsedPayload
      try {
        parsedPayload = JSON.parse(payloadStr)
      } catch (err) {
        toast({ type: 'error', title: 'Invalid JSON payload' })
        setLoading(false)
        return
      }

      const response = await apiClient.post('/ingest/logs', parsedPayload)
      setResult(response.data)
      toast({ type: 'success', title: 'Logs ingested successfully!' })
      
      // Auto-update incident ID in the textbox to make repeated testing easy
      parsedPayload.incident_id = crypto.randomUUID()
      setPayloadStr(JSON.stringify(parsedPayload, null, 2))
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
          Simulate an SDK error payload. This sends a payload to the <code>/api/v1/ingest/logs</code> endpoint, simulating exactly what the NeuralOps SDK sends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Raw Payload (JSON)</label>
            <textarea
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              rows={24}
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
