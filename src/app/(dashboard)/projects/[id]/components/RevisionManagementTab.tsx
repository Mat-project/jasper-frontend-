'use client';
import React, { useState } from 'react';
import { RevisionTimeline } from './RevisionTimeline';
import { ComparisonView } from './ComparisonView';

const mockVersions = [
  { versionNumber: 1, status: 'Sent', generatedAt: '2026-07-28T10:00:00Z', createdBy: 'Mathan K.' },
  { versionNumber: 2, status: 'Active', generatedAt: '2026-07-30T14:30:00Z', createdBy: 'Abhisek M.' },
];

const mockComparisonData = {
  added: ['ST-401', 'ST-402', 'BM-310'],
  removed: ['ST-009'],
  modified: [
    { drawingNumber: 'ST-101', oldRev: 'A', newRev: 'B' },
    { drawingNumber: 'ST-205', oldRev: 'B', newRev: 'C', oldWeight: 2100, newWeight: 2340 },
  ]
};

export default function RevisionManagementTab({ projectId }: { projectId: string }) {
  const [activeVersion, setActiveVersion] = useState(2);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[800px] bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      
      {/* Sidebar: Timeline */}
      <aside className="w-full md:w-80 flex flex-col gap-4 border-r border-gray-100 pr-6">
        <RevisionTimeline 
          versions={mockVersions} 
          activeVersion={activeVersion}
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
        ) : (
          <ComparisonView 
            data={mockComparisonData} 
            vFrom={activeVersion - 1} 
            vTo={activeVersion} 
          />
        )}
      </main>

    </div>
  );
}
