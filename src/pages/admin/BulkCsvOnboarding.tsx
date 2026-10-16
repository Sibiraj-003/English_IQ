import React, { useState } from 'react';
import { api } from '../../services/api';
import { CsvImportResult } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

const CSV_TEMPLATES: Record<string, string> = {
  teacher: `Teacher ID,Name,Email,Phone,Subject,Class,Section,Role
TCH2001,Dr. Ananya Roy,ananya.roy@school.org,+91-9876543210,English,CLS001,SEC-1A,teacher
TCH2002,Vikram Mehra,vikram.mehra@school.org,+91-9876543211,Mathematics,CLS001,SEC-1A,teacher
TCH2003,Deepa Nair,deepa.nair@school.org,+91-9876543212,Science,CLS002,SEC-2A,teacher`,

  student: `Student ID,Name,Email,Parent Name,Parent Phone,Class,Section
STU20001,Kavya Sundaram,kavya.s@student.org,Sundaram V,+91-9123456780,CLS001,SEC-1A
STU20002,Arjun Menon,arjun.m@student.org,Menon K,+91-9123456781,CLS001,SEC-1A
STU20003,Ishita Sen,ishita.sen@student.org,Sen R,+91-9123456782,CLS002,SEC-2A`,

  parent: `Parent ID,Name,Email,Phone,Student ID
PAR2001,Sundaram V,sundaram.v@parents.org,+91-9123456780,STU20001
PAR2002,Menon K,menon.k@parents.org,+91-9123456781,STU20002`,

  teacher_assignment: `Teacher ID,Class,Section,Subject
TCH1001,CLS001,SEC-1A,SUB-ENG
TCH1002,CLS001,SEC-1A,SUB-MAT
TCH1003,CLS001,SEC-1A,SUB-SCI`,

  student_assignment: `Student ID,Class,Section
STU10001,CLS001,SEC-1A
STU10002,CLS001,SEC-1A
STU10003,CLS001,SEC-1B`,
};

