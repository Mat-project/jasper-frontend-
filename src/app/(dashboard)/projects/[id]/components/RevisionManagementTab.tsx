'use client';
import React, { useState, useEffect } from 'react';
import { RevisionTimeline } from './RevisionTimeline';
import { ComparisonView } from './ComparisonView';
import { getRegisters, getVersionComparison } from '@/lib/api/register_ai';
import { Loader2 } from 'lucide-react';
import ActiveSubmissionBanner from './ActiveSubmissionBanner';

export default function RevisionManagementTab({ projectId }: { projectId: string }) {
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    async function loadVersions() {
      try {
        const regs = await getRegisters(projectId);
        // Map Register object to what RevisionTimeline expects
        const formattedVersions = regs.map(r => ({
          versionNumber: r.version_number,
          status: r.status,
          generatedAt: r.generated_at,
          createdBy: r.created_by?.first_name || 'System'
        })).sort((a, b) => a.versionNumber - b.versionNumber);
        
        setVersions(formattedVersions);
        if (formattedVersions.length > 0) {
          setActiveVersion(formattedVersions[formattedVersions.length - 1].versionNumber);
        }
      } catch (e) {
        console.error("Failed to load versions", e);
      } finally {
        setLoading(false);
      }
    }
    loadVersions();
  }, [projectId]);

  useEffect(() => {
    async function loadComparison() {
      if (!activeVersion || activeVersion === 1) return;
      setComparing(true);
      try {
        const rawData = await getVersionComparison(projectId, activeVersion - 1, activeVersion);
        const items = rawData.items || [];
        const added = items.filter((item: any) => item.change_type === 'Added').map((item: any) => item.drawing_number);
        const removed = items.filter((item: any) => item.change_type === 'Removed').map((item: any) => item.drawing_number);
        const modified = items
          .filter((item: any) => item.change_type === 'Modified' || item.change_type === 'RevUpdated')
          .map((item: any) => {
            const details = item.details || {};
            return {
              drawingNumber: item.drawing_number,
              oldWeight: details.oldWeight,
              newWeight: details.newWeight,
              oldRev: details.oldRev,
              newRev: details.newRev
            };
          });
        setComparisonData({ added, removed, modified });
      } catch (e) {
        console.error("Failed to load comparison", e);
        setComparisonData({ added: [], removed: [], modified: [] });
      } finally {
        setComparing(false);
      }
    }
    loadComparison();
  }, [projectId, activeVersion]);

  if (loading) {
    return (
      <div className="flex h-[800px] bg-white p-6 rounded-xl border border-gray-200 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex h-[800px] bg-white p-6 rounded-xl border border-gray-200 items-center justify-center text-slate-500">
        No registers generated yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ActiveSubmissionBanner />
      <div className="flex flex-col md:flex-row gap-6 h-[800px] bg-white p-6 rounded-xl border border-gray-200 shadow-sm">

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
    </div>
  );
}
