'use client';
import React, { useState, useEffect } from 'react';
import { RevisionTimeline } from './RevisionTimeline';
import { ComparisonView } from './ComparisonView';
import { getRegisters, getVersionComparison } from '@/lib/api/register_ai';
import apiClient from '@/lib/api/client';
import {
  Loader2,
  FileArchive,
  Mail,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import ActiveSubmissionBanner from './ActiveSubmissionBanner';

interface SubmissionItem {
  id: string;
  submission_no: string;
  original_filename: string;
  heading?: string | null;
  mail_number?: string | null;
  lifecycle_status?: string | null;
  created_at: string;
}

export default function RevisionManagementTab({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'comparison'>('submissions');
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [regs, subsRes] = await Promise.all([
          getRegisters(projectId),
          apiClient.get(`/api/v1/projects/${projectId}/submissions/`),
        ]);

        const formattedVersions = (regs || [])
          .map((r: any) => ({
            versionNumber: r.version_number,
            status: r.status,
            generatedAt: r.generated_at,
            createdBy: r.created_by?.first_name || 'System',
          }))
          .sort((a: any, b: any) => a.versionNumber - b.versionNumber);

        setVersions(formattedVersions);
        if (formattedVersions.length > 0) {
          setActiveVersion(formattedVersions[formattedVersions.length - 1].versionNumber);
        }

        let subsData = subsRes.data;
        if (subsData && typeof subsData === 'object' && 'results' in subsData) {
          subsData = subsData.results;
        }
        const sortedSubs = (Array.isArray(subsData) ? subsData : []).sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setSubmissions(sortedSubs);
      } catch (e) {
        console.error('Failed to load revision and submission data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  useEffect(() => {
    async function loadComparison() {
      if (!activeVersion || activeVersion === 1) return;
      setComparing(true);
      try {
        const rawData = await getVersionComparison(projectId, activeVersion - 1, activeVersion);
        const items = rawData.items || [];
        const added = items
          .filter((item: any) => item.change_type === 'Added')
          .map((item: any) => item.drawing_number);
        const removed = items
          .filter((item: any) => item.change_type === 'Removed')
          .map((item: any) => item.drawing_number);
        const modified = items
          .filter(
            (item: any) =>
              item.change_type === 'Modified' || item.change_type === 'RevUpdated'
          )
          .map((item: any) => {
            const details = item.details || {};
            return {
              drawingNumber: item.drawing_number,
              oldWeight: details.oldWeight,
              newWeight: details.newWeight,
              oldRev: details.oldRev,
              newRev: details.newRev,
            };
          });
        const unchanged = items
          .filter((item: any) => item.change_type === 'Unchanged')
          .map((item: any) => item.drawing_number);
        setComparisonData({ added, removed, modified, unchanged });
      } catch (e) {
        console.error('Failed to load comparison', e);
        setComparisonData({ added: [], removed: [], modified: [] });
      } finally {
        setComparing(false);
      }
    }
    loadComparison();
  }, [projectId, activeVersion]);

  if (loading) {
    return (
      <div className="flex h-[600px] bg-white p-6 rounded-xl border border-gray-200 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ActiveSubmissionBanner />

      {/* View Switcher Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            Submissions &amp; Transmittal History ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Technical Version Comparison (v{activeVersion || 1})
          </button>
        </div>

        <p className="text-xs text-slate-400">
          {activeTab === 'submissions'
            ? 'Track package batches and dispatch statuses.'
            : 'Compare changes between consecutive register releases.'}
        </p>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'submissions' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Project Submissions &amp; Dispatch Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every uploaded batch with its corresponding transmittal mail reference and status.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              Total Batches: {submissions.length}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileArchive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No submissions found for this project.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Submission</th>
                    <th className="px-4 py-3">Package / Filename</th>
                    <th className="px-4 py-3">Heading</th>
                    <th className="px-4 py-3">Uploaded Date</th>
                    <th className="px-4 py-3">Transmittal Status</th>
                    <th className="px-4 py-3 text-right">Mail Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub, idx) => {
                    const isSent = Boolean(sub.mail_number);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">
                          {sub.submission_no || `SUB-${String(idx + 1).padStart(2, '0')}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 max-w-[240px] truncate" title={sub.original_filename}>
                          {sub.original_filename}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={sub.heading || '—'}>
                          {sub.heading || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3.5 h-3.5" /> Ready to Send
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                          {sub.mail_number ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                              {sub.mail_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 h-[750px] bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {/* Sidebar: Timeline */}
          <aside className="w-full md:w-80 flex flex-col gap-4 border-r border-gray-100 pr-6">
            <RevisionTimeline
              versions={versions}
              activeVersion={activeVersion || 1}
              onSelect={setActiveVersion}
            />
          </aside>

          {/* Main Content: Comparison */}
          <main className="flex-1 overflow-y-auto pl-2">
            {activeVersion === 1 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Version 1 (Initial Release)</h2>
                  <p>No prior version to compare against.</p>
                </div>
              </div>
            ) : comparing ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <ComparisonView
                data={comparisonData || { added: [], removed: [], modified: [] }}
                vFrom={(activeVersion || 2) - 1}
                vTo={activeVersion || 2}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
