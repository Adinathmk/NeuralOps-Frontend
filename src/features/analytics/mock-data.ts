import type {
  HealthMetrics, ErrorRateResponse, Deployment, MttrBucket,
  HeatmapCell, CrashService, AIEfficacyResponse, VolumeBucket,
  TopRegression, ServiceSparklineData
} from '@/types/analytics'

// ── Utilities ─────────────────────────────────────────────────────────────────
function randomBetween(min: number, max: number) {
  return +(Math.random() * (max - min) + min).toFixed(2)
}

function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60 * 1000)
}

function isoStr(date: Date) {
  return date.toISOString()
}

// ── Health Metrics ────────────────────────────────────────────────────────────
export const mockHealthMetrics: HealthMetrics = {
  errorRate:            { value: 4.7,  delta: +1.2, unit: 'errors/min' },
  p99Mttr:              { value: 187,  unit: 'minutes' },
  activeIncidents:      { value: 11,   maxSeverity: 'CRITICAL' },
  crashFreeSessions:    { value: 97.4, unit: '%' },
  noiseRatio:           { value: 91.2, unit: '%' },
  deploymentHealthScore:{ value: 73,   maxScore: 100 },
}

// ── Error Rate ────────────────────────────────────────────────────────────────
const now = new Date()
const buckets: ErrorRateResponse['buckets'] = Array.from({ length: 144 }, (_, i) => {
  const ts = addMinutes(new Date(now.getTime() - 144 * 5 * 60 * 1000), i * 5)
  const spike = (i >= 60 && i <= 70) || (i >= 110 && i <= 118)
  const base = spike ? randomBetween(10, 18) : randomBetween(1.5, 5.5)
  return {
    timestamp: isoStr(ts),
    total_rate: base,
    by_severity: {
      CRITICAL: +(base * 0.08).toFixed(2),
      HIGH:     +(base * 0.22).toFixed(2),
      MEDIUM:   +(base * 0.45).toFixed(2),
      LOW:      +(base * 0.25).toFixed(2),
    },
  }
})

export const mockErrorRate: ErrorRateResponse = {
  buckets,
  baseline_mean: 3.8,
  baseline_stddev: 0.6,
  anomaly_windows: [
    { from: isoStr(addMinutes(now, -420)), to: isoStr(addMinutes(now, -350)), peak_rate: 17.4, z_score: 3.1 },
    { from: isoStr(addMinutes(now, -170)), to: isoStr(addMinutes(now, -130)), peak_rate: 15.8, z_score: 2.7 },
  ],
}

// ── Deployments ───────────────────────────────────────────────────────────────
export const mockDeployments: Deployment[] = [
  { id: 'dep_001', service: 'api-gateway',      version: 'v2.4.1', commit_sha: 'a1b2c3d', deployed_at: isoStr(addMinutes(now, -390)), deployed_by: 'ci-bot',   environment: 'production', error_rate_before: 2.1, error_rate_after: 5.8,  health_delta: -3.7 },
  { id: 'dep_002', service: 'payment-service',  version: 'v1.9.0', commit_sha: 'e4f5g6h', deployed_at: isoStr(addMinutes(now, -200)), deployed_by: 'alice',    environment: 'production', error_rate_before: 4.2, error_rate_after: 3.1,  health_delta: +1.1 },
  { id: 'dep_003', service: 'user-service',     version: 'v3.1.2', commit_sha: 'i7j8k9l', deployed_at: isoStr(addMinutes(now, -90)),  deployed_by: 'ci-bot',   environment: 'production', error_rate_before: 1.8, error_rate_after: 1.9,  health_delta: -0.1 },
]

// ── Service Sparklines ────────────────────────────────────────────────────────
const services = ['api-gateway', 'payment-service', 'user-service', 'worker', 'cache-service', 'ml-pipeline']
export const mockServiceSparklines: ServiceSparklineData[] = services.map((s, idx) => {
  const severities = ['CRITICAL','HIGH','MEDIUM','LOW','LOW','MEDIUM'] as const
  const baseRate = [5.8, 3.2, 1.4, 0.9, 0.3, 2.1][idx]
  return {
    service: s,
    severity: severities[idx],
    current_rate: baseRate + randomBetween(-0.5, 0.5),
    peak_rate: baseRate * 2.5,
    data: Array.from({ length: 24 }, (_, i) => ({
      timestamp: isoStr(addMinutes(now, (i - 24) * 60)),
      rate: Math.max(0, baseRate + Math.sin(i * 0.6) * (baseRate * 0.4) + randomBetween(-0.2, 0.2)),
    })),
  }
})

