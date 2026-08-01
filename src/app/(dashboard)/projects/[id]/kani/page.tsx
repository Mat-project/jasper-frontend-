"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TransmittalEmailRedirectPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/projects/${id}?tab=Transmittals`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Redirecting to Transmittal Workspace...</p>
      </div>
    </div>
  );
}
