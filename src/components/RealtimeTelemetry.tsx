import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BrutalCard } from './BrutalCard';
import { BrutalButton } from './BrutalButton';
import { Badge } from './Badge';
import {
  Activity,
  Cpu,
  Database,
  Radio,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  ListChecks,
  Users,
} from 'lucide-react';

export const RealtimeTelemetry: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getRealtimeMetrics();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch realtime telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!autoPoll) return;
    const interval = setInterval(fetchMetrics, 4000);
    return () => clearInterval(interval);
  }, [autoPoll]);

  if (!data) {
    return (
      <div className="p-4 bg-white border-2 border-[#0F172A] text-xs font-mono font-bold flex items-center justify-between shadow-[2px_2px_0px_#0F172A]">
        <span className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          CONNECTING_LIVE_TELEMETRY...
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] font-mono flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-extrabold uppercase">LIVE_STREAM</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-600 font-bold border-l-2 border-slate-200 pl-3">
            <Cpu className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>PING:</span>
            <span className="font-extrabold text-[#0F172A]">
              {data.groq?.status === 'ONLINE' && data.groq?.latency_ms !== null ? `${data.groq.latency_ms}ms` : 'OFFLINE'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-600 font-bold border-l-2 border-slate-200 pl-3">
            <Database className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>VECTORS:</span>
            <span className="font-extrabold text-indigo-700">
              {data.vector_store?.total_chunks !== undefined ? `${data.vector_store.total_chunks} CHUNKS` : '0 CHUNKS'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-bold border-l-2 border-slate-200 pl-3">
            <span>AVG SCORE:</span>
            <span className="font-extrabold text-emerald-700">{data.tests?.average_score ?? 0}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 hidden lg:inline">
            SYNCED {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-1 px-2 border border-[#0F172A] bg-[#FEFCE8] text-[#0F172A] font-extrabold text-[11px] shadow-[1px_1px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
            title="Refresh Real-time Data"
          >
            [ ↻ REFRESH ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrutalCard size="large" accent="mint" className="p-6 font-mono space-y-6">
      {/* Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-[#A7F3D0] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              REALTIME_TELEMETRY // LIVE_MONITOR
            </span>
            <Badge variant="mint">AUTO-SYNC (4s)</Badge>
          </div>
          <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
            Live Platform Telemetry & Activity Stream
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Streaming real-time inference latency, vector chunk index states, test evaluation events, and database metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-2.5 py-1 text-xs font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] ${
              autoPoll ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {autoPoll ? '● STREAMING ON' : '○ PAUSED'}
          </button>
          <BrutalButton
            variant="white"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            REFRESH
          </BrutalButton>
        </div>
      </div>

      {/* Real-time KPI Metric Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Groq AI Latency */}
        <div className="p-3.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div className="flex justify-between items-center text-slate-500 font-bold mb-1">
            <span>GROQ INFERENCE</span>
            <Cpu className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F172A] font-sans">
            {data.groq?.status === 'ONLINE' && data.groq?.latency_ms !== null ? (
              <>
                {data.groq.latency_ms} <span className="text-xs font-mono font-bold text-slate-500">ms</span>
              </>
            ) : (
              <span className="text-base text-rose-600 font-bold">OFFLINE</span>
            )}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${data.groq?.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {data.groq?.status === 'ONLINE' ? data.groq.text_model : 'GROQ_AI // OFFLINE'}
          </div>
        </div>

        {/* Vector Store Count */}
        <div className="p-3.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div className="flex justify-between items-center text-slate-500 font-bold mb-1">
            <span>VECTOR INDEX</span>
            <Database className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 font-sans">
            {data.vector_store?.total_chunks !== undefined ? data.vector_store.total_chunks : 0}{' '}
            <span className="text-xs font-mono font-bold text-slate-500">chunks</span>
          </div>
          <div className="text-[10px] text-indigo-700 font-bold mt-1">
            {data.vector_store?.dimensions || 384}-D Normalized L2
          </div>
        </div>

        {/* Question Bank State */}
        <div className="p-3.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div className="flex justify-between items-center text-slate-500 font-bold mb-1">
            <span>QUESTION BANK</span>
            <ListChecks className="w-4 h-4 text-[#0F172A]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F172A] font-sans">
            {data.question_bank?.total_questions ?? 0}
          </div>
          <div className="text-[10px] font-bold text-slate-600 mt-1 flex gap-2">
            <span className="text-amber-800">{data.question_bank?.draft_questions ?? 0} Drafts</span>
            <span>•</span>
            <span className="text-emerald-700">{data.question_bank?.approved_questions ?? 0} Appr</span>
          </div>
        </div>

        {/* Live Test Attempts */}
        <div className="p-3.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div className="flex justify-between items-center text-slate-500 font-bold mb-1">
            <span>LIVE ATTEMPTS</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 font-sans">
            {data.tests?.total_attempts ?? 0}
          </div>
          <div className="text-[10px] font-bold text-emerald-700 mt-1">
            Avg Score: {data.tests?.average_score ?? 0}%
          </div>
        </div>
      </div>

      {/* Real-time Activity Stream Feed */}
      <div>
        <div className="flex justify-between items-center pb-2 border-b-2 border-[#0F172A] mb-3">
          <span className="font-extrabold text-xs uppercase text-[#0F172A] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            LIVE_ACTIVITY_LOG (REAL-TIME EVENTS)
          </span>
          <span className="text-[10px] text-slate-500 font-bold">
            UPTIME: {Math.floor((data.uptime_seconds || 0) / 60)}m {(data.uptime_seconds || 0) % 60}s
          </span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {(!data.activity_logs || data.activity_logs.length === 0) ? (
            <div className="p-4 text-center border-2 border-dashed border-[#0F172A] bg-white text-xs font-bold text-slate-500">
              NO RECORDS FOUND
            </div>
          ) : (
            data.activity_logs.map((act: any, idx: number) => {
              const colorMap: Record<string, string> = {
                AI_CHAT: 'bg-[#C4B5FD] text-[#0F172A]',
                TEST_SUBMIT: 'bg-[#A7F3D0] text-[#0F172A]',
                QUESTION_GEN: 'bg-[#FDE68A] text-[#0F172A]',
                QUESTION_APPROVE: 'bg-[#BAE6FD] text-[#0F172A]',
                BOOK_UPLOAD: 'bg-[#FBCFE8] text-[#0F172A]',
                PRACTICE: 'bg-emerald-100 text-emerald-800',
              };
              const badgeColor = colorMap[act.type] || 'bg-slate-100 text-slate-800';

              return (
                <div
                  key={act.id || idx}
                  className="p-2.5 bg-white border border-[#0F172A] text-xs shadow-[1.5px_1.5px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 text-[9px] font-extrabold uppercase border border-[#0F172A] ${badgeColor}`}>
                      {act.type}
                    </span>
                    <span className="font-bold text-[#0F172A]">{act.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BrutalCard>
  );
};
