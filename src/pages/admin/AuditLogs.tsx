import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLogEntry } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { ShieldCheck, Search, Filter, RefreshCw } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch =
      searchQuery === '' ||
      log.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck className="w-7 h-7" /> Institutional Audit Trail & Security Logs
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Immutable log of high-privilege operations: student transfers, marks entries, teacher allocations, fee collections
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={loadData}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH LOGS
        </BrutalButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID, Target ID, or detail..."
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 bg-white border-2 border-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A] focus:outline-none uppercase"
          >
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span>Security Audit Trail ({filteredLogs.length} events)</span>
          <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
            IMMUTABLE_LOG
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#C4B5FD] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A] w-36">Timestamp</th>
                <th className="p-3 border-r border-[#0F172A]">Action</th>
                <th className="p-3 border-r border-[#0F172A]">Actor / Role</th>
                <th className="p-3 border-r border-[#0F172A]">Target Entity</th>
                <th className="p-3">Event Details & Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 font-mono">
                  <td className="p-3 border-r border-[#0F172A] text-[10px] text-slate-600">
                    {new Date(log.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span
                      className={`text-[10px] px-2 py-0.5 border border-[#0F172A] font-extrabold uppercase ${
                        log.action.includes('CREATE') || log.action.includes('ASSIGN')
                          ? 'bg-[#A7F3D0] text-[#0F172A]'
                          : log.action.includes('TRANSFER')
                          ? 'bg-[#FDE68A] text-[#0F172A]'
                          : log.action.includes('DELETE') || log.action.includes('REVOKE')
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-[#C4B5FD] text-[#0F172A]'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <div className="font-extrabold text-[#0F172A]">{log.user_id || 'SYSTEM'}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{log.user_role || 'admin'}</div>
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span className="px-1.5 py-0.5 bg-slate-100 border border-[#0F172A] text-[10px]">
                      {log.entity_type}: {log.target_id || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-700">
                    {log.details ? (
                      <pre className="text-[10px] bg-slate-50 p-1 border border-slate-300 font-mono whitespace-pre-wrap max-w-md">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditLogs;
