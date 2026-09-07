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
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';
import { EmptyState } from '../components/ui/EmptyState';

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
    <div className="page-shell space-y-6">
      <PageHeader
        sheet="DWG 05"
        title="Thermal Anomaly Detection Registry"
        description="Searchable satellite archive with spatial proximity and AI classification history."
        actions={
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="h-3.5 w-3.5" />
            Export CSV archive
          </button>
        }
      />

      {/* Search & Filter Controls */}
      <Sheet className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search facility name, ID, category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input pl-9"
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
            className="select"
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
            className="select"
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
            className="select"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_ALARM">FALSE_ALARM</option>
          </select>
        </div>
      </Sheet>

      {/* Data Table */}
      <Sheet className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[68rem]">
            <thead>
              <tr>
                <th
                  onClick={() => {
                    setSortBy('created_at');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="th-sortable"
                >
                  <div className="flex items-center gap-1">
                    <span>Observation ID / Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th>Coordinates</th>
                <th
                  onClick={() => {
                    setSortBy('frp');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="th-sortable"
                >
                  <div className="flex items-center gap-1">
                    <span>FRP (MW)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th>Classification</th>
                <th>Nearest Facility</th>
                <th
                  onClick={() => {
                    setSortBy('risk_score');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="th-sortable"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="block font-mono text-[11px] font-bold text-ink">{d.id}</span>
                    <span className="block font-mono text-[10px] text-ink-muted">
                      {d.acq_date || '—'} ({d.satellite})
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-ink-soft">
                    {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
                  </td>
                  <td className="font-mono text-[11px]">
                    <span className="font-bold text-ink">{d.frp} MW</span>
                    <span className="block text-ink-muted">{d.brightness} K</span>
                  </td>
                  <td>
                    <RiskBadge classification={d.classification} />
                  </td>
                  <td className="text-xs text-ink-soft">
                    {d.nearest_facility_name ? (
                      <>
                        <span className="block font-semibold text-ink">{d.nearest_facility_name}</span>
                        <span className="block font-mono text-[10px] text-ink-muted">
                          DIST: {d.nearest_facility_dist_km ?? '—'} KM
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-ink-faint">Remote biome</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        d.risk_score >= 80 ? 'tag-danger' : d.risk_score >= 60 ? 'tag-warn' : 'tag-ok'
                      }
                    >
                      {d.risk_score}/100
                    </span>
                  </td>
                  <td>
                    <span className="tag-ink">{d.status}</span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => onSelectDetection(d)} className="btn-secondary btn-sm ml-auto">
                      <Eye className="h-3 w-3" />
                      Report
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Search className="h-5 w-5" />}
                      title="No matching detections"
                      hint="No thermal anomaly matches the current search filters."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink bg-paper-sunk px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          <div>
            Showing <span className="font-bold text-ink">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>–
            <span className="font-bold text-ink">
              {Math.min(currentPage * itemsPerPage, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-ink">{filtered.length}</span> detections
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-icon h-7 w-7"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-bold text-ink">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-icon h-7 w-7"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Sheet>

      <TitleBlock sheetNo="05" view="Detection registry" />
    </div>
  );
};

