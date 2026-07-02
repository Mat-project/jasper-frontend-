"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  FileCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkerRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  status: "Present" | "Absent" | "Half-Day" | "On Duty";
  overtime: number;
  remarks: string;
}

const DEPARTMENTS = [
  "Production A",
  "Production B",
  "Fabrication",
  "Machining",
  "Quality Control",
];

const baselineWorkers = (): WorkerRecord[] => [
  {
    id: "worker-1",
    code: "EMP1001",
    name: "John Doe",
    department: "Production A",
    status: "Present",
    overtime: 0,
    remarks: "Baseline shift",
  },
  {
    id: "worker-2",
    code: "EMP1002",
    name: "Jane Smith",
    department: "Fabrication",
    status: "On Duty",
    overtime: 1.5,
    remarks: "Site assignment",
  },
];

// Memoized high-performance row to prevent lag when editing fields
const WorkerRow = React.memo(({
  worker,
  onStatusChange,
  onUpdateField,
}: {
  worker: WorkerRecord;
  onStatusChange: (id: string, status: WorkerRecord["status"]) => void;
  onUpdateField: (id: string, field: keyof WorkerRecord, value: any) => void;
}) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-3 w-40">
        <input
          type="text"
          defaultValue={worker.code}
          onBlur={(e) => onUpdateField(worker.id, "code", e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg font-mono text-xs text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </td>
      <td className="px-6 py-3 w-60">
        <input
          type="text"
          defaultValue={worker.name}
          onBlur={(e) => onUpdateField(worker.id, "name", e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-900 font-bold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </td>
      <td className="px-6 py-3 w-48">
        <select
          defaultValue={worker.department}
          onChange={(e) => onUpdateField(worker.id, "department", e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-400"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </td>
      <td className="px-6 py-3">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            {(["Present", "Absent", "Half-Day", "On Duty"] as const).map((st) => {
              const isActive = worker.status === st;
              const activeStyles = {
                "Present": "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
                "Absent": "bg-red-600 text-white shadow-sm hover:bg-red-700",
                "Half-Day": "bg-purple-600 text-white shadow-sm hover:bg-purple-700",
                "On Duty": "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
              }[st];

              return (
                <button
                  key={st}
                  onClick={() => onStatusChange(worker.id, st)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    isActive
                      ? activeStyles
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </td>
      <td className="px-6 py-3 w-28">
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          defaultValue={worker.overtime || ""}
          onBlur={(e) => onUpdateField(worker.id, "overtime", parseFloat(e.target.value) || 0)}
          placeholder="0.0"
          className="w-20 px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-center font-bold text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </td>
      <td className="px-6 py-3 min-w-[200px]">
        <input
          type="text"
          defaultValue={worker.remarks}
          onBlur={(e) => onUpdateField(worker.id, "remarks", e.target.value)}
          placeholder="Add comment..."
          className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </td>
    </tr>
  );
});

WorkerRow.displayName = "WorkerRow";

export default function BulkAttendancePortal() {
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // Onboarding inputs state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("Production A");

  const itemsPerPage = 50;

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    setWorkers(baselineWorkers());
  }, []);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === "All" || w.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [workers, searchQuery, deptFilter]);

  const showPagination = filteredWorkers.length > 50;
  const totalPages = showPagination ? Math.ceil(filteredWorkers.length / itemsPerPage) : 1;

  const paginatedWorkers = useMemo(() => {
    if (!showPagination) return filteredWorkers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWorkers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWorkers, currentPage, showPagination]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deptFilter]);

  const handleStatusChange = useCallback((id: string, newStatus: WorkerRecord["status"]) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
    );
  }, []);

  const handleUpdateField = useCallback((id: string, field: keyof WorkerRecord, value: any) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  }, []);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setToast({
        message: "Please enter both Worker ID and Worker Name!",
        show: true,
      });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
      return;
    }

    const formattedCode = newCode.trim().toUpperCase();
    if (workers.some((w) => w.code === formattedCode)) {
      setToast({
        message: `Worker ID ${formattedCode} already exists!`,
        show: true,
      });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
      return;
    }

    const newWorker: WorkerRecord = {
      id: `worker-${Date.now()}`,
      code: formattedCode,
      name: newName.trim(),
      department: newDept,
      status: "Present",
      overtime: 0,
      remarks: "",
    };

    setWorkers((prev) => [...prev, newWorker]);
    setNewCode("");
    setNewName("");

    setToast({
      message: `Successfully registered ${newWorker.name}!`,
      show: true,
    });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const handleMarkAllPresent = () => {
    const filteredIds = new Set(filteredWorkers.map((w) => w.id));
    setWorkers((prev) =>
      prev.map((w) => (filteredIds.has(w.id) ? { ...w, status: "Present" } : w))
    );
    
    setToast({
      message: `Marked all ${filteredWorkers.length} filtered workers as Present!`,
      show: true,
    });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const handleSaveSheet = () => {
    console.log("=== SAVING ATTENDANCE SHEET ===");
    console.log("Date:", selectedDate);
    console.log("Total Records:", workers.length);
    console.log("Payload:", workers);
    console.log("================================");

    setToast({
      message: `Saved attendance sheet for ${workers.length} workers successfully!`,
      show: true,
    });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let onDuty = 0;
    let totalOt = 0;

    workers.forEach((w) => {
      if (w.status === "Present") present++;
      else if (w.status === "Absent") absent++;
      else if (w.status === "Half-Day") halfDay++;
      else if (w.status === "On Duty") onDuty++;
      totalOt += w.overtime;
    });

    return { present, absent, halfDay, onDuty, totalOt };
  }, [workers]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <span className="p-1.5 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </span>
              Dynamic Attendance Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Admin dynamic logging portal optimized for infinite scaling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <label htmlFor="log-date" className="sr-only">Select Date</label>
              <input
                id="log-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Worker Onboarding Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 bg-blue-50 rounded-md">
              <UserPlus className="h-4 w-4 text-blue-600" />
            </span>
            <h2 className="text-sm font-bold text-gray-900">Quick Worker Registration</h2>
          </div>
          
          <form onSubmit={handleAddWorker} className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Worker ID</label>
              <input
                type="text"
                placeholder="e.g. EMP2001"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div className="flex-2 w-full space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Worker Name</label>
              <input
                type="text"
                placeholder="e.g. Robert Downey"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Department</label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-semibold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 h-10"
            >
              Add Worker
            </button>
          </form>
        </div>

        {/* Toolbar Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-400 w-full sm:w-44"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredWorkers.length > 0 && (
            <div className="w-full md:w-auto flex justify-end">
              <button
                onClick={handleMarkAllPresent}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <UserCheck className="h-4 w-4" /> Mark All Present ({filteredWorkers.length})
              </button>
            </div>
          )}
        </div>

        {/* High Density Table Block */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Worker Code</th>
                  <th className="px-6 py-4">Worker Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">Roster Status</th>
                  <th className="px-6 py-4">OT Hours</th>
                  <th className="px-6 py-4">Remarks / Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedWorkers.length > 0 ? (
                  paginatedWorkers.map((w) => (
                    <WorkerRow
                      key={w.id}
                      worker={w}
                      onStatusChange={handleStatusChange}
                      onUpdateField={handleUpdateField}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No registered workers match the filters. Add some above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {showPagination && totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">
                Showing <b className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</b> to{" "}
                <b className="text-gray-900">
                  {Math.min(currentPage * itemsPerPage, filteredWorkers.length)}
                </b>{" "}
                of <b className="text-gray-900">{filteredWorkers.length}</b> filtered workers
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-xs font-semibold text-slate-600">
                  Page <b className="text-gray-900">{currentPage}</b> of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 py-4 px-6 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] z-40">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-slate-500 font-medium">Total Registered:</span>
              <strong className="text-gray-900 font-bold">{workers.length}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500 font-medium">Present:</span>
              <strong className="text-gray-900 font-bold">{stats.present}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-500 font-medium">Absent:</span>
              <strong className="text-gray-900 font-bold">{stats.absent}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-slate-500 font-medium">Half-Day:</span>
              <strong className="text-gray-900 font-bold">{stats.halfDay}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-slate-500 font-medium">On Duty:</span>
              <strong className="text-gray-900 font-bold">{stats.onDuty}</strong>
            </div>
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-6">
              <span className="text-slate-500 font-medium">Total OT Hours:</span>
              <strong className="text-gray-900 font-bold font-mono">{stats.totalOt.toFixed(1)} hrs</strong>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button
              onClick={handleSaveSheet}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <FileCheck className="h-4 w-4" /> Save Today&apos;s Attendance Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-24 right-5 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-slide-in-up z-50">
          <UserCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-slate-400">Success</p>
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast((t) => ({ ...t, show: false }))}
            className="text-slate-400 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
