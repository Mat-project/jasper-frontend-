"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileText, FolderKanban, History, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/client";

interface SearchResult {
  id: string;
  project_id: string;
  project_name: string;
  register: string;
  register_version: string;
  document_type: string;
  drawing_number: string;
  file_name: string;
}

interface SearchHistoryItem {
  query: string;
  timestamp: string;
  result_count: number;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search history when opened
  const fetchHistory = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/v1/search/history/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch(`http://localhost:8000/api/v1/search/?q=${encodeURIComponent(debouncedQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (e) {
        console.error(e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleFocus = () => {
    setIsOpen(true);
    if (!query && history.length === 0) {
      fetchHistory();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    // result.id is in format "{row_id}-{type}"
    const rowId = result.id.split('-')[0];
    router.push(`/projects/${result.project_id}?tab=Review&row=${rowId}`);
  };

  return (
    <div className="relative w-full max-w-xl ml-8" ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search drawing numbers, BBS, projects..."
          className="w-full h-10 pl-9 pr-10 rounded-full border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm outline-none placeholder:text-muted-foreground/70 shadow-sm"
        />
        {loading ? (
          <Loader2 className="absolute right-3 h-4 w-4 text-muted-foreground animate-spin" />
        ) : query ? (
          <button 
            onClick={() => { setQuery(""); setResults([]); document.querySelector('input')?.focus() }}
            className="absolute right-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isOpen && (query.length > 0 || history.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[500px]">
          
          {/* Active Search Results */}
          {query.length > 0 && (
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-2 flex items-center justify-between border-b border-border/50 bg-muted/10">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Search Results ({results.length})
                </span>
                {results.length > 0 && (
                  <span className="text-[10px] bg-brand-500/10 text-brand-600 px-2 py-0.5 rounded-full font-semibold">
                    Ranked by Relevance
                  </span>
                )}
              </div>
              
              {results.length === 0 && !loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No documents found matching &quot;{query}&quot;
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {results.map((result, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleResultClick(result)}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group flex gap-4 items-start"
                    >
                      <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        result.document_type === 'Drawing' 
                          ? 'bg-blue-500/10 text-blue-600' 
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-foreground truncate group-hover:text-brand-600 transition-colors">
                            {result.drawing_number}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold border ${
                            result.document_type === 'Drawing' 
                              ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' 
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800'
                          }`}>
                            {result.document_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {result.file_name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/80 font-medium">
                          <div className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {result.project_name}
                          </div>
                          <span>•</span>
                          <div>{result.register} ({result.register_version})</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search History (only show if query is empty) */}
          {!query && history.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-border/50 bg-muted/10">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Searches
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {history.map((h, i) => (
                  <div 
                    key={i} 
                    onClick={() => { setQuery(h.query); document.querySelector('input')?.focus(); }}
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between group border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-muted-foreground/50 group-hover:text-brand-500 transition-colors" />
                      <span className="text-sm font-medium text-foreground">{h.query}</span>
                    </div>
                    <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                      {h.result_count} results
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
