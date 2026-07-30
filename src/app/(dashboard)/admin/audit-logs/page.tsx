"use client";

import React, { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/api/audit";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    entity_type: "all",
    action: "",
  });

  const fetchLogs = async (currentPage = 1) => {
    setLoading(true);
    try {
      const params: any = { page: currentPage };
      if (filters.entity_type !== "all") params.entity_type = filters.entity_type;
      if (filters.action) params.action = filters.action;

      const data = await getAuditLogs(params);
      setLogs(data.results || data);
      
      if (data.count) {
        setTotalPages(Math.ceil(data.count / 20)); // Assuming page size 20
      }
    } catch (err: any) {
      toast({
        title: "Error fetching logs",
        description: err.response?.data?.error || "Could not load audit logs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page, filters]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            View system-wide user actions and security events.
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.entity_type}
            onValueChange={(val) => setFilters({ ...filters, entity_type: val })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Module/Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="Project">Projects</SelectItem>
              <SelectItem value="Register">Registers</SelectItem>
              <SelectItem value="Relationship">Relationships</SelectItem>
              <SelectItem value="Document">Documents</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Filter by Action (e.g. UPLOAD)"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="w-[200px]"
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>IP & Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    {log.user_name}
                    <br />
                    <span className="text-xs text-muted-foreground">{log.user_email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>{log.entity_type}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.description || ""}>
                    {log.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {log.ip_address || "N/A"}
                      <br />
                      <span className="text-muted-foreground">
                        {log.request_method} {log.api_endpoint}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <span className="text-sm font-medium">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
