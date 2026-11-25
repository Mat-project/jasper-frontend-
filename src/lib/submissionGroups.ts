/**
 * Shared helpers for grouping multi-ZIP uploads by their logical submission number (e.g. SUB-001).
 * When additional ZIP batches are appended to an existing submission, the backend stores
 * multiple ZipPackage records sharing the same `submission_no`.
 */

export interface ZipPackageLike {
  id: string;
  submission_no?: string | null;
  original_filename: string;
  heading?: string | null;
  mail_number?: string | null;
  lifecycle_status?: string | null;
  is_dispatched?: boolean;
  created_at: string;
}

export interface SubmissionGroup<T extends ZipPackageLike = ZipPackageLike> {
  /** Grouping key (`submission_no` when present, otherwise package `id`). */
  key: string;
  submission_no: string;
  /** Representative ZipPackage ID (prefers activeSubmissionId when present in group, else newest). */
  primaryId: string;
  /** All ZipPackage IDs belonging to this logical submission. */
  zipIds: string[];
  /** Member ZipPackages sorted oldest to newest to preserve upload order. */
  packages: T[];
  /** Latest created_at timestamp among member packages. */
  created_at: string;
  is_dispatched: boolean;
  mail_number?: string | null;
  lifecycle_status?: string | null;
}

export function groupSubmissions<T extends ZipPackageLike>(
  submissions: T[],
  activeSubmissionId?: string | null
): SubmissionGroup<T>[] {
  const byKey = new Map<string, T[]>();

  for (const sub of submissions) {
    const key = sub.submission_no?.trim() || sub.id;
    const list = byKey.get(key) || [];
    list.push(sub);
    byKey.set(key, list);
  }

  const groups: SubmissionGroup<T>[] = [];
  for (const [key, pkgs] of byKey.entries()) {
    const oldestFirst = [...pkgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const newest = oldestFirst[oldestFirst.length - 1];
    const activeMatch = activeSubmissionId
      ? oldestFirst.find((p) => p.id === activeSubmissionId)
      : undefined;

    const mailPkg = oldestFirst.find((p) => Boolean(p.mail_number));
    const isDispatched = oldestFirst.some(
      (p) => Boolean(p.is_dispatched) || p.lifecycle_status === "Closed"
    );

    groups.push({
      key,
      submission_no: newest.submission_no?.trim() || key,
      primaryId: activeMatch ? activeMatch.id : newest.id,
      zipIds: oldestFirst.map((p) => p.id),
      packages: oldestFirst,
      created_at: newest.created_at,
      is_dispatched: isDispatched,
      mail_number: mailPkg?.mail_number ?? null,
      lifecycle_status: isDispatched ? "Closed" : newest.lifecycle_status ?? null,
    });
  }

  return groups.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function findGroupByPackageId<T extends ZipPackageLike>(
  groups: SubmissionGroup<T>[],
  packageId?: string | null
): SubmissionGroup<T> | undefined {
  if (!packageId) return undefined;
  return groups.find((g) => g.zipIds.includes(String(packageId)));
}

export function formatSubmissionGroupOption<T extends ZipPackageLike>(
  group: SubmissionGroup<T>,
  maxNameLen = 50
): string {
  const dateStr = new Date(group.created_at).toLocaleDateString();
  if (group.packages.length === 1) {
    const rawName = group.packages[0].original_filename || "";
    const fname =
      rawName.length > maxNameLen
        ? rawName.substring(0, Math.max(10, maxNameLen - 3)) + "..."
        : rawName;
    return `${group.submission_no} — ${fname} (${dateStr})`;
  }
  const latestName = group.packages[group.packages.length - 1].original_filename || "";
  const shortLatest =
    latestName.length > 35 ? latestName.substring(0, 32) + "..." : latestName;
  return `${group.submission_no} — ${group.packages.length} ZIPs (${shortLatest}, ${dateStr})`;
}
