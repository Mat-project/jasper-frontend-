"use client";

/**
 * WorkspaceProvider
 *
 * Single source of truth for the active workspace context within one project.
 * All Register AI tabs (Extraction, Relationships, Review, Revisions,
 * Transmittals) consume this shared state — there is exactly one
 * `getWorkspace` network call per project page load.
 *
 * Persistence: the backend stores active_submission per (user, project) row.
 * Reloading or re-logging restores the same active submission automatically.
 *
 * Multi-project isolation: this provider is mounted inside the [id] page,
 * so each project gets its own instance with its own state.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getWorkspace,
  updateWorkspace,
  WorkspaceContext as WorkspaceContextType,
} from "@/lib/api/register_ai";
import { NewerSubmissionModal } from "@/components/NewerSubmissionModal";

// ─── Context value shape ──────────────────────────────────────────────────────

interface WorkspaceCtxValue {
  /** Null while the initial load is still in flight. */
  workspace: WorkspaceContextType | null;
  /** True only during the very first network fetch. */
  loading: boolean;
  /**
   * Re-fetch workspace from the server and update shared state.
   * Call this after uploading a new ZIP or switching a submission.
   */
  refreshWorkspace: () => Promise<void>;
  /**
   * Switch the active submission and update all consumers immediately.
   * Writes to the backend and then refreshes shared state.
   */
  switchSubmission: (submissionId: string) => Promise<void>;
  /** Convenience getter — the active submission id (or null). */
  activeSubmissionId: string | null;
  /** Convenience getter — the active submission_no label (or null). */
  activeSubmissionNo: string | null;
  /**
   * True when workspace.newer_submission_available is true and the user
   * has not yet dismissed the modal this session.
   */
  showNewerModal: boolean;
  dismissNewerModal: () => void;
}

const WorkspaceCtx = createContext<WorkspaceCtxValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectWorkspace(): WorkspaceCtxValue {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) {
    throw new Error(
      "useProjectWorkspace must be used inside <WorkspaceProvider>. " +
        "Make sure the [id]/page.tsx wraps its content with <WorkspaceProvider projectId={id}>."
    );
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface WorkspaceProviderProps {
  projectId: string;
  children: React.ReactNode;
}

export function WorkspaceProvider({ projectId, children }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState<WorkspaceContextType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewerModal, setShowNewerModal] = useState(false);

  // Track whether we've already shown the newer-submission modal this session
  // so we don't re-show it on every polling cycle.
  const newerModalShownRef = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const refreshWorkspace = useCallback(async () => {
    try {
      const ws = await getWorkspace(projectId);
      setWorkspace(ws);

      // Only show the newer-submission modal once per session
      if (ws.newer_submission_available && !newerModalShownRef.current) {
        newerModalShownRef.current = true;
        setShowNewerModal(true);
      }
    } catch (err) {
      console.error("[WorkspaceProvider] Failed to fetch workspace:", err);
    }
  }, [projectId]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ws = await getWorkspace(projectId);
        if (cancelled) return;
        setWorkspace(ws);

        if (ws.newer_submission_available && !newerModalShownRef.current) {
          newerModalShownRef.current = true;
          setShowNewerModal(true);
        }
      } catch (err) {
        console.error("[WorkspaceProvider] Initial workspace load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ── Listen for processing-completed events from AIRegisterTab ─────────────
  // When a ZIP finishes processing, refresh so all tabs pick up the new
  // active_submission immediately. The backend already auto-sets the active
  // submission on completion (tasks.py), so a refresh is enough.
  useEffect(() => {
    const handler = () => {
      // Small delay so the backend workspace update has settled
      setTimeout(() => refreshWorkspace(), 500);
    };
    window.addEventListener("zip-processing-completed", handler);
    return () => window.removeEventListener("zip-processing-completed", handler);
  }, [refreshWorkspace]);

  // ── Switch submission ──────────────────────────────────────────────────────
  const switchSubmission = useCallback(
    async (submissionId: string) => {
      try {
        await updateWorkspace(projectId, {
          active_submission_id: submissionId,
          current_stage: "Relationship",
        });
        await refreshWorkspace();
      } catch (err) {
        console.error("[WorkspaceProvider] Failed to switch submission:", err);
      }
    },
    [projectId, refreshWorkspace]
  );

  // ── Modal dismissal ────────────────────────────────────────────────────────
  const dismissNewerModal = useCallback(() => {
    setShowNewerModal(false);
  }, []);

  // ── Convenience getters (memoized to keep consumers stable) ────────────────
  const activeSubmissionId = workspace?.active_submission ?? null;
  const activeSubmissionNo = workspace?.submission_no ?? null;

  const value = useMemo<WorkspaceCtxValue>(
    () => ({
      workspace,
      loading,
      refreshWorkspace,
      switchSubmission,
      activeSubmissionId,
      activeSubmissionNo,
      showNewerModal,
      dismissNewerModal,
    }),
    [
      workspace,
      loading,
      refreshWorkspace,
      switchSubmission,
      activeSubmissionId,
      activeSubmissionNo,
      showNewerModal,
      dismissNewerModal,
    ]
  );

  return (
    <WorkspaceCtx.Provider value={value}>
      {children}
      {/* Single, page-level newer-submission prompt. Previously this was
          rendered inside AIRegisterTab; centralizing it here means every
          tab benefits from the prompt without duplicating the modal. */}
      {workspace && (
        <NewerSubmissionModal
          isOpen={showNewerModal}
          workspace={workspace}
          onClose={dismissNewerModal}
          onSwitch={() => {
            // The modal calls updateWorkspace internally; refresh afterwards.
            refreshWorkspace();
          }}
        />
      )}
    </WorkspaceCtx.Provider>
  );
}