// ── MTTR Buckets ──────────────────────────────────────────────────────────────
export const mockMttrBuckets: MttrBucket[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(now)
  d.setDate(d.getDate() - (29 - i))
  return {
    period: d.toISOString().split('T')[0],
    p50_minutes: randomBetween(15, 35),
    p90_minutes: randomBetween(55, 90),
    p99_minutes: randomBetween(140, 240),
    sample_size: Math.floor(randomBetween(30, 60)),
  }
})

// ── Incident Heatmap ──────────────────────────────────────────────────────────
export const mockHeatmapCells: HeatmapCell[] = []
for (let d = 0; d < 90; d++) {
  const day = new Date(now)
  day.setDate(day.getDate() - (89 - d))
  const dayStr = day.toISOString().split('T')[0]
  for (let h = 0; h < 24; h++) {
    const isBusinessHours = h >= 9 && h <= 18
    const isWeeeknd = [0,6].includes(day.getDay())
    let wc = 0
    if (!isWeeeknd) {
      wc = isBusinessHours
        ? Math.floor(randomBetween(0, 4))
        : h === 3 ? Math.floor(randomBetween(3, 9))
        : Math.floor(randomBetween(0, 2))
    }
    if (wc > 0) {
      mockHeatmapCells.push({ day: dayStr, hour: h, weighted_count: wc, max_severity: wc > 6 ? 'CRITICAL' : wc > 3 ? 'HIGH' : 'MEDIUM' })
    }
  }
}

// ── Crash Treemap ────────────────────────────────────────────────────────────
export const mockCrashLocations: CrashService[] = [
  {
    service: 'api-gateway', total_incidents: 234,
    files: [
      { path: 'src/handlers/auth.py', total_incidents: 89, functions: [
          { name: 'validate_token', incidents: 72, severity_max: 'CRITICAL' },
          { name: 'refresh_token',  incidents: 17, severity_max: 'HIGH'     },
        ],
      },
      { path: 'src/middleware/rate_limiter.py', total_incidents: 55, functions: [
          { name: 'check_rate',   incidents: 40, severity_max: 'HIGH'   },
          { name: 'reset_bucket', incidents: 15, severity_max: 'MEDIUM' },
        ],
      },
      { path: 'src/routes/proxy.py', total_incidents: 90, functions: [
          { name: 'forward_request', incidents: 90, severity_max: 'CRITICAL' },
        ],
      },
    ],
  },
  {
    service: 'payment-service', total_incidents: 178,
    files: [
      { path: 'src/processors/stripe.py', total_incidents: 102, functions: [
          { name: 'charge_card',   incidents: 84, severity_max: 'CRITICAL' },
          { name: 'create_intent', incidents: 18, severity_max: 'HIGH'     },
        ],
      },
      { path: 'src/ledger/transactions.py', total_incidents: 76, functions: [
          { name: 'record_tx', incidents: 76, severity_max: 'HIGH' },
        ],
      },
    ],
  },
  {
    service: 'user-service', total_incidents: 87,
    files: [
      { path: 'src/models/user.py', total_incidents: 50, functions: [
          { name: 'get_by_email', incidents: 30, severity_max: 'MEDIUM' },
          { name: 'update_profile', incidents: 20, severity_max: 'LOW'  },
        ],
      },
      { path: 'src/cache/redis.py', total_incidents: 37, functions: [
          { name: 'get_session', incidents: 37, severity_max: 'HIGH' },
        ],
      },
    ],
  },
  {
    service: 'worker', total_incidents: 55,
    files: [
      { path: 'src/jobs/email_dispatch.py', total_incidents: 30, functions: [
          { name: 'send_batch', incidents: 30, severity_max: 'MEDIUM' },
        ],
      },
      { path: 'src/jobs/data_sync.py', total_incidents: 25, functions: [
          { name: 'sync_crm', incidents: 25, severity_max: 'LOW' },
        ],
      },
    ],
  },
]

