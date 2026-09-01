"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import type { LoginCredentials } from "@/types/user";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState<LoginCredentials>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form);
    } catch (err: any) {
      const data = err?.response?.data;
      let errorMsg = "Invalid credentials. Please check your email and password.";
      if (data) {
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
          errorMsg = data.non_field_errors[0];
        } else if (typeof data.error === "string") {
          errorMsg = data.error;
        } else if (typeof data.message === "string") {
          errorMsg = data.message;
        } else if (data.error?.message) {
          errorMsg = data.error.message;
        }
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl animate-fade-in">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-500 mb-4 shadow-lg">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <h1 className="text-2xl font-bold text-white">EOMS</h1>
        <p className="text-sm text-white/60 mt-1">Engineering Operations Management</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-4 py-3 animate-fade-in">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white/80">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => {
              if (error) setError(null);
              setForm((f) => ({ ...f, email: e.target.value }));
            }}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-white/80">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => {
                if (error) setError(null);
                setForm((f) => ({ ...f, password: e.target.value }));
              }}
              className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 pl-4 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-white/20 text-slate-200 hover:text-white transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-brand-400" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm transition-all duration-200 shadow-lg hover:shadow-brand-500/25 mt-2"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs text-white/40 mt-6">
        © {new Date().getFullYear()} EOMS. All rights reserved.
      </p>
    </div>
  );
}
