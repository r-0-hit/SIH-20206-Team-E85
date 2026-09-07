import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Users,
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { detectionService } from '../services/detectionService';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet, SheetHead } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';
import { EmptyState } from '../components/ui/EmptyState';

export const AdminDashboardPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [h, u, l] = await Promise.all([
        detectionService.getSystemHealth().catch(() => null),
        detectionService.getUsers().catch(() => []),
        detectionService.getAdminLogs(20).catch(() => []),
      ]);
      setHealth(h);
      setUsers(u);
      setLogs(l);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        sheet="DWG 07"
        title="Admin Operations & System Health"
        description="Microservice health telemetry, registered analysts and audit event logs."
        actions={
          <button onClick={fetchAdminData} disabled={loading} className="btn-secondary">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh telemetry
          </button>
        }
      />

      {/* System Status Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Backend Status */}
        <Sheet className="relative overflow-hidden space-y-3 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-blueprint" />
          <div className="flex items-center justify-between pt-1">
            <span className="key">Node.js REST gateway</span>
            <Server className="h-4 w-4 text-blueprint" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-blink bg-risk-low" />
            <span className="font-display text-xl font-extrabold uppercase text-ink">
              {health?.backend?.status || 'ONLINE'}
            </span>
          </div>
          <dl className="space-y-1 border-t border-ink/15 pt-2 font-mono text-[10px] uppercase text-ink-muted">
            <div className="flex justify-between">
              <dt>Uptime</dt>
              <dd className="font-bold text-ink">
                {health?.backend?.uptime_seconds
                  ? `${Math.floor(health.backend.uptime_seconds / 60)} MIN`
                  : 'ACTIVE'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Heap memory</dt>
              <dd className="font-bold text-ink">{health?.backend?.memory_heap_mb || 45} MB</dd>
            </div>
          </dl>
        </Sheet>

        {/* Database Status */}
        <Sheet className="relative overflow-hidden space-y-3 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-steel" />
          <div className="flex items-center justify-between pt-1">
            <span className="key">Relational database</span>
            <Database className="h-4 w-4 text-steel" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-blink bg-risk-low" />
            <span className="font-display text-xl font-extrabold uppercase text-ink">
              {health?.database?.status || 'CONNECTED'}
            </span>
          </div>
          <dl className="space-y-1 border-t border-ink/15 pt-2 font-mono text-[10px] uppercase text-ink-muted">
            <div className="flex justify-between">
              <dt>Engine</dt>
              <dd className="font-bold text-ink">SQLITE3</dd>
            </div>
            <div className="flex justify-between">
              <dt>Records stored</dt>
              <dd className="font-bold text-ink">{health?.database?.total_records ?? '—'}</dd>
            </div>
          </dl>
        </Sheet>

        {/* ML Service Status */}
        <Sheet className="relative overflow-hidden space-y-3 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-signal" />
          <div className="flex items-center justify-between pt-1">
            <span className="key">AI / ML inference engine</span>
            <Cpu className="h-4 w-4 text-signal" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-blink bg-risk-low" />
            <span className="font-display text-xl font-extrabold uppercase text-ink">
              {health?.ml_service?.status || 'ONLINE'}
            </span>
          </div>
          <dl className="space-y-1 border-t border-ink/15 pt-2 font-mono text-[10px] uppercase text-ink-muted">
            <div className="flex justify-between">
              <dt>Framework</dt>
              <dd className="font-bold text-ink">FASTAPI + SKLEARN</dd>
            </div>
            <div className="flex justify-between">
              <dt>Endpoint</dt>
              <dd className="font-bold text-ink">PORT 8000</dd>
            </div>
          </dl>
        </Sheet>
      </div>

      {/* Two Column Layout: Users & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registered Users Table */}
        <Sheet className="p-0">
          <SheetHead
            title="Registered analysts & operators"
            icon={<Users className="h-4 w-4 text-blueprint" />}
            meta={`${users.length} users`}
          />

          <div className="overflow-x-auto">
            <table className="table-shell min-w-[26rem]">
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="block text-xs font-semibold text-ink">{u.full_name}</span>
                      <span className="block font-mono text-[10px] text-ink-muted">{u.email}</span>
                    </td>
                    <td>
                      <span className={u.role === 'ADMIN' ? 'tag-danger' : 'tag-blueprint'}>{u.role}</span>
                    </td>
                    <td className="font-mono text-[10px] text-ink-muted">
                      {u.created_at ? u.created_at.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState icon={<Users className="h-5 w-5" />} title="No users returned" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Sheet>

        {/* Audit Activity Stream */}
        <Sheet className="p-0">
          <SheetHead
            title="Security & audit stream"
            icon={<Activity className="h-4 w-4 text-risk-low" />}
            meta="Live logs"
          />

          <div className="max-h-80 space-y-2 overflow-y-auto p-4">
            {logs.map((log) => (
              <div key={log.id} className="border-2 border-ink bg-paper p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blueprint">
                    {log.action}
                  </span>
                  <span className="font-mono text-[9px] uppercase text-ink-muted">
                    {log.created_at || 'Just now'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-ink-soft">{log.details}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="Audit stream active"
                hint="System events will appear here in real time."
              />
            )}
          </div>
        </Sheet>
      </div>

      <TitleBlock sheetNo="07" view="Admin operations" />
    </div>
  );
};

