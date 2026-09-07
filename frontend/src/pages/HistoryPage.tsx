import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Detection } from '../types/index';
import { RiskBadge } from '../components/common/RiskBadge';

interface HistoryPageProps {
  detections: Detection[];
  onSelectDetection: (detection: Detection) => void;
  onRefresh: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  detections,
  onSelectDetection,
}) => {
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'created_at' | 'risk_score' | 'frp' | 'brightness'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered and sorted dataset
  const filtered = useMemo(() => {
    return detections.filter((d) => {
      const matchesSearch =
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        (d.nearest_facility_name && d.nearest_facility_name.toLowerCase().includes(search.toLowerCase())) ||
        d.classification.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        classificationFilter === 'ALL' || d.classification === classificationFilter;

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

      let matchesRisk = true;
      if (riskFilter === 'CRITICAL') matchesRisk = d.risk_score >= 80;
      else if (riskFilter === 'ELEVATED') matchesRisk = d.risk_score >= 60 && d.risk_score < 80;
      else if (riskFilter === 'MODERATE') matchesRisk = d.risk_score >= 35 && d.risk_score < 60;
      else if (riskFilter === 'LOW') matchesRisk = d.risk_score < 35;

      return matchesSearch && matchesClass && matchesStatus && matchesRisk;
    }).sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;
      if (typeof valA === 'string') valA = new Date(valA).getTime();
      if (typeof valB === 'string') valB = new Date(valB).getTime();

      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [detections, search, classificationFilter, riskFilter, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Lat', 'Lon', 'Brightness_K', 'FRP_MW', 'Classification', 'Confidence', 'Risk_Score', 'Nearest_Facility', 'Status'];
    const rows = filtered.map((d) => [
      d.id,
      d.acq_date || '2026-09-07',
      d.acq_time || '1200',
      d.lat,
      d.lon,
      d.brightness,
      d.frp,
      d.classification,
      d.confidence_score,
      d.risk_score,
      `"${d.nearest_facility_name || 'N/A'}"`,
      d.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pyroguard_thermal_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Thermal Anomaly Detection Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Searchable satellite archive with spatial proximity and AI classification history.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export CSV Archive</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, ID, category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Classification Filter */}
        <div>
          <select
            value={classificationFilter}
            onChange={(e) => {
              setClassificationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Classifications</option>
            <option value="INDUSTRIAL_ACCIDENTAL_FIRE">Industrial Fire</option>
            <option value="INDUSTRIAL_PERSISTENT">Industrial Flare / Persistent</option>
            <option value="WILDFIRE">Wildfire / Forest</option>
            <option value="AGRICULTURAL_BURNING">Agricultural Stubble</option>
            <option value="MINING_EXTRACTION">Mining Fire</option>
            <option value="OTHER_OR_FALSE_ALARM">False Alarm</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical (80-100)</option>
            <option value="ELEVATED">Elevated (60-79)</option>
            <option value="MODERATE">Moderate (35-59)</option>
            <option value="LOW">Low (&lt;35)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_ALARM">FALSE_ALARM</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => {
                    setSortBy('created_at');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Observation ID / Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Coordinates</th>
                <th
                  onClick={() => {
                    setSortBy('frp');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>FRP (MW)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Nearest Facility</th>
                <th
                  onClick={() => {
                    setSortBy('risk_score');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedItems.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{d.id}</span>
                    <span className="text-[10px] text-slate-400">
                      {d.acq_date || '2026-09-07'} ({d.satellite})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-amber-400 font-bold text-sm">{d.frp} MW</span>
                    <span className="block text-[10px] text-slate-400">{d.brightness} K</span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <RiskBadge classification={d.classification} />
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300">
                    {d.nearest_facility_name ? (
                      <div>
                        <span className="font-medium text-slate-200">{d.nearest_facility_name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Dist: {d.nearest_facility_dist_km ?? '0.2'} km
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Remote Biome</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        d.risk_score >= 80
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : d.risk_score >= 60
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {d.risk_score}/100
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectDetection(d)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold transition flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No thermal anomaly detections match the current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-900/60 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">
              {Math.min(currentPage * itemsPerPage, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-white">{filtered.length}</span> detections
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