export const BulkCsvOnboarding: React.FC = () => {
  const [importType, setImportType] = useState<'teacher' | 'student' | 'parent' | 'teacher_assignment' | 'student_assignment'>('student');
  const [csvText, setCsvText] = useState(CSV_TEMPLATES['student']);
  const [previewResult, setPreviewResult] = useState<{
    type: string;
    total_rows: number;
    valid_rows: number;
    error_count: number;
    headers: string[];
    rows: any[];
  } | null>(null);
  const [importSummary, setImportSummary] = useState<CsvImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTypeChange = (newType: any) => {
    setImportType(newType);
    setCsvText(CSV_TEMPLATES[newType] || '');
    setPreviewResult(null);
    setImportSummary(null);
    setFeedback(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setPreviewResult(null);
        setImportSummary(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const content = CSV_TEMPLATES[importType];
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${importType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      setFeedback({ type: 'error', message: 'Please provide CSV content or upload a file first.' });
      return;
    }
    try {
      setLoading(true);
      setFeedback(null);
      const res = await api.previewCsv(importType, csvText);
      setPreviewResult(res);
      setImportSummary(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to parse CSV preview' });
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewResult || previewResult.valid_rows === 0) return;
    try {
      setLoading(true);
      const res = await api.importCsv(importType, previewResult.rows);
      setImportSummary(res);
      setFeedback({
        type: 'success',
        message: `Successfully processed CSV import! Imported: ${res.imported_count}, Failed: ${res.failed_count}`,
      });
      setPreviewResult(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to commit CSV import' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7" /> Bulk CSV Onboarding Wizard
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Automated batch ingestion for Teachers, Students, Parents, and Class-Section Assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={handleDownloadTemplate}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            DOWNLOAD TEMPLATE
          </BrutalButton>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 border-2 border-[#0F172A] text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#0F172A] ${
            feedback.type === 'success' ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-rose-100 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-extrabold uppercase text-[10px]">
            [DISMISS]
          </button>
        </div>
      )}

      {/* CSV Category Picker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-slate-200">
        <span className="text-xs font-extrabold text-[#0F172A] uppercase mr-1">Dataset:</span>
        {(['student', 'teacher', 'parent', 'teacher_assignment', 'student_assignment'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`px-3 py-1.5 border-2 border-[#0F172A] text-xs font-extrabold uppercase whitespace-nowrap transition-all ${
              importType === t
                ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_#FDE68A]'
                : 'bg-white text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BrutalCard size="medium" accent="yellow" className="p-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-3">
              <span className="font-black text-xs text-[#0F172A] uppercase">
                CSV Input // {importType.toUpperCase().replace(/_/g, ' ')}
              </span>
              <label className="cursor-pointer text-[10px] font-extrabold px-2 py-1 bg-white hover:bg-slate-50 border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] flex items-center gap-1">
                <Upload className="w-3 h-3" /> UPLOAD .CSV FILE
                <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={9}
              className="w-full p-3 font-mono text-xs bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none focus:bg-[#FEFCE8]"
              placeholder="Paste comma-separated values here..."
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold">
                Lines: {csvText.split('\n').filter(Boolean).length} rows
              </span>
              <div className="flex gap-2">
                <BrutalButton
                  variant="neutral"
                  size="small"
                  onClick={() => setCsvText('')}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  CLEAR
                </BrutalButton>
                <BrutalButton
                  variant="primary"
                  size="small"
                  onClick={handlePreview}
                  disabled={loading}
                  icon={<Play className="w-3.5 h-3.5" />}
                >
                  {loading ? 'VALIDATING...' : 'PREVIEW & VALIDATE'}
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        </div>

        {/* Validation Rules & Instructions */}
        <div>
          <BrutalCard size="medium" accent="lavender" className="p-4 space-y-3">
            <h4 className="font-black text-xs text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A]">
              12-Step Ingestion Pipeline
            </h4>
            <ul className="text-[11px] text-slate-700 font-bold space-y-1.5 list-disc list-inside">
              <li>Header validation & column alignment</li>
              <li>Row-by-row syntax & type verification</li>
              <li>Unique ID & duplicate email detection</li>
              <li>Validates Class and Section identifiers</li>
              <li>Validates Subject codes and teachers</li>
              <li>Pre-import validation table preview</li>
              <li>Atomic provisioning of user profiles</li>
              <li>Auto-links Class & Section allocations</li>
              <li>Detailed error report with row numbers</li>
            </ul>
          </BrutalCard>
        </div>
      </div>

      {/* Preview Table */}
      {previewResult && (
        <div className="space-y-4">
          <BrutalCard size="small" accent="mint" className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-[#0F172A] uppercase">Validation Preview</h3>
                <div className="text-xs text-slate-700 font-bold mt-0.5 flex gap-4">
                  <span>Total Rows: {previewResult.total_rows}</span>
                  <span className="text-emerald-700">Valid: {previewResult.valid_rows}</span>
                  <span className="text-rose-700">Errors: {previewResult.error_count}</span>
                </div>
              </div>
              <BrutalButton
                variant="primary"
                size="small"
                onClick={handleCommitImport}
                disabled={loading || previewResult.valid_rows === 0}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                {loading ? 'IMPORTING...' : `COMMIT IMPORT (${previewResult.valid_rows} RECORDS)`}
              </BrutalButton>
            </div>
          </BrutalCard>

          <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-[#FEFCE8] border-b-2 border-[#0F172A] sticky top-0 uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-[#0F172A] w-14">Row</th>
                    <th className="p-2 border-r border-[#0F172A] w-24">Status</th>
                    {previewResult.headers.map((h) => (
                      <th key={h} className="p-2 border-r border-[#0F172A]">
                        {h}
                      </th>
                    ))}
                    <th className="p-2">Validation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F172A]">
                  {previewResult.rows.map((r, idx) => (
                    <tr
                      key={idx}
                      className={r.is_valid ? 'hover:bg-slate-50' : 'bg-rose-50 hover:bg-rose-100'}
                    >
                      <td className="p-2 border-r border-[#0F172A] text-slate-500 font-mono">
                        #{r.row_number}
                      </td>
                      <td className="p-2 border-r border-[#0F172A]">
                        {r.is_valid ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A] font-extrabold inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> VALID
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-rose-200 text-rose-900 border border-[#0F172A] font-extrabold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ERROR
                          </span>
                        )}
                      </td>
                      {previewResult.headers.map((h) => (
                        <td key={h} className="p-2 border-r border-[#0F172A] max-w-[150px] truncate">
                          {r.data[h] || '-'}
                        </td>
                      ))}
                      <td className="p-2 text-rose-800 text-[11px]">
                        {r.errors && r.errors.length > 0 ? r.errors.join('; ') : 'Ready for database write'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Execution Summary */}
      {importSummary && (
        <BrutalCard size="medium" accent="yellow" className="p-6">
          <div className="pb-3 border-b-2 border-[#0F172A] mb-4 flex items-center justify-between">
            <span className="font-black text-base text-[#0F172A] uppercase flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Import Execution Complete
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border border-[#0F172A]">
              SUMMARY_LOG
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-white border-2 border-[#0F172A]">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Successfully Imported</div>
              <div className="text-2xl font-black text-emerald-700">{importSummary.imported_count}</div>
            </div>
            <div className="p-3 bg-white border-2 border-[#0F172A]">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Failed Rows</div>
              <div className="text-2xl font-black text-rose-700">{importSummary.failed_count}</div>
            </div>
            <div className="p-3 bg-white border-2 border-[#0F172A]">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Allocations Created</div>
              <div className="text-2xl font-black text-[#0F172A]">
                {importSummary.assignments_created || importSummary.imported_count}
              </div>
            </div>
          </div>

          {importSummary.errors && importSummary.errors.length > 0 && (
            <div className="p-3 bg-rose-50 border-2 border-[#0F172A] space-y-1">
              <div className="text-xs font-black text-rose-900 uppercase">Errors Encountered:</div>
              {importSummary.errors.map((err, i) => (
                <div key={i} className="text-xs text-rose-800">
                  &bull; Row {err.row}: {err.message}
                </div>
              ))}
            </div>
          )}
        </BrutalCard>
      )}
    </div>
  );
};
export default BulkCsvOnboarding;
