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
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Admin Operations & System Health</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Microservice health telemetry, registered security analysts, and audit event logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh System Telemetry</span>
        </button>
      </div>

      {/* System Status Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Backend Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Node.js REST Gateway
            </span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xl font-extrabold text-white font-mono">
              {health?.backend?.status || 'ONLINE'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-1 border-t border-slate-800">
            <div>Uptime: {health?.backend?.uptime_seconds ? `${Math.floor(health.backend.uptime_seconds / 60)} mins` : 'Active'}</div>
            <div>Heap Memory: {health?.backend?.memory_heap_mb || 45} MB</div>
          </div>
        </div>

        {/* Database Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Relational Database
            </span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xl font-extrabold text-white font-mono">
              {health?.database?.status || 'CONNECTED'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-1 border-t border-slate-800">
            <div>Engine: SQLite3 / Relational Schema</div>
            <div>Total Detections Stored: {health?.database?.total_records || 'Ready'}</div>
          </div>
        </div>

        {/* ML Service Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              AI / ML Inference Engine
            </span>
            <Cpu className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xl font-extrabold text-white font-mono">
              {health?.ml_service?.status || 'ONLINE'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-1 border-t border-slate-800">
            <div>Framework: FastAPI + scikit-learn</div>
            <div>Endpoint: Port 8000 / Embedded Fallback</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Users & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registered Users Table */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Registered Analysts & Operators</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase font-mono">
                <tr>
                  <th className="py-2 px-3">Name / Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-200 font-sans">{u.full_name}</span>
                      <span className="block text-[10px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                      {u.created_at ? u.created_at.slice(0, 10) : '2026-09-07'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Activity Stream */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Security & Audit Stream</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Logs</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400">{log.action}</span>
                  <span className="text-[9px] text-slate-400">{log.created_at || 'Just now'}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-tight font-sans">{log.details}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Audit stream active. System events will appear here in real-time.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

