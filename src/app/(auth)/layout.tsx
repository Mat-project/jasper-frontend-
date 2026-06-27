/**
 * Auth layout — centers auth pages (login, etc.)
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