// ── AI Efficacy ───────────────────────────────────────────────────────────────
export const mockAIEfficacy: AIEfficacyResponse = {
  entries: [
    { error_category: 'Auth Failures',    total_incidents: 89,  playbook_applied: 78, resolved_within_sla: 68, avg_confidence: 0.91 },
    { error_category: 'DB Timeouts',      total_incidents: 64,  playbook_applied: 55, resolved_within_sla: 40, avg_confidence: 0.76 },
    { error_category: 'Payment Errors',   total_incidents: 102, playbook_applied: 89, resolved_within_sla: 72, avg_confidence: 0.88 },
    { error_category: 'Memory Leaks',     total_incidents: 27,  playbook_applied: 18, resolved_within_sla: 11, avg_confidence: 0.62 },
    { error_category: 'Network Failures', total_incidents: 45,  playbook_applied: 40, resolved_within_sla: 35, avg_confidence: 0.83 },
    { error_category: 'Config Errors',    total_incidents: 31,  playbook_applied: 28, resolved_within_sla: 26, avg_confidence: 0.95 },
  ],
  confidence_distribution: [
    { range: '0\u20130.5',  count: 12 },
    { range: '0.5\u20130.6', count: 28 },
    { range: '0.6\u20130.7', count: 45 },
    { range: '0.7\u20130.8', count: 89 },
    { range: '0.8\u20130.9', count: 134 },
    { range: '0.9\u20131.0', count: 78 },
  ],
  overall_confidence_mean: 0.82,
}

// ── Volume ────────────────────────────────────────────────────────────────────
export const mockVolumeBuckets: VolumeBucket[] = Array.from({ length: 144 }, (_, i) => {
  const ts = addMinutes(new Date(now.getTime() - 144 * 5 * 60 * 1000), i * 5)
  const rawVol = Math.floor(randomBetween(8000, 25000) + (i >= 60 && i <= 70 ? 50000 : 0))
  const incidentCount = Math.floor(rawVol * 0.0004 + randomBetween(0, 2))
  return { timestamp: isoStr(ts), raw_log_volume: rawVol, incident_count: incidentCount }
})

// ── Top Regressions ───────────────────────────────────────────────────────────
export const mockTopRegressions: TopRegression[] = [
  { id: 'r1', title: 'validate_token: JWT signature verification failed',           service: 'api-gateway',     first_seen: isoStr(addMinutes(now, -1200)), occurrences: 1847, trend: [2,3,5,4,8,12,15,18,14,11,9,7], severity: 'CRITICAL',  status: 'OPEN'        },
  { id: 'r2', title: 'stripe.charge_card: Card declined - insufficient funds',      service: 'payment-service', first_seen: isoStr(addMinutes(now, -800)),  occurrences: 923,  trend: [1,2,2,3,4,4,5,5,6,7,8,9],  severity: 'HIGH',     status: 'IN_PROGRESS' },
  { id: 'r3', title: 'redis.get_session: Connection pool exhausted',                service: 'user-service',    first_seen: isoStr(addMinutes(now, -600)),  occurrences: 541,  trend: [0,1,1,2,2,3,3,4,3,2,2,3],  severity: 'HIGH',     status: 'OPEN'        },
  { id: 'r4', title: 'rate_limiter.check_rate: Bucket key collision',               service: 'api-gateway',     first_seen: isoStr(addMinutes(now, -400)),  occurrences: 287,  trend: [5,4,4,3,3,2,2,1,1,1,0,1],  severity: 'MEDIUM',   status: 'IN_PROGRESS' },
  { id: 'r5', title: 'email_dispatch.send_batch: SMTP timeout after 30s',          service: 'worker',          first_seen: isoStr(addMinutes(now, -300)),  occurrences: 183,  trend: [1,1,2,2,1,1,2,3,2,2,1,1],  severity: 'MEDIUM',   status: 'OPEN'        },
  { id: 'r6', title: 'data_sync.sync_crm: Rate limit exceeded (429)',               service: 'worker',          first_seen: isoStr(addMinutes(now, -200)),  occurrences: 94,   trend: [0,0,1,1,0,1,1,2,1,0,1,0],  severity: 'LOW',      status: 'RESOLVED'    },
  { id: 'r7', title: 'forward_request: Upstream timeout - ml-pipeline unresponsive',service: 'api-gateway',     first_seen: isoStr(addMinutes(now, -150)),  occurrences: 762,  trend: [3,4,6,8,10,12,9,7,5,4,3,2],severity: 'CRITICAL',  status: 'OPEN'        },
  { id: 'r8', title: 'record_tx: Database deadlock on transactions table',           service: 'payment-service', first_seen: isoStr(addMinutes(now, -90)),   occurrences: 441,  trend: [2,3,4,4,3,4,5,4,3,3,2,3],  severity: 'HIGH',     status: 'IN_PROGRESS' },
]
